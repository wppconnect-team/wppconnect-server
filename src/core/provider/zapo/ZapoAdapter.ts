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

import { EventEmitter } from 'events';
import fs from 'fs';

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
import { createWppCompat } from '../socket/WppCompatFacade';

/**
 * Provider backed by `zapo-js` (vinikjkkj). Unlike Baileys/whaileys, zapo is
 * an independent runtime with its OWN API — a `WaClient` class exposing
 * feature COORDINATORS as getters (`client.message`, `client.group`,
 * `client.chat`, `client.presence`, `client.profile`, ...), NOT a flat
 * `sendMessage`/event-name surface like Baileys. It also requires a pluggable,
 * fully-populated `createStore` (every domain must resolve to a backend), and
 * delivers QR via `auth_qr` and connection changes via a single unified
 * `connection` event (`{ status: 'open' | 'close', ... }`) — there is no
 * `'connected'`/`'disconnected'` event pair.
 *
 * These shapes were verified directly against the installed
 * `@wppconnect/zapo` (currently 0.3.1) type declarations
 * (`WaClient.d.ts`, `types.d.ts`, `WaMessageCoordinator.d.ts`) — a previous
 * version of this adapter assumed a Baileys-like flat API that never matched
 * zapo's actual surface, so any send/connection-tracking call failed at
 * runtime. See PUBLISHING.md / the zapo fork's own docs for the coordinator
 * pattern.
 *
 * Loaded dynamically; prefers the controlled package name `@wppconnect/zapo`,
 * falling back to upstream `zapo-js`. The scoped package is currently installed
 * as an npm alias, so runtime imports keep working until a native fork is
 * published.
 */
export class ZapoAdapter implements ProviderAdapter {
  public readonly id: ProviderId = 'zapo';
  // zapo has no message content type for a location share (its
  // WaSendMessageContent union covers text/media/reaction/poll/revoke/pin/
  // keep/event — no `location`), so that capability is honestly declared
  // unsupported rather than silently no-op'd.
  public readonly capabilities: ProviderCapabilities = buildCapabilities({
    'messaging.text': true,
    'messaging.media': true,
    'messaging.react': true,
    groups: true,
    contacts: true,
    chats: true,
    presence: true,
  });

  public readonly session: SessionApi;
  public readonly messaging: MessagingApi;

  private client: any = null;
  private compat: any = null;
  private state: ConnectionState = 'INITIALIZING';

  constructor(
    private readonly sessionName: string,
    private readonly bus: EventEmitter = new EventEmitter()
  ) {
    this.session = {
      start: async () => {
        await this.connect();
      },
      close: async () => {
        await this.client?.disconnect?.();
        this.state = 'CLOSED';
      },
      logout: async () => {
        await this.client?.logout?.();
        this.state = 'CLOSED';
      },
      getConnectionState: () => this.state,
      isConnected: async () => this.state === 'CONNECTED',
    };

    // Delegates to the WppCompatFacade (via raw()), which already knows how
    // to translate these calls onto zapo's coordinator API
    // (`client.message.send(...)`, etc.) — see WppCompatFacade's zapo branch.
    // Keeping a single translation point avoids maintaining the same
    // to-coordinator mapping twice.
    this.messaging = {
      sendText: async (to, body) => this.requireCompat().sendText(to, body),
      sendFile: async (to, file: any) =>
        this.requireCompat().sendFile(to, file),
      sendImage: async (to, image: any) =>
        this.requireCompat().sendImage(to, image),
      react: async (messageTarget: any, emoji) =>
        this.requireCompat().sendReactionToMessage(messageTarget, emoji),
      delete: async (to: any, messageTarget: any) =>
        this.requireCompat().deleteMessage(to, messageTarget),
      markSeen: async (chatId: any) => this.requireCompat().sendSeen(chatId),
    };
  }

  private async loadModule(names: string[], label: string): Promise<any> {
    for (const name of names) {
      try {
        return await import(/* webpackIgnore: true */ name);
      } catch {
        // next
      }
    }
    throw new Error(
      `Provider "zapo" requires ${label} (one of: ${names.join(', ')}).`
    );
  }

  private async connect(): Promise<void> {
    const zapo: any = await this.loadModule(
      ['@wppconnect/zapo', 'zapo-js'],
      'the zapo runtime'
    );
    // zapo's createStore validates that EVERY domain resolves to a backend
    // when `backends` is non-empty (it does not fall back to 'memory' per
    // missing field in that case) — a SQLite store is required for all of
    // them, not just `auth`. Per-session db file under userDataDir.
    const sqlite: any = await this.loadModule(
      ['@zapo-js/store-sqlite'],
      'the SQLite store'
    );

    fs.mkdirSync('./userDataDir/zapo', { recursive: true });
    const store = zapo.createStore({
      backends: {
        sqlite: sqlite.createSqliteStore({
          path: `./userDataDir/zapo/${this.sessionName}.sqlite`,
          driver: 'auto',
        }),
      },
      providers: {
        auth: 'sqlite',
        signal: 'sqlite',
        preKey: 'sqlite',
        session: 'sqlite',
        identity: 'sqlite',
        senderKey: 'sqlite',
        appState: 'sqlite',
        messages: 'sqlite',
        threads: 'sqlite',
        contacts: 'sqlite',
        privacyToken: 'sqlite',
      },
    });

    this.client = new zapo.WaClient(
      { store, sessionId: this.sessionName },
      undefined
    );
    this.compat = null;

    this.client.on('auth_qr', ({ qr, ttlMs }: any) => {
      this.state = 'QRCODE';
      this.emit('qr', { qrcode: qr, ttlMs, session: this.sessionName });
    });

    // zapo has ONE unified `connection` event, not separate
    // 'connected'/'disconnected' events. Shape:
    //   { status: 'open', reason, code: null, isLogout, isNewLogin }
    //   { status: 'close', reason, code, isLogout, isNewLogin: false }
    this.client.on('connection', (event: any) => {
      if (event?.status === 'open') {
        this.state = 'CONNECTED';
        this.emit('connection-state', {
          status: 'CONNECTED',
          session: this.sessionName,
        });
      } else if (event?.status === 'close') {
        this.state = 'CLOSED';
        this.emit('connection-state', {
          status: 'CLOSED',
          session: this.sessionName,
          reason: event?.reason,
        });
      }
    });

    this.client.on('message', (event: any) => {
      this.emit('message', { ...event, session: this.sessionName });
    });

    // Delivery/read receipts for outgoing messages — the closest zapo
    // equivalent to Baileys' `messages.update` ack event.
    this.client.on('receipt', (event: any) => {
      this.emit('ack', { ...event, session: this.sessionName });
    });

    await this.client.connect();
  }

  private requireClient(): any {
    if (!this.client) {
      throw new Error(`Zapo session "${this.sessionName}" is not started.`);
    }
    return this.client;
  }

  private requireCompat(): any {
    this.requireClient();
    return this.raw();
  }

  on(event: ProviderEvent, handler: (data: unknown) => void): void {
    this.bus.on(event, handler);
  }

  emit(event: ProviderEvent, data: unknown): void {
    this.bus.emit(event, data);
  }

  async health(): Promise<HealthState> {
    return { connected: this.state === 'CONNECTED', state: this.state };
  }

  /**
   * Returns the wppconnect-compatible facade (same as the socket providers),
   * NOT the raw zapo `WaClient` — the facade translates the ~45 wppconnect
   * client methods controllers call (`getClient(req).sendText`, `.getAllGroups`,
   * etc.) onto zapo's coordinator API, and throws a clean 501
   * (`MethodNotSupportedError`) for anything untranslated instead of a raw
   * "not a function" crash. Returning the native `WaClient` here (as the
   * previous version of this adapter did) bypassed that translation entirely
   * for every zapo session.
   */
  raw(): unknown {
    if (!this.client) return undefined;
    if (!this.compat) {
      this.compat = createWppCompat(this.client, this.sessionName);
    }
    this.compat.status = this.state;
    return this.compat;
  }
}
