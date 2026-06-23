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

/**
 * EXPERIMENTAL provider backed by `zapo-js` (vinikjkkj). Unlike Baileys/whaileys,
 * zapo is an independent runtime with its OWN API — a `WaClient` class plus a
 * pluggable `createStore`, QR delivered via the `auth_qr` event — so it has a
 * dedicated adapter rather than sharing the socket base.
 *
 * Loaded dynamically; prefers the controlled package name `@wppconnect/zapo`,
 * falling back to upstream `zapo-js`. The scoped package is currently installed
 * as an npm alias, so runtime imports keep working until a native fork is
 * published.
 */
export class ZapoAdapter implements ProviderAdapter {
  public readonly id: ProviderId = 'zapo';
  public readonly capabilities: ProviderCapabilities = buildCapabilities({
    'messaging.text': true,
    'messaging.media': true,
    'messaging.location': true,
    'messaging.react': true,
    groups: true,
    contacts: true,
    chats: true,
    presence: true,
  });

  public readonly session: SessionApi;
  public readonly messaging: MessagingApi;

  private client: any = null;
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
        await this.client?.disconnect?.();
        this.state = 'CLOSED';
      },
      getConnectionState: () => this.state,
      isConnected: async () => this.state === 'CONNECTED',
    };

    this.messaging = {
      sendText: async (to, body) =>
        this.requireClient().sendMessage({ to, text: body }),
      sendFile: async (to, file: any) =>
        this.requireClient().sendMessage({
          to,
          document: file?.buffer ?? file,
          fileName: file?.fileName,
        }),
      sendImage: async (to, image: any) =>
        this.requireClient().sendMessage({
          to,
          image: image?.buffer ?? image,
          caption: image?.caption,
        }),
      markSeen: async () => undefined,
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
    // zapo requires a persistent backend for `auth` (no memory fallback), so a
    // SQLite store is mandatory. Per-session db file under userDataDir.
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
      },
    });

    this.client = new zapo.WaClient(
      { store, sessionId: this.sessionName },
      undefined
    );

    this.client.on('auth_qr', ({ qr }: any) => {
      this.state = 'QRCODE';
      this.emit('qr', { qrcode: qr, session: this.sessionName });
    });
    this.client.on('connected', () => {
      this.state = 'CONNECTED';
      this.emit('connection-state', {
        status: 'CONNECTED',
        session: this.sessionName,
      });
    });
    this.client.on('disconnected', () => {
      this.state = 'CLOSED';
      this.emit('connection-state', {
        status: 'CLOSED',
        session: this.sessionName,
      });
    });
    this.client.on('message', (event: any) => {
      this.emit('message', { ...event, session: this.sessionName });
    });

    await this.client.connect();
  }

  private requireClient(): any {
    if (!this.client) {
      throw new Error(`Zapo session "${this.sessionName}" is not started.`);
    }
    return this.client;
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

  raw(): unknown {
    return this.client;
  }
}
