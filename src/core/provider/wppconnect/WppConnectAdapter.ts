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

import { Whatsapp } from '@wppconnect-team/wppconnect';
import { EventEmitter } from 'events';

import { buildCapabilities, ProviderCapabilities } from '../capabilities';
import {
  ConnectionState,
  HealthState,
  MessagingApi,
  ProviderAdapter,
  ProviderEvent,
  ProviderId,
  SessionApi,
} from '../ProviderAdapter';

/**
 * Adapter wrapping an existing wppconnect {@link Whatsapp} client. In PR1 it is
 * a thin bridge: every typed method delegates to the underlying client, and
 * {@link raw} returns that client so the existing `req.client.*` call sites in
 * the controllers keep working byte-for-byte. Behavior is unchanged.
 *
 * Capabilities default to all-`true` — wppconnect supports the full public
 * surface, so no route ever hits the `501` path while it is the active
 * provider. Experimental providers (Baileys/whaileys/zapo) will opt out.
 *
 * The normalized event bus is reused from the session handle so the
 * EventDispatcher (PR2) can subscribe in one place.
 */
export class WppConnectAdapter implements ProviderAdapter {
  public readonly id: ProviderId = 'wppconnect';
  public readonly capabilities: ProviderCapabilities = buildCapabilities(
    {},
    { all: true }
  );

  public readonly session: SessionApi;
  public readonly messaging: MessagingApi;

  constructor(
    private readonly client: Whatsapp,
    private readonly bus: EventEmitter = new EventEmitter()
  ) {
    const c = this.client as any;

    this.session = {
      start: async () => {
        await c.isConnected?.();
      },
      close: async () => {
        await c.close?.();
      },
      logout: async () => {
        await c.logout?.();
      },
      getConnectionState: () => (c.status as ConnectionState) ?? 'INITIALIZING',
      isConnected: async () => Boolean(await c.isConnected?.()),
      getHostDevice: () => c.getHostDevice?.(),
      getWid: () => c.getWid?.(),
    };

    this.messaging = {
      sendText: (to, body, options) => c.sendText(to, body, options),
      sendFile: (to, file, options) => c.sendFile(to, file, options),
      sendImage: (to, image, options) => c.sendImage(to, image, options),
      sendPtt: (to, audio, options) => c.sendPtt(to, audio, options),
      sendLocation: (to, location) => c.sendLocation(to, location),
      reply: (to, body, quotedId) => c.reply(to, body, quotedId),
      forward: (to, messageId) => c.forwardMessages(to, messageId),
      react: (messageId, emoji) => c.sendReactionToMessage(messageId, emoji),
      edit: (messageId, newBody) => c.editMessage(messageId, newBody),
      delete: (to, messageId) => c.deleteMessage(to, messageId),
      markSeen: (chatId) => c.sendSeen(chatId),
      sendContactVcard: (to, contactId) => c.sendContactVcard(to, contactId),
    };
  }

  on(event: ProviderEvent, handler: (data: unknown) => void): void {
    this.bus.on(event, handler);
  }

  /** Internal: lets the session wiring emit normalized events (PR2). */
  emit(event: ProviderEvent, data: unknown): void {
    this.bus.emit(event, data);
  }

  async health(): Promise<HealthState> {
    const connected = await this.session.isConnected();
    const state = await this.session.getConnectionState();
    return { connected, state };
  }

  raw(): Whatsapp {
    return this.client;
  }
}
