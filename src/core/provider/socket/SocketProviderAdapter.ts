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
 * Capabilities shared by the socket-based providers (Baileys family): core
 * messaging + groups/contacts/chats/presence, but NOT the WhatsApp-Web-only
 * features (catalog, stories, community, business profile), which the central
 * error handler turns into a 501.
 */
export const SOCKET_CAPABILITIES: ProviderCapabilities = buildCapabilities({
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

/**
 * Base adapter for socket-based (browserless) WhatsApp providers that expose
 * the Baileys-style API — `makeWASocket` + `useMultiFileAuthState` + the
 * `connection.update` / `messages.upsert` events. Baileys, whaileys and zapo
 * all share this shape, so they only differ by which npm package to load.
 *
 * The library is loaded with a dynamic `import()` only when a session actually
 * starts, so none of these packages need to be installed for users on the
 * default wppconnect provider — the default build/Docker image is unaffected.
 *
 * All experimental; gated behind `ENABLE_EXPERIMENTAL_PROVIDERS=true`.
 */
export class SocketProviderAdapter implements ProviderAdapter {
  public readonly capabilities: ProviderCapabilities = SOCKET_CAPABILITIES;
  public readonly session: SessionApi;
  public readonly messaging: MessagingApi;

  private sock: any = null;
  private state: ConnectionState = 'INITIALIZING';

  /**
   * @param id            provider id (baileys | whaileys | zapo)
   * @param packageNames  npm packages to try, in order (first that resolves wins)
   * @param sessionName   session name (used for the auth-state folder)
   * @param bus           normalized event bus (shared with the SessionHandle)
   */
  constructor(
    public readonly id: ProviderId,
    private readonly packageNames: string[],
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

    // Async so a missing socket surfaces as a rejected promise (handled by the
    // controllers' try/catch) rather than a synchronous throw.
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

  /** Loads the first available package from {@link packageNames}. */
  private async loadLib(): Promise<any> {
    for (const name of this.packageNames) {
      try {
        return await import(/* webpackIgnore: true */ name);
      } catch {
        // try the next candidate
      }
    }
    throw new Error(
      `Provider "${this.id}" requires one of: ${this.packageNames.join(
        ', '
      )} to be installed.`
    );
  }

  /** Establishes the socket and wires the normalized events. */
  private async connect(): Promise<void> {
    const lib: any = await this.loadLib();
    const makeWASocket = lib.default ?? lib.makeWASocket;
    const { state, saveCreds } = await lib.useMultiFileAuthState(
      `./userDataDir/${this.id}/${this.sessionName}`
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
      throw new Error(
        `Provider "${this.id}" session "${this.sessionName}" is not started.`
      );
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
