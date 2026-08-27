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

import statusConnection from '../../middleware/statusConnection';

jest.mock('../../util/functions', () => ({
  contactToArray: jest.fn(),
}));

const { contactToArray: mockContactToArray } = jest.requireMock(
  '../../util/functions'
) as { contactToArray: jest.Mock };

describe('statusConnection', () => {
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

  it('stops the middleware chain when the client is disconnected', async () => {
    const req = {
      body: {},
      logger: { error: jest.fn() },
    };
    const res = createResponse();
    const next = jest.fn();

    await statusConnection(req as any, res as any, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(next).not.toHaveBeenCalled();
  });

  it('stops the middleware chain when a number does not exist', async () => {
    mockContactToArray.mockReturnValue(['5511999999999@c.us']);
    const req = {
      body: { phone: ['5511999999999'] },
      client: {
        isConnected: jest.fn().mockResolvedValue(true),
        checkNumberStatus: jest.fn().mockResolvedValue({ numberExists: false }),
      },
      logger: { error: jest.fn() },
    };
    const res = createResponse();
    const next = jest.fn();

    await statusConnection(req as any, res as any, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('continues once after validating connected contacts', async () => {
    mockContactToArray.mockReturnValue(['5511999999999@c.us']);
    const req = {
      body: { phone: ['5511999999999'] },
      client: {
        isConnected: jest.fn().mockResolvedValue(true),
        checkNumberStatus: jest.fn().mockResolvedValue({
          numberExists: true,
          id: { _serialized: '5511999999999@c.us' },
        }),
      },
      logger: { error: jest.fn() },
    };
    const res = createResponse();
    const next = jest.fn();

    await statusConnection(req as any, res as any, next);

    expect(req.body.phone).toEqual(['5511999999999@c.us']);
    expect(next).toHaveBeenCalledTimes(1);
  });
});
