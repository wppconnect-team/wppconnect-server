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
import { readFileSync } from 'fs';
import path from 'path';

import config from '../../config';
import { clearSessionData } from '../../controller/miscController';
import {
  closeSession,
  logOutSession,
  startAllSessions,
  startSession,
} from '../../controller/sessionController';
import { acquireSessionMaintenance } from '../../util/sessionMaintenance';
import { clientsArray } from '../../util/sessionUtil';

jest.mock('../..', () => ({ logger: { error: jest.fn() } }));
jest.mock('fs', () => ({
  readFileSync: jest.requireActual('fs').readFileSync,
  existsSync: jest.fn().mockReturnValue(false),
  promises: { rm: jest.fn() },
}));
jest.mock('../../util/manageSession', () => ({
  backupSessions: jest.fn(),
  restoreSessions: jest.fn(),
}));
jest.mock('../../util/functions', () => ({ callWebHook: jest.fn() }));
jest.mock('../../util/getAllTokens', () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock('../../util/createSessionUtil', () => ({
  __esModule: true,
  default: jest.fn(),
}));

function setup() {
  const client = { status: 'INITIALIZING', session: 'stale' };
  (clientsArray as any).stale = client;
  const req = {
    session: 'stale',
    params: { session: 'stale', secretkey: config.secretKey },
    client,
    io: { emit: jest.fn() },
    logger: { error: jest.fn() },
  };
  const res = { status: jest.fn(), json: jest.fn() };
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  return { req, res };
}

afterEach(() => {
  delete (clientsArray as any).stale;
  jest.useRealTimers();
});

it('clears an INITIALIZING entry without a page or logout method', async () => {
  const { req, res } = setup();
  await clearSessionData(req as any, res as any);
  expect((clientsArray as any).stale).toBeUndefined();
  expect(res.status).toHaveBeenCalledWith(200);
});

it('does not clear registry or files for an invalid secret', async () => {
  const { req, res } = setup();
  req.params.secretkey = 'invalid';
  await clearSessionData(req as any, res as any);
  expect((clientsArray as any).stale).toBe(req.client);
  expect(res.status).toHaveBeenCalledWith(400);
  expect(res.status).toHaveBeenCalledTimes(1);
});

it.each(['../outside', 'nested/session', 'nested\\session', ''])(
  'rejects invalid cleanup session %s before reserving it',
  async (session) => {
    const { req, res } = setup();
    req.params.session = session;
    await clearSessionData(req as any, res as any);
    expect(res.status).toHaveBeenCalledWith(400);
    expect((clientsArray as any).stale).toBe(req.client);
  }
);

it('keeps session keys in a dictionary without an inherited prototype', () => {
  expect(Object.getPrototypeOf(clientsArray)).toBeNull();
});

it('rejects an invalid logout session before scheduling cleanup', async () => {
  const { req, res } = setup();
  req.session = '../outside';
  await logOutSession(req as any, res as any);
  expect(res.status).toHaveBeenCalledWith(400);
  expect((clientsArray as any).stale).toBe(req.client);
});

it('closes an INITIALIZING placeholder without calling a missing method', async () => {
  const { req, res } = setup();
  await closeSession(req as any, res as any);
  expect((clientsArray as any).stale).toBeUndefined();
  expect(res.status).toHaveBeenCalledWith(200);
});

it('logs out an INITIALIZING placeholder and completes deferred cleanup', async () => {
  jest.useFakeTimers();
  const { req, res } = setup();
  const cleaning = logOutSession(req as any, res as any);
  expect((clientsArray as any).stale.status).toBe('CLOSING');
  await jest.runAllTimersAsync();
  await cleaning;
  expect((clientsArray as any).stale).toBeUndefined();
  expect(res.status).toHaveBeenCalledWith(200);
});

it('keeps the session reserved until clear-session-data finishes logout', async () => {
  const { req, res } = setup();
  let finish!: () => void;
  const client = {
    ...req.client,
    page: {},
    logout: jest.fn(() => new Promise<void>((resolve) => (finish = resolve))),
  };
  (clientsArray as any).stale = client;
  const cleaning = clearSessionData(req as any, res as any);
  expect((clientsArray as any).stale.status).toBe('CLOSING');
  finish();
  await cleaning;
  expect((clientsArray as any).stale).toBeUndefined();
});

it('retains token verification but allows logout without connected-status middleware', () => {
  const source = readFileSync(
    path.join(__dirname, '../../routes/index.ts'),
    'utf8'
  );
  const handlers = source.match(
    /routes\.post\(\s*'\/api\/:session\/logout-session',([\s\S]*?)\);/
  )?.[1];
  expect(handlers).toBeDefined();
  expect(handlers).toContain('verifyToken');
  expect(handlers).not.toContain('statusConnection');
});

it.each(['close', 'logout'])(
  'retains a runtime when %s rejects so an explicit cleanup can retry',
  async (method) => {
    const { req, res } = setup();
    const client = {
      ...req.client,
      [method]: jest
        .fn()
        .mockRejectedValue(new Error('Native teardown failed')),
    };
    (clientsArray as any).stale = client;
    const action = method === 'close' ? closeSession : logOutSession;
    await action(req as any, res as any);
    expect(res.status).toHaveBeenCalledWith(500);
    expect((clientsArray as any).stale).toBe(client);
    expect(client.status).toBe('ERROR');
  }
);

it.each([startSession, startAllSessions])(
  'returns 503 for a session start during backup or restore',
  async (start) => {
    const { req, res } = setup();
    Object.assign(req, {
      body: {},
      headers: {},
      serverOptions: { secretKey: config.secretKey },
    });
    jest
      .requireMock('../../util/getAllTokens')
      .default.mockResolvedValue(['stale']);
    const release = await acquireSessionMaintenance();
    try {
      await start(req as any, res as any);
      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.status).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith({
        status: false,
        message: 'Session backup or restore is in progress. Try again later.',
      });
    } finally {
      release();
    }
  }
);

it('keeps invalid bulk-start credentials at one 400 response during maintenance', async () => {
  const { req, res } = setup();
  Object.assign(req, {
    headers: {},
    serverOptions: { secretKey: config.secretKey },
  });
  req.params.secretkey = 'invalid';
  const tokens = jest.requireMock('../../util/getAllTokens').default;
  tokens.mockClear();
  const release = await acquireSessionMaintenance();
  try {
    await startAllSessions(req as any, res as any);
    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(tokens).not.toHaveBeenCalled();
  } finally {
    release();
  }
});

it('rejects bulk-start if maintenance begins while the token listing is pending', async () => {
  const { req, res } = setup();
  Object.assign(req, {
    headers: {},
    serverOptions: { secretKey: config.secretKey },
  });
  let listed!: (names: string[]) => void;
  const tokens = jest.requireMock('../../util/getAllTokens').default;
  tokens.mockReturnValueOnce(
    new Promise((resolve) => {
      listed = resolve;
    })
  );
  const operation = startAllSessions(req as any, res as any);
  const release = await acquireSessionMaintenance();
  try {
    listed(['late']);
    await operation;
    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(503);
    expect(clientsArray.late).toBeUndefined();
  } finally {
    release();
  }
});
