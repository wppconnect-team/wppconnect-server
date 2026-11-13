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
import { sendCarousel } from '../../controller/messageController';

jest.mock('../../util/functions', () => ({ unlinkAsync: jest.fn() }));

const card = {
  image: 'data:image/png;base64,AA==',
  description: 'Card',
  buttons: [{ id: 'reply', text: 'Reply' }],
};

async function send(body: any, failure?: Error) {
  const native = failure
    ? jest.fn().mockRejectedValue(failure)
    : jest.fn().mockResolvedValue({ id: 'sent' });
  const original = Object.getOwnPropertyDescriptor(globalThis, 'window');
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { WPP: { chat: { sendCarouselMessage: native } } },
  });
  const evaluate = jest.fn(async (fn, args) => await fn(args));
  const req = {
    body,
    client: { page: { evaluate } },
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
  try {
    await sendCarousel(req as any, res);
    return { req, native, evaluate, sent };
  } finally {
    if (original) Object.defineProperty(globalThis, 'window', original);
    else Reflect.deleteProperty(globalThis, 'window');
  }
}

test('forwards each canonical recipient and the exact carousel payload', async () => {
  const body = {
    phone: ['123@lid', '456@g.us'],
    body: 'Choose',
    cards: [card, card],
    footer: 'Footer',
  };
  const before = JSON.stringify(body);
  const { native, sent } = await send(body);
  expect(native).toHaveBeenNthCalledWith(1, '123@lid', {
    body: 'Choose',
    cards: body.cards,
    footer: 'Footer',
  });
  expect(native).toHaveBeenNthCalledWith(2, '456@g.us', {
    body: 'Choose',
    cards: body.cards,
    footer: 'Footer',
  });
  expect(JSON.stringify(body)).toBe(before);
  expect(sent.map((response) => response.code)).toEqual([201]);
  expect(sent[0].body.response).toEqual([{ id: 'sent' }, { id: 'sent' }]);
});

test('rejects malformed buttons before entering the browser', async () => {
  const { native, evaluate, sent } = await send({
    phone: ['123@c.us'],
    body: 'Choose',
    cards: [card, { ...card, buttons: [null] }],
  });
  expect(native).not.toHaveBeenCalled();
  expect(evaluate).not.toHaveBeenCalled();
  expect(sent.map((response) => response.code)).toEqual([400]);
});

test('returns one error response and stops further recipients after a native rejection', async () => {
  const error = new Error('Browser context destroyed');
  const { req, native, sent } = await send(
    { phone: ['123@c.us', '456@c.us'], body: 'Choose', cards: [card, card] },
    error
  );
  expect(native).toHaveBeenCalledTimes(1);
  expect(req.logger.error).toHaveBeenCalledWith(error);
  expect(sent.map((response) => response.code)).toEqual([500]);
});
