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

import { Request } from 'express';

import { callWebHook } from '../../util/functions';
import { ProviderEvent } from '../provider/ProviderAdapter';

/**
 * Maps a normalized {@link ProviderEvent} to the webhook event name and the
 * socket.io channel the server has always used. Keeping this in one table
 * preserves the exact public contract (webhook payload `event` field and
 * socket channel names) regardless of which provider emitted it.
 *
 * `webhook: null` means the event is socket-only (no webhook is sent), matching
 * current behavior for events the server never forwarded to webhooks.
 */
const EVENT_MAP: Record<
  ProviderEvent,
  { webhook: string | null; socket: string | null }
> = {
  message: { webhook: 'onmessage', socket: null },
  'any-message': { webhook: null, socket: 'received-message' },
  ack: { webhook: 'onack', socket: 'onack' },
  'connection-state': { webhook: 'status-find', socket: null },
  qr: { webhook: 'qrcode', socket: 'qrCode' },
  'phone-code': { webhook: 'phoneCode', socket: 'phoneCode' },
  reaction: { webhook: 'onreactionmessage', socket: 'onreactionmessage' },
  revoked: { webhook: 'onrevokedmessage', socket: 'onrevokedmessage' },
  'poll-response': { webhook: 'onpollresponse', socket: 'onpollresponse' },
  'label-updated': { webhook: 'onupdatelabel', socket: 'onupdatelabel' },
  'participants-changed': {
    webhook: 'onparticipantschanged',
    socket: null,
  },
  presence: { webhook: 'onpresencechanged', socket: 'onpresencechanged' },
  'incoming-call': { webhook: 'incomingcall', socket: 'incomingcall' },
  'state-change': { webhook: null, socket: null },
};

/**
 * Fans a normalized provider event out to the webhook and socket.io, reusing
 * the existing `callWebHook` (which still handles S3 autoDownload, mapper and
 * readMessage). This is the single subscriber that experimental providers
 * (Baileys, etc.) plug into so they get the same webhook/socket behavior as
 * wppconnect without re-implementing it.
 *
 * The wppconnect path keeps its in-place listeners (battle-tested in
 * production); this dispatcher is the reuse point for new providers.
 */
export class EventDispatcher {
  constructor(private readonly client: any, private readonly req: Request) {}

  dispatch(event: ProviderEvent, data: any): void {
    const mapping = EVENT_MAP[event];
    if (!mapping) return;

    try {
      if (mapping.socket && this.req.io) {
        this.req.io.emit(mapping.socket, data);
      }
      if (mapping.webhook) {
        callWebHook(this.client, this.req, mapping.webhook, data);
      }
    } catch (e) {
      this.req.logger?.error(e);
    }
  }
}
