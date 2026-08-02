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

import type { IncomingCallAudioChunk } from './callUtil';

interface MediaTicket {
  callId: string;
  expiresAt: number;
  session: string;
}

const tickets = new Map<string, MediaTicket>();
const activeCalls = new Map<string, string>();
let mediaNamespace: Namespace | undefined;

function roomFor(session: string, callId: string): string {
  return `${session}:${callId}`;
}

function pruneExpiredTickets(): void {
  const now = Date.now();
  tickets.forEach((value, key) => {
    if (value.expiresAt < now) tickets.delete(key);
  });
}

export function activateCallMedia(session: string, callId: string): void {
  const previousCallId = activeCalls.get(session);
  if (previousCallId && previousCallId !== callId) {
    deactivateCallMedia(session, previousCallId);
  }
  activeCalls.set(session, callId);
}

export function isCallMediaActive(session: string, callId: string): boolean {
  return activeCalls.get(session) === callId;
}

export function deactivateCallMedia(session: string, callId?: string): void {
  if (!callId || activeCalls.get(session) === callId) {
    const activeCallId = callId || activeCalls.get(session);
    activeCalls.delete(session);
    tickets.forEach((value, key) => {
      if (value.session === session && (!callId || value.callId === callId)) {
        tickets.delete(key);
      }
    });
    if (activeCallId) {
      mediaNamespace
        ?.in(roomFor(session, activeCallId))
        .disconnectSockets(true);
    }
  }
}

export function createMediaTicket(
  session: string,
  callId: string,
  ttlMs = 60_000
): { expiresAt: number; ticket: string } {
  if (!Number.isFinite(ttlMs)) throw new Error('ttlMs must be a number');
  if (activeCalls.get(session) !== callId) {
    throw new Error('Call media is not active for this session and callId');
  }
  pruneExpiredTickets();
  const ticket = randomBytes(32).toString('base64url');
  const expiresAt = Date.now() + Math.max(1_000, Math.min(ttlMs, 300_000));
  tickets.set(ticket, { callId, expiresAt, session });
  return { expiresAt, ticket };
}

export function consumeMediaTicket(ticket: string): MediaTicket | undefined {
  const value = tickets.get(ticket);
  tickets.delete(ticket);
  if (
    !value ||
    value.expiresAt < Date.now() ||
    activeCalls.get(value.session) !== value.callId
  ) {
    return undefined;
  }
  return value;
}

export function setCallMediaNamespace(namespace: Namespace): void {
  mediaNamespace = namespace;
}

export function configureCallMediaNamespace(namespace: Namespace): void {
  setCallMediaNamespace(namespace);
  namespace.use((socket, next) => {
    const ticket = String(socket.handshake.auth?.ticket || '');
    const authorization = consumeMediaTicket(ticket);
    if (!authorization) {
      next(new Error('Invalid or expired media ticket'));
      return;
    }
    socket.data.session = authorization.session;
    socket.data.callId = authorization.callId;
    next();
  });
  namespace.on('connection', (socket) => {
    socket.join(
      roomFor(String(socket.data.session), String(socket.data.callId))
    );
  });
}

export function emitIncomingAudio(
  session: string,
  callId: string,
  chunk: IncomingCallAudioChunk
): void {
  if (activeCalls.get(session) !== callId) return;
  mediaNamespace
    ?.to(roomFor(session, callId))
    .emit('incoming-audio', { callId, ...chunk });
}

export function emitCallMediaEnded(session: string, callId: string): void {
  if (activeCalls.get(session) !== callId) return;
  mediaNamespace?.to(roomFor(session, callId)).emit('call-media-ended', {
    callId,
    timestamp: Date.now(),
  });
}

export { roomFor as callMediaRoom };

export function resetCallMediaForTests(
  options: { preserveNamespace?: boolean } = {}
): void {
  tickets.clear();
  activeCalls.clear();
  if (!options.preserveNamespace) mediaNamespace = undefined;
}
