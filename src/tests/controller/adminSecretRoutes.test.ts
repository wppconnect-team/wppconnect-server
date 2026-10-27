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
import express from 'express';
import { Server } from 'http';
import { AddressInfo } from 'net';

import routes from '../../routes';

jest.mock('../..', () => ({ logger: { error: jest.fn(), info: jest.fn() } }));
jest.mock('../../util/manageSession', () => ({
  backupSessions: jest.fn(async (req) =>
    req.res.send(Buffer.from('zip fixture'))
  ),
  restoreSessions: jest.fn(),
}));
jest.mock('../../util/getAllTokens', () => ({
  __esModule: true,
  default: jest.fn(async () => ['fixture-session']),
}));

const { backupSessions } = jest.requireMock('../../util/manageSession');
const getAllTokens = jest.requireMock('../../util/getAllTokens').default;
let server: Server;
let origin: string;
beforeAll(async () => {
  const app = express();
  app.use(express.json());
  app.use((req: any, _res, next) => {
    req.serverOptions = { secretKey: 'admin-test-key' };
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
beforeEach(() => jest.clearAllMocks());

it.each(['show-all-sessions', 'backup-sessions'])(
  'retires successful secret-in-URL GET for %s',
  async (action) => {
    const response = await fetch(`${origin}/api/admin-test-key/${action}`);
    expect(response.status).toBe(410);
    expect(await response.text()).not.toContain('admin-test-key');
    expect(backupSessions).not.toHaveBeenCalled();
    expect(getAllTokens).not.toHaveBeenCalled();
  }
);

it.each(['show-all-sessions', 'backup-sessions'])(
  'requires an operator secret header before executing %s',
  async (action) => {
    const invalidHeaders: Record<string, string>[] = [
      {},
      { 'x-secret-key': 'wrong-key' },
    ];
    for (const headers of invalidHeaders) {
      const response = await fetch(`${origin}/api/${action}`, {
        method: 'POST',
        headers,
      });
      expect(response.status).toBe(400);
    }
    expect(backupSessions).not.toHaveBeenCalled();
    expect(getAllTokens).not.toHaveBeenCalled();
  }
);

it('lists sessions using the configured header secret', async () => {
  const response = await fetch(`${origin}/api/show-all-sessions`, {
    method: 'POST',
    headers: { 'x-secret-key': 'admin-test-key' },
  });
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ response: ['fixture-session'] });
  expect(getAllTokens).toHaveBeenCalledTimes(1);
});

it('streams the backup using the instance-specific header secret', async () => {
  const response = await fetch(`${origin}/api/backup-sessions`, {
    method: 'POST',
    headers: { 'x-secret-key': 'admin-test-key' },
  });
  expect(response.status).toBe(200);
  expect(response.headers.get('content-type')).toContain('application/zip');
  expect(await response.text()).toBe('zip fixture');
  expect(backupSessions).toHaveBeenCalledTimes(1);
});
