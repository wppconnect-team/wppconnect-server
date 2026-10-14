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
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';

import { clientsArray } from '../util/sessionUtil';

function formatSession(session: string) {
  return session.split(':')[0];
}

/**
 * Successful token verifications, keyed by a digest of the exact credential
 * that was checked.
 *
 * bcrypt at cost 10 costs ~47ms of CPU and runs on the libuv threadpool,
 * which is also what serves every other async operation in the process. It
 * was being paid on all 145 authenticated routes, so throughput was capped
 * near 20 req/s on a single core and unrelated I/O queued behind it.
 *
 * A token is a bcrypt hash of session + secretKey, so it only ever matches
 * one session, and comparing against the same hash is idempotent: the
 * answer cannot change while SECRET_KEY is unchanged. Only successes are
 * cached and only the digest is retained, so a memory dump does not hand
 * over usable tokens. SECRET_KEY is part of the key, so rotating it
 * invalidates every entry at once.
 */
const verifiedTokens = new Map<string, number>();
const VERIFIED_TTL_MS = 60_000;
const VERIFIED_MAX = 5000;

function verifiedKey(
  session: string,
  token: string,
  secureToken: string
): string {
  return crypto
    .createHash('sha256')
    .update(
      `${session.length}:${session}${secureToken.length}:${secureToken}${token.length}:${token}`
    )
    .digest('base64');
}

function rememberVerified(key: string): void {
  const now = Date.now();
  // Drop expired entries on write so the map cannot grow without bound even
  // on a server that only ever sees one token.
  if (verifiedTokens.size >= VERIFIED_MAX) {
    for (const [entry, expires] of verifiedTokens) {
      if (expires <= now || verifiedTokens.size > VERIFIED_MAX) {
        verifiedTokens.delete(entry);
      }
    }
    if (verifiedTokens.size >= VERIFIED_MAX) verifiedTokens.clear();
  }
  verifiedTokens.set(key, now + VERIFIED_TTL_MS);
}

export function clearVerifiedTokens(): void {
  verifiedTokens.clear();
}

const verifyToken = (req: Request, res: Response, next: NextFunction): any => {
  const secureToken = req.serverOptions.secretKey;

  const { session } = req.params;
  const { authorization: token } = req.headers;
  if (!session)
    return res.status(401).send({ message: 'Session not informed' });

  try {
    let tokenDecrypt = '';
    let sessionDecrypt = '';

    try {
      sessionDecrypt = session.split(':')[0];
      tokenDecrypt = session
        .split(':')[1]
        .replace(/_/g, '/')
        .replace(/-/g, '+');
    } catch (error) {
      try {
        if (token && token !== '' && token.split(' ').length > 0) {
          const token_value = token.split(' ')[1];
          if (token_value)
            tokenDecrypt = token_value.replace(/_/g, '/').replace(/-/g, '+');
          else
            return res.status(401).json({
              message: 'Token is not present. Check your header and try again',
            });
        } else {
          return res.status(401).json({
            message: 'Token is not present. Check your header and try again',
          });
        }
      } catch (e) {
        req.logger.error(e);
        return res.status(401).json({
          error: 'Check that a Session and Token are correct',
          message: error,
        });
      }
    }

    const cacheKey = verifiedKey(sessionDecrypt, tokenDecrypt, secureToken);
    const cached = verifiedTokens.get(cacheKey);
    if (cached && cached > Date.now()) {
      req.session = formatSession(req.params.session);
      req.token = tokenDecrypt;
      req.client = clientsArray[req.session];
      return next();
    }

    bcrypt.compare(
      sessionDecrypt + secureToken,
      tokenDecrypt,
      function (err, result) {
        if (result) {
          rememberVerified(cacheKey);
          req.session = formatSession(req.params.session);
          req.token = tokenDecrypt;
          req.client = clientsArray[req.session];
          next();
        } else {
          return res
            .status(401)
            .json({ error: 'Check that the Session and Token are correct' });
        }
      }
    );
  } catch (error) {
    req.logger.error(error);
    return res.status(401).json({
      error: 'Check that the Session and Token are correct.',
      message: error,
    });
  }
};

export default verifyToken;
