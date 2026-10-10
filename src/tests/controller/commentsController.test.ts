/*
 * Copyright 2023 WPPConnect Team
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

import {
  getComments,
  sendCommentMessage,
} from '../../controller/commentsController';

function response() {
  const res = { status: jest.fn(), json: jest.fn() };
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  return res;
}
function request(client: any = {}, text: unknown = ' text ') {
  return {
    params: { messageId: 'parent' },
    body: { text },
    client,
    logger: { error: jest.fn() },
  };
}

describe('Announcement comment endpoints', () => {
  it('returns comments without changing their type or parent', async () => {
    const rows = [{ id: 'reply', parentMsgId: 'parent', type: 'ciphertext' }];
    const client = { getComments: jest.fn().mockResolvedValue(rows) };
    const req = request(client),
      res = response();
    await getComments(req as any, res as any);
    expect(client.getComments).toHaveBeenCalledWith('parent');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: 'success',
      response: rows,
    });
  });
  it('accepts an empty list but does not hide read failures', async () => {
    const res = response();
    await getComments(
      request({ getComments: async () => [] }) as any,
      res as any
    );
    expect(res.json).toHaveBeenCalledWith({ status: 'success', response: [] });
    await getComments(
      request({
        getComments: async () => {
          throw new Error('database unavailable');
        },
      }) as any,
      res as any
    );
    expect(res.status).toHaveBeenLastCalledWith(500);
  });
  it('confirms only OK and preserves whitespace', async () => {
    const verdict = { messageSendResult: 'OK', t: 1 };
    const client = { sendCommentMessage: jest.fn().mockResolvedValue(verdict) };
    const res = response();
    await sendCommentMessage(request(client) as any, res as any);
    expect(client.sendCommentMessage).toHaveBeenCalledTimes(1);
    expect(client.sendCommentMessage).toHaveBeenCalledWith('parent', ' text ');
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      status: 'success',
      response: verdict,
    });
  });
  it.each(['ERROR_UNKNOWN', 'ERROR_NETWORK', undefined])(
    'does not claim success or retry verdict %s',
    async (messageSendResult) => {
      const client = {
        sendCommentMessage: jest.fn().mockResolvedValue({ messageSendResult }),
      };
      const res = response();
      await sendCommentMessage(request(client) as any, res as any);
      expect(client.sendCommentMessage).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(502);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'error', retrySafe: false })
      );
    }
  );
  it('never retries a lost response or logs the reply text', async () => {
    const client = {
      sendCommentMessage: jest
        .fn()
        .mockRejectedValue(new Error('lost response')),
    };
    const req = request(client),
      res = response();
    await sendCommentMessage(req as any, res as any);
    expect(client.sendCommentMessage).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(502);
    expect(req.logger.error.mock.calls[0][0]).not.toContain('text');
  });
  it.each(['', '  ', null, 123])('rejects invalid text %s', async (text) => {
    const client = { sendCommentMessage: jest.fn() };
    const res = response();
    await sendCommentMessage(request(client, text) as any, res as any);
    expect(client.sendCommentMessage).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });
  it('reports missing capability', async () => {
    for (const handler of [getComments, sendCommentMessage]) {
      const res = response();
      await handler(request() as any, res as any);
      expect(res.status).toHaveBeenCalledWith(501);
    }
  });
  it('rejects missing IDs before reading or sending', async () => {
    for (const handler of [getComments, sendCommentMessage]) {
      const req = request();
      req.params.messageId = '';
      const res = response();
      await handler(req as any, res as any);
      expect(res.status).toHaveBeenCalledWith(400);
    }
  });
});
