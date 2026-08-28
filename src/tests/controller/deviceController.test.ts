/*
 * Copyright 2021 WPPConnect Team
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
import { forwardMessages } from '../../controller/deviceController';

jest.mock('../../util/functions', () => ({
  contactToArray: jest.fn(),
  unlinkAsync: jest.fn(),
}));
jest.mock('../../util/sessionUtil', () => ({ clientsArray: [] }));

const { contactToArray: mockContactToArray } = jest.requireMock(
  '../../util/functions'
) as { contactToArray: jest.Mock };

describe('forwardMessages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function createResponse() {
    const res = {
      status: jest.fn(),
      json: jest.fn(),
    };
    res.status.mockReturnValue(res);
    res.json.mockReturnValue(res);
    return res;
  }

  it('normalizes and forwards every requested contact', async () => {
    mockContactToArray.mockReturnValue([
      '5511999999999@c.us',
      '5521888888888@c.us',
    ]);
    const forwardMessagesV2 = jest
      .fn()
      .mockResolvedValueOnce('first')
      .mockResolvedValueOnce('second');
    const req = {
      body: {
        phone: '5511999999999,5521888888888',
        messageId: 'message-id',
      },
      client: { forwardMessagesV2 },
      logger: { error: jest.fn() },
    };
    const res = createResponse();

    await forwardMessages(req as any, res as any);

    expect(mockContactToArray).toHaveBeenCalledWith(
      '5511999999999,5521888888888',
      false
    );
    expect(forwardMessagesV2).toHaveBeenNthCalledWith(
      1,
      '5511999999999@c.us',
      'message-id'
    );
    expect(forwardMessagesV2).toHaveBeenNthCalledWith(
      2,
      '5521888888888@c.us',
      'message-id'
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      status: 'success',
      response: 'second',
    });
  });

  it('keeps a complete group identifier instead of its first character', async () => {
    mockContactToArray.mockReturnValue(['120363000000000000@g.us']);
    const forwardMessagesV2 = jest.fn().mockResolvedValue('forwarded');
    const req = {
      body: {
        phone: '120363000000000000@g.us',
        messageId: 'message-id',
        isGroup: true,
      },
      client: { forwardMessagesV2 },
      logger: { error: jest.fn() },
    };
    const res = createResponse();

    await forwardMessages(req as any, res as any);

    expect(forwardMessagesV2).toHaveBeenCalledWith(
      '120363000000000000@g.us',
      'message-id'
    );
  });
});
