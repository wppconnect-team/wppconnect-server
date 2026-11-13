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
import { request } from 'http';
import { AddressInfo } from 'net';

import { deleteMessage } from '../../controller/deviceController';

jest.mock('../../util/functions', () => ({
  contactToArray: jest.fn(),
  unlinkAsync: jest.fn(),
}));

async function postDeletion(body: unknown, native: jest.Mock) {
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { WPP: { chat: { deleteMessage: native } } },
  });
  // Execute the actual serialized callback instead of replacing its return value.
  const evaluate = jest.fn(async (fn, args) => await fn(args));
  const logger = { error: jest.fn() };
  const jsonCalls: number[] = [];
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.client = { page: { evaluate } } as any;
    req.logger = logger as any;
    const json = res.json.bind(res);
    res.json = (value) => {
      jsonCalls.push(res.statusCode);
      return json(value);
    };
    next();
  });
  app.post('/delete-message', deleteMessage);
  const server = app.listen(0, '127.0.0.1');
  try {
    await new Promise<void>((resolve) => server.once('listening', resolve));
    const payload = JSON.stringify(body);
    const response = await new Promise<{ code: number; body: any }>(
      (resolve, reject) => {
        const req = request(
          {
            host: '127.0.0.1',
            port: (server.address() as AddressInfo).port,
            path: '/delete-message',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(payload),
            },
          },
          (res) => {
            let data = '';
            res.setEncoding('utf8');
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => {
              try {
                resolve({ code: res.statusCode!, body: JSON.parse(data) });
              } catch (error) {
                reject(error);
              }
            });
            res.on('error', reject);
          }
        );
        req.on('error', reject);
        req.setTimeout(5000, () =>
          req.destroy(new Error('HTTP request timed out'))
        );
        req.end(payload);
      }
    );
    return { response, evaluate, logger, jsonCalls };
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve()))
    );
    if (originalWindow)
      Object.defineProperty(globalThis, 'window', originalWindow);
    else Reflect.deleteProperty(globalThis, 'window');
  }
}

test.each([
  { id: 'message', isDeleted: true, isRevoked: true },
  [{ id: 'message', isDeleted: false, isRevoked: false }],
  false,
])(
  'preserves the native deletion result in one HTTP response: %j',
  async (value) => {
    const native = jest.fn().mockResolvedValue(value);
    const { response, evaluate, jsonCalls } = await postDeletion(
      { phone: ['5511999999999@lid'], messageId: 'message' },
      native
    );
    expect(response).toEqual({
      code: 200,
      body: { status: 'success', response: value },
    });
    expect(native).toHaveBeenCalledWith(
      '5511999999999@lid',
      'message',
      true,
      true
    );
    expect(evaluate).toHaveBeenCalledTimes(1);
    expect(jsonCalls).toEqual([200]);
  }
);

test('forwards explicit local-only and media options without changing the group id', async () => {
  const native = jest
    .fn()
    .mockResolvedValue({ isDeleted: true, isRevoked: false });
  const { response, jsonCalls } = await postDeletion(
    {
      phone: ['120363000000000000@g.us'],
      messageId: 'message',
      deleteMediaInDevice: false,
      onlyLocal: true,
    },
    native
  );
  expect(response.code).toBe(200);
  expect(native).toHaveBeenCalledWith(
    '120363000000000000@g.us',
    'message',
    false,
    false
  );
  expect(jsonCalls).toEqual([200]);
});

test.each([
  { phone: [], messageId: 'message' },
  { phone: ['one@c.us', 'two@c.us'], messageId: 'message' },
  { phone: ['one@c.us'] },
])(
  'rejects invalid normalized input without a browser call: %j',
  async (body) => {
    const native = jest.fn();
    const { response, evaluate, jsonCalls } = await postDeletion(body, native);
    expect(response.code).toBe(400);
    expect(evaluate).not.toHaveBeenCalled();
    expect(native).not.toHaveBeenCalled();
    expect(jsonCalls).toEqual([400]);
  }
);

test('reports a rejected native operation once and logs the actual error', async () => {
  const error = new Error('Browser context destroyed');
  const native = jest.fn().mockRejectedValue(error);
  const { response, logger, jsonCalls } = await postDeletion(
    { phone: ['5511999999999@c.us'], messageId: 'message' },
    native
  );
  expect(response.code).toBe(500);
  expect(response.body.status).toBe('error');
  expect(logger.error).toHaveBeenCalledWith(error);
  expect(jsonCalls).toEqual([500]);
});
