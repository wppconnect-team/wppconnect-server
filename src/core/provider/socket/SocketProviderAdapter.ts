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
import { createJid } from './jid';
import { createWppCompat } from './WppCompatFacade';

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
 * Base adapter for socket-based (browserless) WhatsApp providers that expose the
 * Baileys API. Modeled on Evolution API's Baileys service:
 *  - fetches the latest WA Web version and passes it to makeWASocket
 *  - wraps signal keys in makeCacheableSignalKeyStore for stability
 *  - converts the raw `qr` from connection.update into a base64 data URL and
 *    emits both the raw code and base64
 *  - normalizes recipients to `@s.whatsapp.net`/`@g.us` (Baileys format) via
 *    createJid
 *  - reconnects on non-terminal DisconnectReason codes
 *
 * The library is loaded with a dynamic `import()` only when a session starts, so
 * none of these packages are required for the default wppconnect provider.
 */
export class SocketProviderAdapter implements ProviderAdapter {
  public readonly capabilities: ProviderCapabilities = SOCKET_CAPABILITIES;
  public readonly session: SessionApi;
  public readonly messaging: MessagingApi;

  private sock: any = null;
  private compat: any = null;
  private lib: any = null;
  private state: ConnectionState = 'INITIALIZING';
  private qrCount = 0;
  private endSession = false;
  private readonly authDir: string;

  constructor(
    public readonly id: ProviderId,
    private readonly packageNames: string[],
    private readonly sessionName: string,
    private readonly bus: EventEmitter = new EventEmitter()
  ) {
    this.authDir = `./userDataDir/${this.id}/${this.sessionName}`;

    this.session = {
      start: async () => {
        await this.connect();
      },
      close: async () => {
        this.endSession = true;
        try {
          this.sock?.ws?.close?.();
          this.sock?.end?.(undefined);
        } catch {
          /* ignore */
        }
        this.state = 'CLOSED';
      },
      logout: async () => {
        this.endSession = true;
        try {
          await this.sock?.logout?.();
        } catch {
          /* ignore */
        }
        this.state = 'CLOSED';
      },
      getConnectionState: () => this.state,
      isConnected: async () => this.state === 'CONNECTED',
    };

    this.messaging = {
      sendText: async (to, body) =>
        this.requireSock().sendMessage(createJid(to), { text: body }),
      sendFile: async (to, file: any) =>
        this.requireSock().sendMessage(createJid(to), {
          document: file?.buffer ?? file,
          fileName: file?.fileName,
          mimetype: file?.mimetype,
        }),
      sendImage: async (to, image: any) =>
        this.requireSock().sendMessage(createJid(to), {
          image: image?.buffer ?? image,
          caption: image?.caption,
        }),
      sendPtt: async (to, audio: any) =>
        this.requireSock().sendMessage(createJid(to), {
          audio: audio?.buffer ?? audio,
          ptt: true,
          mimetype: 'audio/ogg; codecs=opus',
        }),
      sendLocation: async (to, location: any) =>
        this.requireSock().sendMessage(createJid(to), {
          location: {
            degreesLatitude: Number(location?.lat ?? location?.latitude),
            degreesLongitude: Number(location?.lng ?? location?.longitude),
          },
        }),
      react: async (messageId: any, emoji) =>
        this.requireSock().sendMessage(
          messageId?.remoteJid ?? createJid(messageId),
          { react: { text: emoji, key: messageId } }
        ),
      delete: async (to, messageId: any) =>
        this.requireSock().sendMessage(createJid(to), { delete: messageId }),
      markSeen: async (chatId) =>
        this.requireSock().readMessages([{ remoteJid: createJid(chatId) }]),
    };
  }

  /** Loads the first available package from {@link packageNames}. */
  private async loadLib(): Promise<any> {
    if (this.lib) return this.lib;
    for (const name of this.packageNames) {
      try {
        this.lib = await import(/* webpackIgnore: true */ name);
        return this.lib;
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
    this.endSession = false;
    const lib: any = await this.loadLib();
    const makeWASocket = lib.default ?? lib.makeWASocket;

    fs.mkdirSync(this.authDir, { recursive: true });
    const { state, saveCreds } = await lib.useMultiFileAuthState(this.authDir);

    // Pin to the latest WA Web version when the lib can fetch it (Evolution
    // does this — stale versions cause QR/login failures).
    let version: number[] | undefined;
    try {
      if (typeof lib.fetchLatestWaWebVersion === 'function') {
        version = (await lib.fetchLatestWaWebVersion({})).version;
      } else if (typeof lib.fetchLatestBaileysVersion === 'function') {
        version = (await lib.fetchLatestBaileysVersion()).version;
      }
    } catch {
      /* fall back to the lib default version */
    }

    const keys =
      typeof lib.makeCacheableSignalKeyStore === 'function'
        ? lib.makeCacheableSignalKeyStore(state.keys, undefined)
        : state.keys;

    this.compat = null;
    this.sock = makeWASocket({
      version,
      auth: { creds: state.creds, keys },
      printQRInTerminal: false,
      markOnlineOnConnect: false,
      generateHighQualityLinkPreview: true,
      browser: ['WPPConnect-Server', 'Chrome', '120.0.0'],
      connectTimeoutMs: 30_000,
    });

    this.sock.ev.on('creds.update', saveCreds);
    this.sock.ev.on('connection.update', (update: any) =>
      this.handleConnectionUpdate(update)
    );
    this.sock.ev.on('messages.upsert', (m: any) => {
      for (const msg of m.messages ?? []) {
        this.emit('message', { ...msg, session: this.sessionName });
      }
    });
    this.sock.ev.on('messages.update', (updates: any[]) => {
      for (const u of updates ?? []) {
        this.emit('ack', { ...u, session: this.sessionName });
      }
    });
  }

  private async handleConnectionUpdate(update: any): Promise<void> {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      this.qrCount += 1;
      this.state = 'QRCODE';
      let base64: string | undefined;
      try {
        const QRCode = await import(/* webpackIgnore: true */ 'qrcode');
        base64 = await (QRCode as any).toDataURL(qr);
      } catch {
        /* base64 optional */
      }
      this.emit('qr', {
        urlcode: qr, // raw code (scannable as text-encoded QR)
        qrcode: qr,
        base64,
        session: this.sessionName,
        attempt: this.qrCount,
      });
    }

    if (connection === 'open') {
      this.state = 'CONNECTED';
      this.emit('connection-state', {
        status: 'CONNECTED',
        session: this.sessionName,
        wid: this.sock?.user?.id,
      });
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const reasons = this.lib?.DisconnectReason ?? {};
      const noReconnect = [
        reasons.loggedOut,
        reasons.forbidden,
        401,
        402,
        403,
        406,
      ].filter((c: any) => c != null);
      const shouldReconnect =
        !this.endSession && !noReconnect.includes(statusCode);

      this.state = 'CLOSED';
      this.emit('connection-state', {
        status: shouldReconnect ? 'RECONNECTING' : 'CLOSED',
        session: this.sessionName,
        statusCode,
      });

      if (shouldReconnect) {
        // Re-establish the socket (reuses persisted creds).
        this.connect().catch(() => undefined);
      }
    }
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
    // Return the wppconnect-compatible facade so controllers calling
    // `getClient(req).<wppconnectMethod>()` work unchanged across providers.
    if (!this.sock) return undefined;
    if (!this.compat) {
      this.compat = createWppCompat(this.sock, this.sessionName);
    }
    this.compat.status = this.state;
    return this.compat;
  }
}
