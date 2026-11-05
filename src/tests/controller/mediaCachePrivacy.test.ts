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
import { randomUUID } from 'crypto';
import { existsSync, promises as fs } from 'fs';
import { createServer, Server } from 'http';
import { AddressInfo } from 'net';
import path from 'path';

import { initServer } from '../..';
import { clearVerifiedTokens } from '../../middleware/auth';
import { clientsArray } from '../../util/sessionUtil';

// Observe the real bootstrap's HTTP server so this test can close it afterward.
jest.mock('http', () => {
  const actual = jest.requireActual('http');
  return { ...actual, createServer: jest.fn(actual.createServer) };
});
jest.mock('../../util/logger', () => ({
  createLogger: () => ({ info: jest.fn(), error: jest.fn(), warn: jest.fn() }),
}));
jest.mock('../../util/functions', () => ({
  ...jest.requireActual('../../util/functions'),
  createFolders: jest.fn(),
  setMaxListners: jest.fn(),
  startAllSessions: jest.fn(),
}));

const secret = 'media-cache-fixture-secret';
const mediaDirectory = path.resolve('WhatsAppImages');
const sessions = ['media-fixture-alpha', 'media-fixture-beta'];
const filenames = sessions.map(() => `file${randomUUID()}.webp`);
const tokens: string[] = [];
let http: Server;
let base: string;
let ownsDirectory = false;
const oldPort = process.env.PORT;
const oldManager = process.env.MANAGER_ENABLED;

beforeAll(async () => {
  ownsDirectory = !existsSync(mediaDirectory);
  await fs.mkdir(mediaDirectory, { recursive: true });
  for (const [i, session] of sessions.entries()) {
    await fs.writeFile(
      path.join(mediaDirectory, filenames[i]),
      `private-${i}`,
      {
        flag: 'wx',
      }
    );
    tokens[i] = await bcrypt.hash(session + secret, 4);
    clientsArray[session] = {
      status: 'CONNECTED',
      isConnected: jest.fn(async () => true),
      getMessageById: jest.fn(async () => ({ mimetype: 'image/webp' })),
      decryptFile: jest.fn(async () => Buffer.from(`private-${i}`)),
    } as any;
  }
  process.env.PORT = '0';
  process.env.MANAGER_ENABLED = 'false';
  initServer({ port: 0, startAllSession: false, secretKey: secret });
  http = (createServer as jest.Mock).mock.results[0].value;
  if (!http.listening)
    await new Promise<void>((resolve) => http.once('listening', resolve));
  base = `http://127.0.0.1:${(http.address() as AddressInfo).port}`;
});

afterAll(async () => {
  if (http) {
    http.closeAllConnections();
    await new Promise<void>((resolve, reject) =>
      http.close((error) => (error ? reject(error) : resolve()))
    );
  }
  clearVerifiedTokens();
  for (const session of sessions) delete clientsArray[session];
  for (const filename of filenames) {
    const target = path.join(mediaDirectory, filename);
    if (path.dirname(target) !== mediaDirectory)
      throw new Error('Invalid fixture cleanup path');
    await fs.rm(target, { force: true });
  }
  if (ownsDirectory) await fs.rmdir(mediaDirectory);
  if (oldPort === undefined) delete process.env.PORT;
  else process.env.PORT = oldPort;
  if (oldManager === undefined) delete process.env.MANAGER_ENABLED;
  else process.env.MANAGER_ENABLED = oldManager;
});

function request(endpoint: string, options: RequestInit = {}) {
  return fetch(base + endpoint, {
    ...options,
    signal: AbortSignal.timeout(3000),
  });
}

it.each(['GET', 'HEAD'])(
  'never exposes cached files through %s',
  async (method) => {
    for (const filename of filenames) {
      const res = await request(`/files/${filename}`, { method });
      expect(res.status).toBe(404);
      expect(await res.text()).not.toContain('private-');
    }
  }
);

it('does not expose cache bytes through Range requests or a different session token', async () => {
  const attempts: Record<string, string>[] = [
    { Range: 'bytes=0-3' },
    { Authorization: `Bearer ${tokens[0]}` },
  ];
  for (const headers of attempts) {
    const res = await request(`/files/${filenames[1]}`, { headers });
    expect(res.status).toBe(404);
    expect(await res.text()).not.toContain('private-1');
  }
});

it.each([0, 1])(
  'preserves authenticated media reads for session %s',
  async (i) => {
    const res = await request(
      `/api/${sessions[i]}/get-media-by-message/fixture`,
      {
        headers: { Authorization: `Bearer ${tokens[i]}` },
      }
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      base64: Buffer.from(`private-${i}`).toString('base64'),
      mimetype: 'image/webp',
    });
  }
);

it('rejects anonymous and cross-session media reads', async () => {
  const endpoint = `/api/${sessions[1]}/get-media-by-message/fixture`;
  expect((await request(endpoint)).status).toBe(401);
  expect(
    (
      await request(endpoint, {
        headers: { Authorization: `Bearer ${tokens[0]}` },
      })
    ).status
  ).toBe(401);
});

it('preserves authenticated media downloads and public API documentation', async () => {
  const res = await request(`/api/${sessions[0]}/download-media`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokens[0]}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ messageId: 'fixture' }),
  });
  expect(res.status).toBe(200);
  expect(await res.json()).toMatchObject({
    base64: Buffer.from('private-0').toString('base64'),
  });
  expect((await request('/api-docs/')).status).toBe(200);
});
