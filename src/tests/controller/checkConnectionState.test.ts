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
import { checkConnectionSession } from '../../controller/sessionController';

jest.mock('../..', () => ({ logger: { error: jest.fn() } }));
jest.mock('../../util/functions', () => ({ callWebHook: jest.fn() }));
jest.mock('../../util/createSessionUtil', () => ({
  __esModule: true,
  default: jest.fn(),
}));

function response() {
  const res = { status: jest.fn(), json: jest.fn() };
  res.status.mockReturnValue(res);
  return res;
}

it.each([
  [true, 'Connected'],
  [false, 'Disconnected'],
])('returns the actual connection result %s', async (connected, message) => {
  const req = {
    client: { isConnected: jest.fn().mockResolvedValue(connected) },
  };
  const res = response();
  await checkConnectionSession(req as any, res as any);
  expect(req.client.isConnected).toHaveBeenCalledTimes(1);
  expect(res.status).toHaveBeenCalledWith(200);
  expect(res.json).toHaveBeenCalledTimes(1);
  expect(res.json).toHaveBeenCalledWith({ status: connected, message });
});

it('preserves the disconnected response when the connection query rejects', async () => {
  const req = {
    client: {
      isConnected: jest.fn().mockRejectedValue(new Error('page closed')),
    },
  };
  const res = response();
  await checkConnectionSession(req as any, res as any);
  expect(res.status).toHaveBeenCalledWith(200);
  expect(res.json).toHaveBeenCalledTimes(1);
  expect(res.json).toHaveBeenCalledWith({
    status: false,
    message: 'Disconnected',
  });
});

it('waits for the connection query before responding', async () => {
  let resolve!: (connected: boolean) => void;
  const pending = new Promise<boolean>((done) => {
    resolve = done;
  });
  const req = { client: { isConnected: jest.fn().mockReturnValue(pending) } };
  const res = response();
  const result = checkConnectionSession(req as any, res as any);
  await new Promise(setImmediate);
  expect(res.json).not.toHaveBeenCalled();
  resolve(true);
  await result;
  expect(res.json).toHaveBeenCalledTimes(1);
  expect(res.json).toHaveBeenCalledWith({ status: true, message: 'Connected' });
});
