/*
 * Copyright 2026 WPPConnect Team
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
import bcrypt from 'bcrypt';
import express from 'express';
import { Server } from 'http';
import { AddressInfo } from 'net';

import verifyToken, { clearVerifiedTokens } from '../../middleware/auth';
import routes from '../../routes';
import { clientsArray } from '../../util/sessionUtil';

jest.mock('../..', () => ({ logger: { error: jest.fn(), info: jest.fn() } }));

const SECRET = 'chatwoot-test-secret';
const SESSION = 'chatwoot-fixture';
let token: string;
let server: Server;
let origin: string;
let client: any;

function payload() {
  return {
    event: 'message_created',
    message_type: 'outgoing',
    conversation: {
      meta: { sender: { phone_number: '+5511999999999' } },
      messages: [{ content: 'fixture message' }],
    },
  };
}

async function post(body: any, credential?: string, session = SESSION) {
  return fetch(`${origin}/api/${session}/chatwoot`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(credential ? { Authorization: `Bearer ${credential}` } : {}),
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(3000),
  });
}

beforeAll(async () => {
  token = await bcrypt.hash(SESSION + SECRET, 4);
  const app = express();
  app.use(express.json());
  app.use((req: any, _res, next) => {
    req.serverOptions = { secretKey: SECRET };
    req.logger = { error: jest.fn() };
    next();
  });
  app.use(routes);
  server = await new Promise<Server>((resolve) => {
    const listening = app.listen(0, '127.0.0.1', () => resolve(listening));
  });
  origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(async () => {
  server.closeAllConnections();
  await new Promise<void>((resolve, reject) =>
    server.close((err) => (err ? reject(err) : resolve()))
  );
});

beforeEach(() => {
  clearVerifiedTokens();
  for (const session of Object.keys(clientsArray)) delete clientsArray[session];
  client = {
    status: 'CONNECTED',
    isConnected: jest.fn(async () => true),
    sendText: jest.fn(async () => ({})),
    sendFile: jest.fn(async () => ({})),
    sendPtt: jest.fn(async () => ({})),
    config: { chatWoot: { baseURL: 'https://chatwoot.example.test' } },
  };
  clientsArray[SESSION] = client;
});

afterEach(() => {
  for (const session of Object.keys(clientsArray)) delete clientsArray[session];
});

it.each(['text', 'file', 'audio'])(
  'rejects anonymous %s before any client access',
  async (kind) => {
    const body: any = payload();
    if (kind !== 'text')
      body.conversation.messages[0].attachments = [
        {
          file_type: kind,
          data_url: 'https://chatwoot.example.test/rails/fixture',
        },
      ];
    expect((await post(body)).status).toBe(401);
    expect(client.isConnected).not.toHaveBeenCalled();
    expect(client.sendText).not.toHaveBeenCalled();
    expect(client.sendFile).not.toHaveBeenCalled();
    expect(client.sendPtt).not.toHaveBeenCalled();
  }
);

it('rejects a malformed token and a token belonging to another session', async () => {
  const otherToken = await bcrypt.hash('other-session' + SECRET, 4);
  for (const credential of ['invalid-token', otherToken]) {
    expect((await post(payload(), credential)).status).toBe(401);
  }
  expect(client.isConnected).not.toHaveBeenCalled();
  expect(client.sendText).not.toHaveBeenCalled();
});

it('sends with a valid Bearer token using the nested Chatwoot recipient', async () => {
  expect((await post(payload(), token)).status).toBe(200);
  expect(client.sendText).toHaveBeenCalledWith(
    '5511999999999@c.us',
    'fixture message'
  );
});

it('normalizes the supported token-in-session webhook URL to the authenticated client', async () => {
  const encoded = token.replace(/\//g, '_').replace(/\+/g, '-');
  expect(
    (await post(payload(), undefined, `${SESSION}:${encoded}`)).status
  ).toBe(200);
  expect(client.sendText).toHaveBeenCalledTimes(1);
});

it.each(['missing', 'closing', 'disconnected'])(
  'returns promptly for a %s session',
  async (state) => {
    if (state === 'missing') delete clientsArray[SESSION];
    if (state === 'closing') client.status = 'CLOSING';
    if (state === 'disconnected') client.isConnected.mockResolvedValue(false);
    expect((await post(payload(), token)).status).toBe(409);
    expect(client.sendText).not.toHaveBeenCalled();
  }
);

it.each(['incoming', 'private', 'status'])(
  'acknowledges %s events without sending',
  async (kind) => {
    const body: any = payload();
    if (kind === 'incoming') body.message_type = 'incoming';
    if (kind === 'private') body.private = true;
    if (kind === 'status') body.event = 'conversation_status_changed';
    expect((await post(body, token)).status).toBe(200);
    expect(client.sendText).not.toHaveBeenCalled();
  }
);

it('requires authentication on every session route except explicit bootstrap/admin endpoints', () => {
  const exceptions = new Set([
    '/api/:session/:secretkey/generate-token',
    '/api/:session/:secretkey/clear-session-data',
    '/api/:session/set-limit',
  ]);
  const unguarded = routes.stack
    .filter((layer: any) => layer.route?.path.startsWith('/api/:session/'))
    .filter((layer: any) => !exceptions.has(layer.route.path))
    .filter(
      (layer: any) =>
        !layer.route.stack.some((entry: any) => entry.handle === verifyToken)
    )
    .map((layer: any) => layer.route.path);
  expect(unguarded).toEqual([]);
});

it.each(['file', 'audio'])(
  'preserves authenticated %s attachment delivery',
  async (kind) => {
    const body: any = payload();
    body.conversation.messages[0].attachments = [
      {
        file_type: kind,
        data_url: 'https://chatwoot.example.test/rails/fixture',
      },
    ];
    expect((await post(body, token)).status).toBe(200);
    const send = kind === 'audio' ? client.sendPtt : client.sendFile;
    expect(send).toHaveBeenCalledWith(
      '5511999999999@c.us',
      'https://chatwoot.example.test/rails/fixture',
      kind === 'audio' ? 'Voice Audio' : 'file',
      'fixture message'
    );
    expect(client.sendText).not.toHaveBeenCalled();
  }
);
