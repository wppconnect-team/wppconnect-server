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
import api from 'axios';

import { callWebHook } from '../../util/functions';

jest.mock('axios', () => ({ post: jest.fn() }));

const post = api.post as jest.Mock;

function setup(options: Record<string, unknown> = {}) {
  const client = {
    session: 'test',
    config: {} as { webhook?: string },
    sendSeen: jest.fn(),
  };
  const req = {
    serverOptions: {
      mapper: { enable: false },
      webhook: {
        url: 'https://example.com/hook',
        autoDownload: false,
        readMessage: true,
        ...options,
      },
    },
    logger: { warn: jest.fn(), error: jest.fn() },
  };
  return { client, req };
}

beforeEach(() => {
  jest.useFakeTimers();
  post.mockReset();
});
afterEach(() => jest.useRealTimers());

it('retries refused connections with backoff and reads once after delivery', async () => {
  const { client, req } = setup();
  post
    .mockRejectedValueOnce({ code: 'ECONNREFUSED' })
    .mockRejectedValueOnce({ code: 'ECONNREFUSED' })
    .mockResolvedValueOnce({});
  const sending = callWebHook(client, req as any, 'onmessage', {
    id: 'message-id',
    from: 'contact',
  });
  await jest.advanceTimersByTimeAsync(4999);
  expect(post).toHaveBeenCalledTimes(1);
  expect(client.sendSeen).not.toHaveBeenCalled();
  await jest.advanceTimersByTimeAsync(1);
  expect(post).toHaveBeenCalledTimes(2);
  await jest.advanceTimersByTimeAsync(10000);
  await sending;
  expect(post).toHaveBeenCalledTimes(3);
  expect(
    post.mock.calls.every((call) => call[1] === post.mock.calls[0][1])
  ).toBe(true);
  expect(post).toHaveBeenLastCalledWith(
    'https://example.com/hook',
    { event: 'onmessage', session: 'test', id: 'message-id', from: 'contact' },
    { timeout: 30000 }
  );
  expect(client.sendSeen).toHaveBeenCalledTimes(1);
});

it('stops after the configured attempt count without acknowledging an undelivered event', async () => {
  const { client, req } = setup({ retryAttempts: 2 });
  post.mockRejectedValue({ code: 'ETIMEDOUT' });
  const sending = callWebHook(client, req as any, 'onmessage', {});
  await jest.runAllTimersAsync();
  await sending;
  expect(post).toHaveBeenCalledTimes(2);
  expect(client.sendSeen).not.toHaveBeenCalled();
  expect(req.logger.warn).toHaveBeenCalledTimes(1);
});

it('does not retry HTTP responses or read-receipt failures', async () => {
  const { client, req } = setup();
  post.mockRejectedValueOnce({
    code: 'ERR_BAD_REQUEST',
    response: { status: 400 },
  });
  await callWebHook(client, req as any, 'onmessage', {});
  expect(post).toHaveBeenCalledTimes(1);
  post.mockReset().mockResolvedValue({});
  client.sendSeen.mockRejectedValue(new Error('Read receipt failed'));
  await callWebHook(client, req as any, 'onmessage', {});
  expect(post).toHaveBeenCalledTimes(1);
});

it('supports disabling retries and bounds invalid configuration', async () => {
  const { client, req } = setup({ retryAttempts: 0, requestTimeout: Infinity });
  post.mockRejectedValue({ code: 'ECONNREFUSED' });
  await callWebHook(client, req as any, 'status-find', {});
  expect(post).toHaveBeenCalledTimes(1);
  expect(post.mock.calls[0][2]).toEqual({ timeout: 30000 });
});

it('does not retry an HTTP response even when its error carries a network-like code', async () => {
  const { client, req } = setup();
  post.mockRejectedValue({ code: 'ETIMEDOUT', response: { status: 504 } });
  await callWebHook(client, req as any, 'onmessage', {});
  expect(post).toHaveBeenCalledTimes(1);
  expect(client.sendSeen).not.toHaveBeenCalled();
});

it('rejects an unconfigured session destination before making any request', async () => {
  const { client, req } = setup();
  client.config.webhook = 'http://unconfigured.test/internal';
  await callWebHook(client, req as any, 'onmessage', {});
  expect(post).not.toHaveBeenCalled();
  expect(req.logger.warn).toHaveBeenCalledTimes(1);
});

it('permits the exact global destination or an explicitly allowed session URL', async () => {
  const { client, req } = setup({ allowedUrls: ['https://allowed.test/hook'] });
  post.mockResolvedValue({});
  client.config.webhook = 'https://example.com/hook';
  await callWebHook(client, req as any, 'onmessage', {});
  client.config.webhook = 'https://allowed.test/hook';
  await callWebHook(client, req as any, 'onmessage', {});
  expect(post.mock.calls.map((call) => call[0])).toEqual([
    'https://example.com/hook',
    'https://allowed.test/hook',
  ]);
  client.config.webhook = 'https://allowed.test/hook/extra';
  await callWebHook(client, req as any, 'onmessage', {});
  expect(post).toHaveBeenCalledTimes(2);
});
