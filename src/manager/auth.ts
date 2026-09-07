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
import { timingSafeEqual } from 'crypto';

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
  return bcrypt.compare(session + secret, hash).catch(() => false);
}
