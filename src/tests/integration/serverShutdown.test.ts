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
import { FastifyInstance } from 'fastify';
import { createServer } from 'http';
import { AddressInfo } from 'net';
import { io as connect, Socket } from 'socket.io-client';

import { initServer } from '../../index';

// Keep the real HTTP factory and transports; isolate unrelated provider startup,
// application routes, authentication and filesystem effects from shutdown.
jest.mock('@wppconnect-team/wppconnect', () => ({ defaultLogger: {} }));
jest.mock('../../config', () => ({
  __esModule: true,
  default: {
    port: 0,
    host: 'http://localhost',
    secretKey: 'shutdown-test',
    log: { level: 'info' },
    mapper: { enable: false },
    startAllSession: false,
  },
}));
jest.mock('../../routes', () => ({
  __esModule: true,
  default: jest.requireActual<typeof import('express')>('express').Router(),
}));
jest.mock('../../manager/routes', () => ({
  managerRoutes: jest
    .requireActual<typeof import('express')>('express')
    .Router(),
}));
jest.mock('../../manager/socket', () => ({ installManagerSocket: jest.fn() }));
jest.mock('../../manager/static', () => ({ installManagerStatic: jest.fn() }));
jest.mock('../../mapper', () => ({ convert: jest.fn() }));
jest.mock('../../middleware/errorHandler', () => ({
  providerErrorHandler: (error, _req, _res, next) => next(error),
}));
jest.mock('../../util/callMediaUtil', () => ({
  configureCallMediaNamespace: jest.fn(),
  isCallMediaActive: jest.fn(),
}));
jest.mock('../../util/callUtil', () => ({ pushOutgoingPcm16: jest.fn() }));
jest.mock('../../util/functions', () => ({
  createFolders: jest.fn(),
  setMaxListners: jest.fn(),
  startAllSessions: jest.fn(),
}));
jest.mock('../../util/logger', () => ({
  createLogger: () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }),
}));
jest.mock('../../util/sessionUtil', () => ({ clientsArray: {} }));

describe('Embedding HTTP and Socket.IO shutdown', () => {
  const clients: Socket[] = [];
  let app: FastifyInstance;
  const previousPort = process.env.PORT;

  beforeEach(async () => {
    process.env.PORT = '0';
    ({ app } = await initServer({ port: 0, startAllSession: false }));
  });

  afterEach(async () => {
    clients.splice(0).forEach((client) => client.disconnect());
    await app.close();
    if (previousPort === undefined) delete process.env.PORT;
    else process.env.PORT = previousPort;
  });

  async function within<T>(promise: Promise<T>): Promise<T> {
    let timer: ReturnType<typeof setTimeout>;
    try {
      return await Promise.race([
        promise,
        new Promise<never>((_resolve, reject) => {
          timer = setTimeout(
            () => reject(new Error('shutdown timed out')),
            1500
          );
        }),
      ]);
    } finally {
      clearTimeout(timer!);
    }
  }

  async function open(transport: 'websocket' | 'polling'): Promise<Socket> {
    const { port } = app.server.address() as AddressInfo;
    const client = connect(`http://127.0.0.1:${port}`, {
      transports: [transport],
      forceNew: true,
      reconnection: false,
    });
    clients.push(client);
    await within(
      new Promise<void>((resolve, reject) => {
        client.once('connect', resolve);
        client.once('connect_error', reject);
      })
    );
    return client;
  }

  it('closes without any clients and tolerates repeated close', async () => {
    await within(app.close());
    await within(app.close());
    expect(app.server.listening).toBe(false);
  });

  it.each(['websocket', 'polling'] as const)(
    'disconnects an active %s client before completing shutdown',
    async (transport) => {
      const client = await open(transport);
      expect(client.connected).toBe(true);
      const disconnected = new Promise<void>((resolve) =>
        client.once('disconnect', () => resolve())
      );
      const { port } = app.server.address() as AddressInfo;

      await within(Promise.all([app.close(), disconnected]));
      expect(client.connected).toBe(false);
      expect(app.server.listening).toBe(false);

      const replacement = createServer();
      try {
        await new Promise<void>((resolve, reject) => {
          replacement.once('error', reject);
          replacement.listen(port, '0.0.0.0', resolve);
        });
      } finally {
        await new Promise<void>((resolve) =>
          replacement.close(() => resolve())
        );
      }
    }
  );

  it('completes concurrent close calls with multiple connected clients', async () => {
    const sockets = await Promise.all([open('websocket'), open('websocket')]);
    const disconnected = sockets.map(
      (socket) =>
        new Promise<void>((resolve) =>
          socket.once('disconnect', () => resolve())
        )
    );
    await within(Promise.all([app.close(), app.close(), ...disconnected]));
    expect(sockets.every((socket) => !socket.connected)).toBe(true);
  });
});
