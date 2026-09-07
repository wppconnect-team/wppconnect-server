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
import bcrypt from 'bcrypt';
import express from 'express';
import { promises as fs } from 'fs';
import { createServer, Server as HttpServer } from 'http';
import { AddressInfo } from 'net';
import os from 'os';
import path from 'path';
import { Server } from 'socket.io';
import { io as connect, Socket } from 'socket.io-client';

import { clientsArray } from '../util/sessionUtil';
import { managerRoutes } from './routes';
import { emitManager, installManagerSocket } from './socket';
import { installManagerStatic } from './static';

const saved = new Set<string>(['alpha']);
jest.mock('../util/tokenStore/factory', () => ({
  __esModule: true,
  default: class {
    createTokenStory() {
      return {
        listTokens: async () => [...saved],
        removeToken: async (s: string) => saved.delete(s),
      };
    }
  },
}));
jest.mock('../util/sessionUtil', () => ({ clientsArray: {} }));

describe('Manager HTTP and authenticated events', () => {
  let http: HttpServer;
  let socketServer: Server;
  let base: string;
  let directory: string;
  const sockets: Socket[] = [];
  beforeAll(async () => {
    directory = await fs.mkdtemp(path.join(os.tmpdir(), 'wpp-manager-test-'));
    await fs.writeFile(
      path.join(directory, 'index.html'),
      '<html>Manager fixture</html>'
    );
    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      req.serverOptions = {
        secretKey: 'test-secret',
        customUserDataDir: directory,
      } as any;
      next();
    });
    app.use('/api/manager', managerRoutes);
    installManagerStatic(app, directory);
    app.get('/api/legacy', (_req, res) => res.json({ legacy: true }));
    http = createServer(app);
    socketServer = new Server(http);
    installManagerSocket(socketServer, 'test-secret');
    await new Promise<void>((resolve) => http.listen(0, '127.0.0.1', resolve));
    base = `http://127.0.0.1:${(http.address() as AddressInfo).port}`;
  });
  afterAll(async () => {
    sockets.forEach((s) => s.disconnect());
    await new Promise<void>((resolve) => socketServer.close(() => resolve()));
    // The exact mkdtemp directory is the only deletion target.
    if (path.dirname(directory) !== path.resolve(os.tmpdir()))
      throw Error('Invalid cleanup directory');
    await fs.rm(directory, { recursive: true, force: true });
  });
  async function request(
    endpoint: string,
    token = 'test-secret',
    method = 'GET'
  ) {
    return fetch(`${base}/api/manager${endpoint}`, {
      method,
      headers: { Authorization: `Bearer ${token}` },
    });
  }
  test('requires administration credentials and never returns them in discovery', async () => {
    expect((await request('/sessions', 'bad')).status).toBe(401);
    const res = await request('/sessions');
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(await res.json()).toEqual({
      sessions: [{ session: 'alpha', status: 'CLOSED' }],
    });
    expect(await (await request('/info')).text()).not.toContain('test-secret');
  });
  test('issued tokens authorize only the named session, not administration', async () => {
    const { token } = (await (
      await request('/sessions/alpha/token', 'test-secret', 'POST')
    ).json()) as any;
    expect(
      await bcrypt.compare(
        'alphatest-secret',
        token.replace(/_/g, '/').replace(/-/g, '+')
      )
    ).toBe(true);
    expect((await request('/sessions', token)).status).toBe(401);
    const verify = (session: string) =>
      fetch(`${base}/api/manager/verify`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ session }),
      });
    expect((await verify('alpha')).status).toBe(200);
    expect((await verify('beta')).status).toBe(401);
  });
  test.each(['..%2foutside', 'constructor', 'length', 'bad%3Aname'])(
    'rejects unsafe session %s',
    async (session) => {
      expect(
        (await request(`/sessions/${session}/token`, 'test-secret', 'POST'))
          .status
      ).toBe(400);
    }
  );
  test('cannot clear active sessions; clears only a closed session and its stored token', async () => {
    (clientsArray as any).alpha = { status: 'CONNECTED' };
    await fs.mkdir(path.join(directory, 'alpha'));
    await fs.writeFile(path.join(directory, 'alpha', 'data'), 'fixture');
    expect(
      (await request('/sessions/alpha', 'test-secret', 'DELETE')).status
    ).toBe(409);
    expect(saved.has('alpha')).toBe(true);
    (clientsArray as any).alpha = { status: null };
    expect(
      (await request('/sessions/alpha', 'test-secret', 'DELETE')).status
    ).toBe(200);
    expect(saved.has('alpha')).toBe(false);
    await expect(fs.stat(path.join(directory, 'alpha'))).rejects.toThrow();
  });
  test('serves deep links without intercepting API or missing assets', async () => {
    expect((await fetch(`${base}/manager/`)).status).toBe(200);
    expect(
      await (await fetch(`${base}/manager/sessions/alpha`)).text()
    ).toContain('Manager fixture');
    expect((await fetch(`${base}/manager/missing.js`)).status).toBe(404);
    expect(await (await fetch(`${base}/api/legacy`)).json()).toEqual({
      legacy: true,
    });
  });
  test('disabling the Manager does not register static routes', async () => {
    process.env.MANAGER_ENABLED = 'false';
    const app = express();
    installManagerStatic(app, directory);
    delete process.env.MANAGER_ENABLED;
    expect(app._router).toBeUndefined();
  });
  test('rejects unauthenticated sockets and cross-session tokens', async () => {
    const token = await bcrypt.hash('alphatest-secret', 10);
    for (const auth of [{}, { session: 'beta', token }]) {
      const socket = connect(`${base}/manager`, { auth, reconnection: false });
      sockets.push(socket);
      const error = await new Promise<Error>((resolve) =>
        socket.once('connect_error', resolve)
      );
      expect(error.message).toBe('Unauthorized');
      socket.disconnect();
    }
  });
  test('only the authorized room receives its messages; legacy socket still connects', async () => {
    const alpha = connect(`${base}/manager`, {
      auth: {
        session: 'alpha',
        token: await bcrypt.hash('alphatest-secret', 10),
      },
    });
    const beta = connect(`${base}/manager`, {
      auth: {
        session: 'beta',
        token: await bcrypt.hash('betatest-secret', 10),
      },
    });
    const legacy = connect(base);
    sockets.push(alpha, beta, legacy);
    await Promise.all(
      [alpha, beta, legacy].map((s) =>
        s.connected
          ? Promise.resolve()
          : new Promise<void>((resolve) => s.once('connect', resolve))
      )
    );
    const received: any[] = [];
    beta.on('message', (message) => received.push(message));
    const response = new Promise<any>((resolve) =>
      alpha.once('message', resolve)
    );
    emitManager(socketServer, 'alpha', 'message', { body: 'only alpha' });
    expect(await response).toEqual({
      session: 'alpha',
      data: { body: 'only alpha' },
    });
    const barrier = new Promise<void>((resolve) =>
      beta.once('barrier', resolve)
    );
    socketServer.of('/manager').to('session:beta').emit('barrier');
    await barrier;
    expect(received).toEqual([]);
  });
});
