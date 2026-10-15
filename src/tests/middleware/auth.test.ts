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

function settle(next: jest.Mock, res: { statusCode: number }): Promise<void> {
  // Observe completion instead of assuming bcrypt finishes within 80ms.
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      clearInterval(poll);
      reject(new Error('Authentication did not complete within 5 seconds'));
    }, 5000);
    const poll = setInterval(() => {
      if (next.mock.calls.length || res.statusCode) {
        clearTimeout(timeout);
        clearInterval(poll);
        resolve();
      }
    }, 5);
  });
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
    await settle(next, res);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.session).toBe(SESSION);
    expect(req.client).toEqual({ id: 'client-1' });
  });

  it('rejects a token generated for a different session', async () => {
    const { req, res, next } = build(otherToken);

    verifyToken(req, res as any, next);
    await settle(next, res);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
  });

  it('rejects a malformed token', async () => {
    const { req, res, next } = build('not-a-real-token');

    verifyToken(req, res as any, next);
    await settle(next, res);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
  });

  it('serves a repeated valid token without another bcrypt compare', async () => {
    const spy = jest.spyOn(bcrypt, 'compare');

    const first = build(token);
    verifyToken(first.req, first.res as any, first.next);
    await settle(first.next, first.res);
    expect(spy).toHaveBeenCalledTimes(1);

    const second = build(token);
    verifyToken(second.req, second.res as any, second.next);
    await settle(second.next, second.res);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(second.next).toHaveBeenCalledTimes(1);
    expect(second.req.session).toBe(SESSION);
    spy.mockRestore();
  });

  it('attaches the client on the cached path', async () => {
    const first = build(token);
    verifyToken(first.req, first.res as any, first.next);
    await settle(first.next, first.res);

    const second = build(token);
    verifyToken(second.req, second.res as any, second.next);

    expect(second.next).toHaveBeenCalledTimes(1);
    expect(second.req.client).toEqual({ id: 'client-1' });
  });

  it('never caches a rejected token', async () => {
    const spy = jest.spyOn(bcrypt, 'compare');

    const first = build('wrong-token-value');
    verifyToken(first.req, first.res as any, first.next);
    await settle(first.next, first.res);
    expect(first.next).not.toHaveBeenCalled();

    const second = build('wrong-token-value');
    verifyToken(second.req, second.res as any, second.next);
    await settle(second.next, second.res);

    expect(spy).toHaveBeenCalledTimes(2);
    expect(second.next).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('does not let one session reuse another session token', async () => {
    const spy = jest.spyOn(bcrypt, 'compare');

    const first = build(token, SESSION);
    verifyToken(first.req, first.res as any, first.next);
    await settle(first.next, first.res);
    expect(first.next).toHaveBeenCalledTimes(1);

    const second = build(token, OTHER_SESSION);
    verifyToken(second.req, second.res as any, second.next);
    await settle(second.next, second.res);

    expect(second.next).not.toHaveBeenCalled();
    expect(spy).toHaveBeenCalledTimes(2);
    spy.mockRestore();
  });

  it('does not reuse a cached entry after SECRET_KEY changes', async () => {
    const first = build(token);
    verifyToken(first.req, first.res as any, first.next);
    await settle(first.next, first.res);
    expect(first.next).toHaveBeenCalledTimes(1);

    const second = build(token);
    second.req.serverOptions.secretKey = 'rotated-secret';
    verifyToken(second.req, second.res as any, second.next);
    await settle(second.next, second.res);

    expect(second.next).not.toHaveBeenCalled();
    expect(second.res.statusCode).toBe(401);
  });

  it('still reads the current client from the session map on a cache hit', async () => {
    const first = build(token);
    verifyToken(first.req, first.res as any, first.next);
    await settle(first.next, first.res);

    // The session was restarted and produced a new client object.
    const replacement = { id: 'client-1-replacement' };
    (clientsArray as any)[SESSION] = replacement;

    const second = build(token);
    verifyToken(second.req, second.res as any, second.next);

    expect(second.req.client).toBe(replacement);
  });

  it('does not reuse a cached tuple with ambiguous credential delimiters', async () => {
    const collisionToken = bcrypt
      .hashSync('a|bc', 10)
      .replace(/\//g, '_')
      .replace(/\+/g, '-');
    const spy = jest.spyOn(bcrypt, 'compare');
    try {
      const first = build(collisionToken, 'a|b');
      first.req.serverOptions.secretKey = 'c';
      verifyToken(first.req, first.res as any, first.next);
      await settle(first.next, first.res);
      expect(first.next).toHaveBeenCalledTimes(1);

      const second = build(collisionToken, 'a');
      second.req.serverOptions.secretKey = 'b|c';
      verifyToken(second.req, second.res as any, second.next);
      await settle(second.next, second.res);
      expect(second.next).not.toHaveBeenCalled();
      expect(second.res.statusCode).toBe(401);
      expect(spy).toHaveBeenCalledTimes(2);
    } finally {
      spy.mockRestore();
    }
  });

  it('revalidates an accepted credential after the cache expires', async () => {
    const now = Date.now();
    const clock = jest.spyOn(Date, 'now').mockReturnValue(now);
    const spy = jest.spyOn(bcrypt, 'compare');
    try {
      const first = build(token);
      verifyToken(first.req, first.res as any, first.next);
      await settle(first.next, first.res);
      expect(first.next).toHaveBeenCalledTimes(1);

      clock.mockReturnValue(now + 60_001);
      const second = build(token);
      verifyToken(second.req, second.res as any, second.next);
      await settle(second.next, second.res);
      expect(second.next).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledTimes(2);
    } finally {
      spy.mockRestore();
      clock.mockRestore();
    }
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
