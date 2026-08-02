/*
 * Copyright 2021 WPPConnect Team
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { createServer } from 'http';
import { AddressInfo } from 'net';
import { Server } from 'socket.io';
import { io as connect, Socket as ClientSocket } from 'socket.io-client';

import {
  activateCallMedia,
  callMediaRoom,
  configureCallMediaNamespace,
  createMediaTicket,
  deactivateCallMedia,
  emitCallMediaEnded,
  emitIncomingAudio,
  resetCallMediaForTests,
} from '../../util/callMediaUtil';

describe('Call media Socket.IO authorization', () => {
  const clients: ClientSocket[] = [];
  const http = createServer();
  const server = new Server(http);
  const namespace = server.of('/call-media');
  let url: string;

  beforeAll(async () => {
    configureCallMediaNamespace(namespace);
    await new Promise<void>((resolve) => http.listen(0, '127.0.0.1', resolve));
    url = `http://127.0.0.1:${(http.address() as AddressInfo).port}/call-media`;
  });

  afterEach(() => {
    clients.splice(0).forEach((client) => client.close());
    resetCallMediaForTests({ preserveNamespace: true });
  });

  afterAll(async () => {
    clients.splice(0).forEach((client) => client.close());
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  function open(ticket: string): ClientSocket {
    const client = connect(url, {
      auth: { ticket },
      forceNew: true,
      reconnection: false,
      transports: ['websocket'],
    });
    clients.push(client);
    return client;
  }

  it('rejects invalid and reused tickets', async () => {
    const invalid = open('invalid');
    await new Promise<void>((resolve) =>
      invalid.once('connect_error', () => resolve())
    );
    expect(invalid.connected).toBe(false);

    activateCallMedia('session-a', 'call-1');
    const { ticket } = createMediaTicket('session-a', 'call-1');
    const valid = open(ticket);
    await new Promise<void>((resolve) => valid.once('connect', resolve));
    expect(valid.connected).toBe(true);

    const reused = open(ticket);
    await new Promise<void>((resolve) =>
      reused.once('connect_error', () => resolve())
    );
    expect(reused.connected).toBe(false);
  });

  it('delivers incoming audio only to the bound session and call room', async () => {
    activateCallMedia('session-a', 'call-1');
    const first = open(createMediaTicket('session-a', 'call-1').ticket);
    await new Promise<void>((resolve) => first.once('connect', resolve));

    activateCallMedia('session-b', 'call-2');
    const second = open(createMediaTicket('session-b', 'call-2').ticket);
    await new Promise<void>((resolve) => second.once('connect', resolve));

    const received = new Promise<unknown>((resolve) =>
      first.once('incoming-audio', resolve)
    );
    emitIncomingAudio('session-a', 'call-1', {
      data: 'AA==',
      mimeType: 'audio/pcm',
      sequence: 1,
      timestamp: 123,
    });

    await expect(received).resolves.toMatchObject({
      callId: 'call-1',
      data: 'AA==',
    });
    const ended = new Promise<unknown>((resolve) =>
      first.once('call-media-ended', resolve)
    );
    emitCallMediaEnded('session-a', 'call-1');
    await expect(ended).resolves.toMatchObject({ callId: 'call-1' });
    expect(
      namespace.adapter.rooms.has(callMediaRoom('session-a', 'call-1'))
    ).toBe(true);
    expect(
      namespace.adapter.rooms.has(callMediaRoom('session-b', 'call-2'))
    ).toBe(true);

    const disconnected = new Promise<void>((resolve) =>
      first.once('disconnect', () => resolve())
    );
    deactivateCallMedia('session-a', 'call-1');
    await disconnected;
    expect(first.connected).toBe(false);
    expect(second.connected).toBe(true);
  });
});
