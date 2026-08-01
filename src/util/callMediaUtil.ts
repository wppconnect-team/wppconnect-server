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
import { randomBytes } from 'crypto';
import { Namespace } from 'socket.io';

import { IncomingCallAudioChunk } from './callUtil';

interface MediaTicket {
  expiresAt: number;
  session: string;
}

const tickets = new Map<string, MediaTicket>();
let mediaNamespace: Namespace | undefined;

export function createMediaTicket(
  session: string,
  ttlMs = 60_000
): { expiresAt: number; ticket: string } {
  if (!Number.isFinite(ttlMs)) throw new Error('ttlMs must be a number');
  const ticket = randomBytes(32).toString('base64url');
  const expiresAt = Date.now() + Math.max(1_000, Math.min(ttlMs, 300_000));
  tickets.set(ticket, { expiresAt, session });
  return { expiresAt, ticket };
}

export function consumeMediaTicket(ticket: string): MediaTicket | undefined {
  const value = tickets.get(ticket);
  tickets.delete(ticket);
  if (!value || value.expiresAt < Date.now()) return undefined;
  return value;
}

export function setCallMediaNamespace(namespace: Namespace): void {
  mediaNamespace = namespace;
}

export function emitIncomingAudio(
  session: string,
  chunk: IncomingCallAudioChunk
): void {
  mediaNamespace?.to(session).emit('incoming-audio', chunk);
}

export function resetCallMediaForTests(): void {
  tickets.clear();
  mediaNamespace = undefined;
}
