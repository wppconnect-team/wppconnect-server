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
import bcrypt from 'bcrypt';

import verifyToken, { clearVerifiedTokens } from '../../middleware/auth';
import { clientsArray } from '../../util/sessionUtil';

const SECRET = 'a-very-secret-key';
const SESSION = 'customer-1';
const OTHER_SESSION = 'customer-2';

let token: string;
let otherToken: string;

function build(tokenValue: string, session = SESSION) {
  const next = jest.fn();
  const res = {
    statusCode: 0,
    body: undefined as any,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(body: any) {
      res.body = body;
      return res;
    },
    send(body: any) {
      res.body = body;
      return res;
    },
  };
  const req = {
    params: { session: `${session}:${tokenValue}` },
    headers: {},
    serverOptions: { secretKey: SECRET },
    logger: { error: jest.fn() },
  } as any;
  return { req, res, next };
}

function settle(): Promise<void> {
  // bcrypt.compare completes on the threadpool, so let the event loop drain.
  return new Promise((resolve) => setTimeout(resolve, 80));
}

beforeAll(async () => {
  token = bcrypt
    .hashSync(SESSION + SECRET, 10)
    .replace(/\//g, '_')
    .replace(/\+/g, '-');
  otherToken = bcrypt
    .hashSync(OTHER_SESSION + SECRET, 10)
    .replace(/\//g, '_')
    .replace(/\+/g, '-');
});

beforeEach(() => {
  clearVerifiedTokens();
  for (const key of Object.keys(clientsArray))
    delete (clientsArray as any)[key];
  (clientsArray as any)[SESSION] = { id: 'client-1' };
  (clientsArray as any)[OTHER_SESSION] = { id: 'client-2' };
});

describe('verifyToken', () => {
  it('accepts a valid token and attaches the session client', async () => {
    const { req, res, next } = build(token);

    verifyToken(req, res as any, next);
    await settle();

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.session).toBe(SESSION);
    expect(req.client).toEqual({ id: 'client-1' });
  });

  it('rejects a token generated for a different session', async () => {
    const { req, res, next } = build(otherToken);

    verifyToken(req, res as any, next);
    await settle();

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
  });

  it('rejects a malformed token', async () => {
    const { req, res, next } = build('not-a-real-token');

    verifyToken(req, res as any, next);
    await settle();

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
  });

  it('serves a repeated valid token without another bcrypt compare', async () => {
    const spy = jest.spyOn(bcrypt, 'compare');

    const first = build(token);
    verifyToken(first.req, first.res as any, first.next);
    await settle();
    expect(spy).toHaveBeenCalledTimes(1);

    const second = build(token);
    verifyToken(second.req, second.res as any, second.next);
    await settle();

    expect(spy).toHaveBeenCalledTimes(1);
    expect(second.next).toHaveBeenCalledTimes(1);
    expect(second.req.session).toBe(SESSION);
    spy.mockRestore();
  });

  it('attaches the client on the cached path', async () => {
    const first = build(token);
    verifyToken(first.req, first.res as any, first.next);
    await settle();

    const second = build(token);
    verifyToken(second.req, second.res as any, second.next);

    expect(second.next).toHaveBeenCalledTimes(1);
    expect(second.req.client).toEqual({ id: 'client-1' });
  });

  it('never caches a rejected token', async () => {
    const spy = jest.spyOn(bcrypt, 'compare');

    const first = build('wrong-token-value');
    verifyToken(first.req, first.res as any, first.next);
    await settle();
    expect(first.next).not.toHaveBeenCalled();

    const second = build('wrong-token-value');
    verifyToken(second.req, second.res as any, second.next);
    await settle();

    expect(spy).toHaveBeenCalledTimes(2);
    expect(second.next).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('does not let one session reuse another session token', async () => {
    const spy = jest.spyOn(bcrypt, 'compare');

    const first = build(token, SESSION);
    verifyToken(first.req, first.res as any, first.next);
    await settle();
    expect(first.next).toHaveBeenCalledTimes(1);

    const second = build(token, OTHER_SESSION);
    verifyToken(second.req, second.res as any, second.next);
    await settle();

    expect(second.next).not.toHaveBeenCalled();
    expect(spy).toHaveBeenCalledTimes(2);
    spy.mockRestore();
  });

  it('does not reuse a cached entry after SECRET_KEY changes', async () => {
    const first = build(token);
    verifyToken(first.req, first.res as any, first.next);
    await settle();
    expect(first.next).toHaveBeenCalledTimes(1);

    const second = build(token);
    second.req.serverOptions.secretKey = 'rotated-secret';
    verifyToken(second.req, second.res as any, second.next);
    await settle();

    expect(second.next).not.toHaveBeenCalled();
    expect(second.res.statusCode).toBe(401);
  });

  it('still reads the current client from the session map on a cache hit', async () => {
    const first = build(token);
    verifyToken(first.req, first.res as any, first.next);
    await settle();

    // The session was restarted and produced a new client object.
    const replacement = { id: 'client-1-replacement' };
    (clientsArray as any)[SESSION] = replacement;

    const second = build(token);
    verifyToken(second.req, second.res as any, second.next);

    expect(second.req.client).toBe(replacement);
  });

  it('reports a missing session', () => {
    const res = {
      statusCode: 0,
      status(code: number) {
        res.statusCode = code;
        return res;
      },
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
    const req = {
      params: {},
      headers: {},
      serverOptions: { secretKey: SECRET },
      logger: { error: jest.fn() },
    } as any;

    verifyToken(req, res as any, jest.fn());

    expect(res.statusCode).toBe(401);
  });
});
