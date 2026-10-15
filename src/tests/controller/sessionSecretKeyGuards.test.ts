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
import {
  showAllSessions,
  startAllSessions,
} from '../../controller/sessionController';

jest.mock('../..', () => ({ logger: { error: jest.fn(), info: jest.fn() } }));
jest.mock('../../util/functions', () => ({
  callWebHook: jest.fn(),
  contactToArray: jest.fn(),
}));
jest.mock('../../util/getAllTokens', () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock('../../util/createSessionUtil', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({ opendata: jest.fn() })),
}));

const getAllTokens = jest.requireMock('../../util/getAllTokens')
  .default as jest.Mock;
const CreateSessionUtil = jest.requireMock('../../util/createSessionUtil')
  .default as jest.Mock;

function createResponse() {
  const res: any = {
    headersSent: false,
    sent: [] as Array<{ status: number; body: any }>,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(body: any) {
      if (res.headersSent) throw new Error('ERR_HTTP_HEADERS_SENT');
      res.headersSent = true;
      res.sent.push({ status: res.statusCode, body });
      return res;
    },
  };
  return res;
}

function createRequest(secretkey?: string) {
  return {
    params: secretkey === undefined ? {} : { secretkey },
    headers: {},
    serverOptions: { secretKey: 'right-key' },
    logger: { error: jest.fn(), info: jest.fn() },
  } as any;
}

describe('session secret key guards', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getAllTokens.mockResolvedValue(['s1']);
  });

  it('rejects a wrong secret key without starting any session', async () => {
    const res = createResponse();

    await startAllSessions(createRequest('wrong-key'), res);

    expect(res.sent).toEqual([
      {
        status: 400,
        body: { response: 'error', message: 'The token is incorrect' },
      },
    ]);
    expect(CreateSessionUtil).not.toHaveBeenCalled();
  });

  it('rejects a wrong secret key without listing sessions', async () => {
    const res = createResponse();

    await showAllSessions(createRequest('wrong-key'), res);

    expect(res.sent).toEqual([
      {
        status: 400,
        body: { response: false, message: 'The token is incorrect' },
      },
    ]);
    expect(getAllTokens).not.toHaveBeenCalled();
  });

  it('answers 400 instead of crashing when no credentials are sent', async () => {
    const res = createResponse();

    await startAllSessions(createRequest(), res);

    expect(res.sent).toEqual([
      {
        status: 400,
        body: { response: 'error', message: 'The token is incorrect' },
      },
    ]);
    expect(CreateSessionUtil).not.toHaveBeenCalled();
  });
});
