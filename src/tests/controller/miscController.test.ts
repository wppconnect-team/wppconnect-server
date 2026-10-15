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
import config from '../../config';
import {
  backupAllSessions,
  restoreAllSessions,
} from '../../controller/miscController';

jest.mock('../..', () => ({ logger: { error: jest.fn(), info: jest.fn() } }));
jest.mock('../../util/manageSession', () => ({
  backupSessions: jest.fn(),
  restoreSessions: jest.fn(),
}));
jest.mock('../../util/sessionUtil', () => ({ cleanupSession: jest.fn() }));

const { backupSessions, restoreSessions } = jest.requireMock(
  '../../util/manageSession'
) as { backupSessions: jest.Mock; restoreSessions: jest.Mock };

function createResponse() {
  const res: any = {
    headersSent: false,
    sent: [] as Array<{ status: number; body: any }>,
    setHeader: jest.fn(),
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
    send(body: any) {
      if (res.headersSent) throw new Error('ERR_HTTP_HEADERS_SENT');
      res.headersSent = true;
      res.sent.push({ status: res.statusCode, body });
      return res;
    },
  };
  return res;
}

function createRequest(secretkey: string) {
  return {
    params: { secretkey },
    file: { mimetype: 'application/zip', path: 'upload.zip' },
    res: { end: jest.fn() },
    logger: { error: jest.fn() },
  } as any;
}

describe('backup and restore secret key guards', () => {
  beforeEach(() => jest.clearAllMocks());

  it('rejects a wrong secret key without running the backup', async () => {
    const req = createRequest('wrong-key');
    const res = createResponse();

    await backupAllSessions(req, res);

    expect(res.sent).toHaveLength(1);
    expect(res.sent[0]).toEqual({
      status: 400,
      body: { response: 'error', message: 'The token is incorrect' },
    });
    expect(backupSessions).not.toHaveBeenCalled();
  });

  it('rejects a wrong secret key without restoring the uploaded file', async () => {
    const req = createRequest('wrong-key');
    const res = createResponse();

    await restoreAllSessions(req, res);

    expect(res.sent).toHaveLength(1);
    expect(res.sent[0]).toEqual({
      status: 400,
      body: { response: 'error', message: 'The token is incorrect' },
    });
    expect(restoreSessions).not.toHaveBeenCalled();
  });
});

it('does not send a second response after the backup streamed the archive', async () => {
  const req = createRequest(config.secretKey);
  const res = createResponse();
  backupSessions.mockImplementationOnce(async () => {
    res.headersSent = true;
  });
  await backupAllSessions(req, res);
  expect(res.sent).toEqual([]);
});

it('logs a failed streamed backup without writing already-sent headers', async () => {
  const req = createRequest(config.secretKey);
  const res = createResponse();
  const error = new Error('connection closed');
  backupSessions.mockImplementationOnce(async () => {
    res.headersSent = true;
    throw error;
  });
  await backupAllSessions(req, res);
  expect(res.sent).toEqual([]);
  expect(req.logger.error).toHaveBeenCalledWith(error);
});
