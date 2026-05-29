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
 * Dynamically loads the Baileys library, preferring the controlled fork
 * "@wppconnect/baileys" and falling back to the upstream
 * "@whiskeysockets/baileys". Both are optional and resolved at runtime, so the
 * package is not required for users on the default wppconnect provider.
 */
async function loadBaileys(): Promise<any> {
  const candidates = ['@wppconnect/baileys', '@whiskeysockets/baileys'];
  for (const name of candidates) {
    try {
      return await import(/* webpackIgnore: true */ name);
    } catch {
      // try the next candidate
    }
  }
  throw new Error(
    'Provider "baileys" requires "@wppconnect/baileys" (or "@whiskeysockets/baileys") to be installed.'
  );
}

/**
 * EXPERIMENTAL provider backed by `@wppconnect/baileys` (a controlled fork of
 * WhiskeySockets/Baileys). Baileys is socket-based (no browser), so it covers
 * core messaging but NOT WhatsApp-Web-only features (catalog, stories,
 * community, business profile). Those capabilities are declared `false`, so the
 * central error handler returns `501` instead of crashing.
 *
 * The Baileys library is loaded with a dynamic `import()` only when a session
 * actually starts, so the package does not need to be installed for users who
 * stick with wppconnect — the default build and Docker image are unaffected.
 *
 * Gated behind `ENABLE_EXPERIMENTAL_PROVIDERS=true` via {@link ProviderFactory}.
 */
export class BaileysAdapter implements ProviderAdapter {
  public readonly id: ProviderId = 'baileys';

  /** Core messaging only; WhatsApp-Web-specific features are unsupported. */
  public readonly capabilities: ProviderCapabilities = buildCapabilities({
    'messaging.text': true,
    'messaging.media': true,
    'messaging.location': true,
    'messaging.reply': true,
    'messaging.react': true,
    'messaging.delete': true,
    groups: true,
    contacts: true,
    chats: true,
    presence: true,
  });

  public readonly session: SessionApi;
  public readonly messaging: MessagingApi;

  private sock: any = null;
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
        this.sock?.end?.(undefined);
        this.state = 'CLOSED';
      },
      logout: async () => {
        await this.sock?.logout?.();
        this.state = 'CLOSED';
      },
      getConnectionState: () => this.state,
      isConnected: async () => this.state === 'CONNECTED',
    };

    // All messaging methods are async so that a missing socket surfaces as a
    // rejected promise (handled by the controllers' try/catch) rather than a
    // synchronous throw.
    this.messaging = {
      sendText: async (to, body) =>
        this.requireSock().sendMessage(to, { text: body }),
      sendFile: async (to, file: any) =>
        this.requireSock().sendMessage(to, {
          document: file?.buffer ?? file,
          fileName: file?.fileName,
          mimetype: file?.mimetype,
        }),
      sendImage: async (to, image: any) =>
        this.requireSock().sendMessage(to, {
          image: image?.buffer ?? image,
          caption: image?.caption,
        }),
      sendLocation: async (to, location: any) =>
        this.requireSock().sendMessage(to, {
          location: {
            degreesLatitude: location?.lat ?? location?.latitude,
            degreesLongitude: location?.lng ?? location?.longitude,
          },
        }),
      react: async (messageId: any, emoji) =>
        this.requireSock().sendMessage(messageId?.remoteJid ?? messageId, {
          react: { text: emoji, key: messageId },
        }),
      delete: async (to, messageId: any) =>
        this.requireSock().sendMessage(to, { delete: messageId }),
      markSeen: async (chatId) =>
        this.requireSock().readMessages([{ id: chatId }]),
    };
  }

  /**
   * Establishes the Baileys socket. The library and its auth-state helper are
   * imported dynamically so the dependency stays optional.
   */
  private async connect(): Promise<void> {
    // Prefer the controlled fork "@wppconnect/baileys"; fall back to the
    // upstream "@whiskeysockets/baileys" until the fork is published. Both are
    // optional runtime dependencies, loaded only when a Baileys session starts,
    // so the default install/build is unaffected.
    const baileys: any = await loadBaileys();

    const makeWASocket = baileys.default ?? baileys.makeWASocket;
    const { state, saveCreds } = await baileys.useMultiFileAuthState(
      `./userDataDir/baileys/${this.sessionName}`
    );

    this.sock = makeWASocket({ auth: state, printQRInTerminal: false });

    this.sock.ev.on('creds.update', saveCreds);
    this.sock.ev.on('connection.update', (update: any) => {
      const { connection, qr } = update;
      if (qr) {
        this.state = 'QRCODE';
        this.emit('qr', { qrcode: qr, session: this.sessionName });
      }
      if (connection === 'open') {
        this.state = 'CONNECTED';
        this.emit('connection-state', {
          status: 'CONNECTED',
          session: this.sessionName,
        });
      }
      if (connection === 'close') {
        this.state = 'CLOSED';
        this.emit('connection-state', {
          status: 'CLOSED',
          session: this.sessionName,
        });
      }
    });

    this.sock.ev.on('messages.upsert', (m: any) => {
      for (const msg of m.messages ?? []) {
        this.emit('message', { ...msg, session: this.sessionName });
      }
    });
  }

  private requireSock(): any {
    if (!this.sock) {
      throw new Error(`Baileys session "${this.sessionName}" is not started.`);
    }
    return this.sock;
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
    return this.sock;
  }
}
