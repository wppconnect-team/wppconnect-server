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
import { createHash, timingSafeEqual } from 'crypto';

export function validSession(session: unknown): session is string {
  return (
    typeof session === 'string' &&
    /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,99}$/.test(session) &&
    !(session in [])
  );
}

export function isAdmin(token: unknown, secret: string): boolean {
  if (typeof token !== 'string' || !token || !secret) return false;
  const a = Buffer.from(token);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Successful session verifications, keyed by a digest of the exact credential
 * that was checked.
 *
 * bcrypt at cost 10 costs ~49ms here, and this runs on every Manager REST
 * call and every socket handshake, on the same libuv threadpool as the rest
 * of the server's async I/O.
 *
 * A token is a bcrypt hash of session + secret, so it only ever validates
 * one session, and re-comparing the same pair against the same hash is
 * idempotent while the secret is unchanged. Only successes are cached and
 * only the digest is retained. The secret is part of the key, so rotating it
 * invalidates every entry at once.
 *
 * The existing cost-10 guard still runs first on every call: it rejects
 * attacker-supplied expensive hashes before any cache lookup, and it also
 * rejects malformed tokens, so those never reach bcrypt or the map.
 */
const verifiedSessions = new Map<string, number>();
const VERIFIED_TTL_MS = 60_000;
const VERIFIED_MAX = 5000;

function verifiedKey(session: string, hash: string, secret: string): string {
  return createHash('sha256')
    .update(`${session}|${secret}|${hash}`)
    .digest('base64');
}

function rememberVerified(key: string): void {
  const now = Date.now();
  // Sweep on write so a long-lived process cannot grow the map unbounded.
  if (verifiedSessions.size >= VERIFIED_MAX) {
    for (const [entry, expires] of verifiedSessions) {
      if (expires <= now || verifiedSessions.size > VERIFIED_MAX) {
        verifiedSessions.delete(entry);
      }
    }
    if (verifiedSessions.size >= VERIFIED_MAX) verifiedSessions.clear();
  }
  verifiedSessions.set(key, now + VERIFIED_TTL_MS);
}

export function clearVerifiedSessions(): void {
  verifiedSessions.clear();
}

export async function sessionAuthorized(
  session: unknown,
  token: unknown,
  secret: string
) {
  if (!validSession(session) || typeof token !== 'string' || token.length > 200)
    return false;
  const hash = token.replace(/_/g, '/').replace(/-/g, '+');
  // Server-issued tokens use cost 10. Reject attacker-supplied expensive hashes.
  if (!/^\$2[aby]\$10\$[./A-Za-z0-9]{53}$/.test(hash)) return false;

  const cacheKey = verifiedKey(session, hash, secret);
  const cached = verifiedSessions.get(cacheKey);
  if (cached && cached > Date.now()) return true;

  const authorized = await bcrypt
    .compare(session + secret, hash)
    .catch(() => false);
  if (authorized) rememberVerified(cacheKey);
  return authorized;
}
