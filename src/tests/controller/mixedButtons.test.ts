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
import { sendButtons } from '../../controller/messageController';

jest.mock('../../util/functions', () => ({ unlinkAsync: jest.fn() }));

async function send(options: unknown, failure?: Error) {
  const req = {
    body: { phone: ['123@c.us'], message: 'Choose', options },
    client: {
      sendText: failure
        ? jest.fn().mockRejectedValue(failure)
        : jest.fn().mockResolvedValue({ id: 'sent' }),
    },
    logger: { error: jest.fn() },
  };
  const sent: Array<{ code: number; body: any }> = [];
  const res: any = {
    statusCode: 200,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(body: any) {
      if (sent.length) throw new Error('ERR_HTTP_HEADERS_SENT');
      sent.push({ code: res.statusCode, body });
      return res;
    },
  };
  await sendButtons(req as any, res);
  return { req, sent };
}

test.each([null, false, [], 'invalid'].map((button) => ({ button })))(
  'rejects a malformed interactive button without dispatch: %j',
  async ({ button }) => {
    const { req, sent } = await send({
      useInteractiveMessage: true,
      buttons: [button],
    });
    expect(sent).toHaveLength(1);
    expect(sent[0].code).toBe(400);
    expect(req.client.sendText).not.toHaveBeenCalled();
  }
);

test.each(
  [
    [
      { id: 42, text: 'Reply' },
      { url: 'https://example.com', text: 'Visit' },
    ],
    [
      { id: 'reply', text: '' },
      { url: 'https://example.com', text: 'Visit' },
    ],
    [
      { id: 'reply', text: 'Reply' },
      { url: true, text: 'Visit' },
    ],
  ].map((buttons) => ({ buttons }))
)(
  'rejects malformed mixed actions before dispatch: %j',
  async ({ buttons }) => {
    const { req, sent } = await send({ useInteractiveMessage: true, buttons });
    expect(sent.map((response) => response.code)).toEqual([400]);
    expect(req.client.sendText).not.toHaveBeenCalled();
  }
);

test('dispatches normalized options without mutating the request', async () => {
  const options = {
    useInteractiveMessage: true,
    buttons: [
      { id: 'reply', text: 'Reply' },
      { url: 'https://example.com', text: 'Visit' },
    ],
  };
  const before = JSON.stringify(options);
  const { req, sent } = await send(options);
  const normalized = req.client.sendText.mock.calls[0][2];
  expect(normalized.buttons.map((button: any) => button.raw.name)).toEqual([
    'quick_reply',
    'cta_url',
  ]);
  expect(JSON.parse(normalized.buttons[1].raw.buttonParamsJson)).toEqual({
    display_text: 'Visit',
    url: 'https://example.com',
  });
  expect(JSON.stringify(options)).toBe(before);
  expect(sent.map((response) => response.code)).toEqual([201]);
});

test('preserves native errors as one server error rather than invalid input', async () => {
  const error = new TypeError('native failure');
  const { req, sent } = await send(undefined, error);
  expect(sent.map((response) => response.code)).toEqual([500]);
  expect(req.logger.error).toHaveBeenCalledWith(error);
});
