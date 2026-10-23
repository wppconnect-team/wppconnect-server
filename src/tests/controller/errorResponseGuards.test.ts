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
import { sendFile, sendOrderMessage } from '../../controller/messageController';
import { getMediaByMessage } from '../../controller/sessionController';
import { sendTextStorie } from '../../controller/statusController';

jest.mock('../..', () => ({ logger: { error: jest.fn() } }));
jest.mock('../../util/functions', () => ({
  unlinkAsync: jest.fn(),
  callWebHook: jest.fn(),
}));
jest.mock('../../util/manageSession', () => ({
  backupSessions: jest.fn(),
  restoreSessions: jest.fn(),
}));
jest.mock('../../util/getAllTokens', () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock('../../util/createSessionUtil', () => ({
  __esModule: true,
  default: jest.fn(),
}));

/**
 * Records every response and refuses a second one, the way Express rejects a
 * write after the headers have been sent.
 */
function createResponse() {
  const sent: Array<{ status: number; body: any }> = [];
  const res: any = {
    sent,
    headersSent: false,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(body: any) {
      if (res.headersSent) throw new Error('ERR_HTTP_HEADERS_SENT');
      res.headersSent = true;
      sent.push({ status: res.statusCode, body });
      return res;
    },
    send(body: any) {
      if (res.headersSent) throw new Error('ERR_HTTP_HEADERS_SENT');
      res.headersSent = true;
      sent.push({ status: res.statusCode, body });
      return res;
    },
  };
  return res;
}

function createRequest(overrides: any = {}) {
  return {
    body: {},
    params: {},
    file: undefined,
    client: {} as any,
    io: { emit: jest.fn() },
    logger: { error: jest.fn(), warn: jest.fn() },
    serverOptions: { webhook: {} },
    ...overrides,
  } as any;
}

describe('error guards stop the handler', () => {
  it('sendFile rejects a request with no file and never calls the client', async () => {
    const client = { sendFile: jest.fn() };
    const req = createRequest({
      body: { phone: ['5511999999999@c.us'] },
      client,
    });
    const res = createResponse();

    await sendFile(req, res);

    expect(res.sent).toEqual([
      { status: 401, body: { message: 'Sending the file is mandatory' } },
    ]);
    expect(client.sendFile).not.toHaveBeenCalled();
  });

  it('sendOrderMessage reports the failure once and skips the success response', async () => {
    const client = { sendOrderMessage: jest.fn() };
    const req = createRequest({ body: { phone: [], items: [] }, client });
    const res = createResponse();

    await sendOrderMessage(req, res);

    expect(res.sent).toHaveLength(1);
    expect(res.sent[0].status).toBe(400);
    expect(req.io.emit).not.toHaveBeenCalled();
  });

  it('getMediaByMessage answers "Message not found" without decrypting', async () => {
    const client = {
      getMessageById: jest.fn().mockResolvedValue(undefined),
      decryptFile: jest.fn(),
    };
    const req = createRequest({ params: { messageId: 'missing' }, client });
    const res = createResponse();

    await getMediaByMessage(req, res);

    expect(res.sent).toHaveLength(1);
    expect(res.sent[0].status).toBe(400);
    expect(res.sent[0].body.message).toBe('Message not found');
    expect(client.decryptFile).not.toHaveBeenCalled();
  });

  it('getMediaByMessage answers "does not contain media" without decrypting', async () => {
    const client = {
      getMessageById: jest.fn().mockResolvedValue({ id: 'x' }),
      decryptFile: jest.fn(),
    };
    const req = createRequest({ params: { messageId: 'text-only' }, client });
    const res = createResponse();

    await getMediaByMessage(req, res);

    expect(res.sent).toHaveLength(1);
    expect(res.sent[0].status).toBe(400);
    expect(res.sent[0].body.message).toBe('Message does not contain media');
    expect(client.decryptFile).not.toHaveBeenCalled();
  });

  it('sendTextStorie rejects a story with no text and never calls the client', async () => {
    const client = { sendTextStatus: jest.fn() };
    const req = createRequest({ body: {}, client });
    const res = createResponse();

    await sendTextStorie(req, res);

    expect(res.sent).toEqual([
      { status: 401, body: { message: 'Text was not informed' } },
    ]);
    expect(client.sendTextStatus).not.toHaveBeenCalled();
  });
});
