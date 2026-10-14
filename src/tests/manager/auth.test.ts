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

import {
  clearVerifiedSessions,
  isAdmin,
  sessionAuthorized,
  validSession,
} from '../../manager/auth';

const SECRET = 'manager-secret';
const SESSION = 'alphatest';
const OTHER = 'betatest';

let token: string;
let otherToken: string;

function enc(hash: string) {
  return hash.replace(/\//g, '_').replace(/\+/g, '-');
}

beforeAll(async () => {
  token = enc(await bcrypt.hash(SESSION + SECRET, 10));
  otherToken = enc(await bcrypt.hash(OTHER + SECRET, 10));
});

beforeEach(() => clearVerifiedSessions());

describe('sessionAuthorized', () => {
  it('authorizes a matching session and token', async () => {
    await expect(sessionAuthorized(SESSION, token, SECRET)).resolves.toBe(true);
  });

  it('rejects a token minted for another session', async () => {
    await expect(sessionAuthorized(OTHER, token, SECRET)).resolves.toBe(false);
  });

  it('rejects a token when the secret differs', async () => {
    await expect(
      sessionAuthorized(SESSION, token, 'other-secret')
    ).resolves.toBe(false);
  });

  it('rejects an invalid session name before hashing', async () => {
    await expect(
      sessionAuthorized('bad session!', token, SECRET)
    ).resolves.toBe(false);
    await expect(sessionAuthorized('__proto__', token, SECRET)).resolves.toBe(
      false
    );
  });

  it('rejects a malformed or wrong-cost token before hashing', async () => {
    await expect(
      sessionAuthorized(SESSION, 'not-a-hash', SECRET)
    ).resolves.toBe(false);
    // A genuine cost-14 hash, precomputed so the suite does not spend ~700ms
    // hashing it. The guard must refuse it instead of paying that cost.
    const cost14 =
      '$2b$14$4QzhqjeRn.EqaKA68SOJj.9B6nTy3dLVWPNlKtRtz3FJyA0wHWGlS';
    const spy = jest.spyOn(bcrypt, 'compare');
    await expect(sessionAuthorized(SESSION, cost14, SECRET)).resolves.toBe(
      false
    );
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('rejects an over-long token without hashing', async () => {
    await expect(
      sessionAuthorized(SESSION, 'a'.repeat(201), SECRET)
    ).resolves.toBe(false);
  });

  it('serves a repeated authorized credential without another compare', async () => {
    const spy = jest.spyOn(bcrypt, 'compare');

    await sessionAuthorized(SESSION, token, SECRET);
    expect(spy).toHaveBeenCalledTimes(1);

    await expect(sessionAuthorized(SESSION, token, SECRET)).resolves.toBe(true);
    await expect(sessionAuthorized(SESSION, token, SECRET)).resolves.toBe(true);

    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });

  it('does not cache a rejected credential', async () => {
    const spy = jest.spyOn(bcrypt, 'compare');

    await expect(sessionAuthorized(SESSION, otherToken, SECRET)).resolves.toBe(
      false
    );
    await expect(sessionAuthorized(SESSION, otherToken, SECRET)).resolves.toBe(
      false
    );

    expect(spy).toHaveBeenCalledTimes(2);
    spy.mockRestore();
  });

  it('does not let a cached session authorize a different token', async () => {
    await sessionAuthorized(SESSION, token, SECRET);

    await expect(sessionAuthorized(SESSION, otherToken, SECRET)).resolves.toBe(
      false
    );
  });

  it('invalidates the cache when the secret rotates', async () => {
    await expect(sessionAuthorized(SESSION, token, SECRET)).resolves.toBe(true);

    await expect(
      sessionAuthorized(SESSION, token, 'rotated-secret')
    ).resolves.toBe(false);
  });

  it('keeps separate entries per session', async () => {
    await expect(sessionAuthorized(SESSION, token, SECRET)).resolves.toBe(true);
    await expect(sessionAuthorized(OTHER, otherToken, SECRET)).resolves.toBe(
      true
    );

    // Both are now cached and each still answers for itself.
    await expect(sessionAuthorized(SESSION, token, SECRET)).resolves.toBe(true);
    await expect(sessionAuthorized(OTHER, otherToken, SECRET)).resolves.toBe(
      true
    );
  });
});

describe('validSession', () => {
  it('accepts ordinary session names', () => {
    expect(validSession('alphatest')).toBe(true);
    expect(validSession('a')).toBe(true);
    expect(validSession('session_1-b')).toBe(true);
  });

  it('rejects prototype keys and malformed names', () => {
    expect(validSession('constructor')).toBe(false);
    expect(validSession('__proto__')).toBe(false);
    expect(validSession('toString')).toBe(false);
    expect(validSession('-leading')).toBe(false);
    expect(validSession('has space')).toBe(false);
    expect(validSession('a'.repeat(101))).toBe(false);
    expect(validSession(42 as unknown)).toBe(false);
  });
});

describe('isAdmin', () => {
  it('accepts only the exact secret', () => {
    expect(isAdmin(SECRET, SECRET)).toBe(true);
    expect(isAdmin(`${SECRET} `, SECRET)).toBe(false);
    expect(isAdmin('', SECRET)).toBe(false);
    expect(isAdmin(SECRET, '')).toBe(false);
    expect(isAdmin(undefined as unknown, SECRET)).toBe(false);
  });
});
