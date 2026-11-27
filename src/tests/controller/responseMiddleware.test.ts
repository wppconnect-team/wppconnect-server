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

import type { Request, Response } from 'express';
import { createServer, Server } from 'http';
import { AddressInfo } from 'net';

import { initServer } from '../..';

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
jest.mock('../../routes', () => {
  const router = jest.requireActual('express').Router();
  router.get('/response-fixture/:kind', (req: Request, res: Response) => {
    const values: Record<string, unknown> = {
      empty: undefined,
      null: null,
      number: 42,
      text: 'ok',
      object: { result: true },
      array: [{ id: 1 }],
    };
    const { kind } = req.params;
    if (kind === 'plain') return res.send('ok');
    return res.json(values[kind]);
  });
  return { __esModule: true, default: router };
});

let http: Server;
let base: string;
const oldPort = process.env.PORT;
const oldManager = process.env.MANAGER_ENABLED;

beforeAll(async () => {
  process.env.PORT = '0';
  process.env.MANAGER_ENABLED = 'false';
  initServer({ port: 0, startAllSession: false });
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
  if (oldPort === undefined) delete process.env.PORT;
  else process.env.PORT = oldPort;
  if (oldManager === undefined) delete process.env.MANAGER_ENABLED;
  else process.env.MANAGER_ENABLED = oldManager;
});

it.each([
  ['empty', ''],
  ['null', 'null'],
  ['number', '42'],
  ['text', '"ok"'],
  ['plain', 'ok'],
  ['object', '{"result":true,"session":""}'],
  ['array', '[{"id":1}]'],
])('sends the %s response for a JSON request', async (kind, body) => {
  const response = await fetch(`${base}/response-fixture/${kind}`, {
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(3000),
  });
  expect(response.status).toBe(200);
  expect(await response.text()).toBe(body);
});
