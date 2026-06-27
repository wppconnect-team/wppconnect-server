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

import { ProviderCapabilities } from './capabilities';

/**
 * Identifier of a WhatsApp provider implementation.
 * `wppconnect` is the default; the others are experimental and gated behind a
 * feature flag.
 */
export type ProviderId = 'wppconnect' | 'baileys' | 'whaileys' | 'zapo';

/**
 * Connection lifecycle states, normalized across providers. Mirrors the string
 * values the server already sets on the session object today, so existing
 * consumers of `client.status` keep working.
 */
export type ConnectionState =
  | 'INITIALIZING'
  | 'QRCODE'
  | 'PHONECODE'
  | 'CONNECTED'
  | 'CLOSED';

export interface HealthState {
  connected: boolean;
  state: ConnectionState;
}

/**
 * Normalized events a provider emits. The `EventDispatcher` (PR2) subscribes
 * to these and fans them out to webhooks and socket.io, decoupling the server
 * from the underlying library's event method names.
 */
export type ProviderEvent =
  | 'message'
  | 'any-message'
  | 'ack'
  | 'connection-state'
  | 'qr'
  | 'phone-code'
  | 'reaction'
  | 'revoked'
  | 'poll-response'
  | 'label-updated'
  | 'participants-changed'
  | 'presence'
  | 'incoming-call'
  | 'state-change';

/**
 * CORE — session lifecycle. Every provider must implement this.
 */
export interface SessionApi {
  start(): Promise<void>;
  close(): Promise<void>;
  logout(): Promise<void>;
  getConnectionState(): Promise<ConnectionState> | ConnectionState;
  isConnected(): Promise<boolean>;
  getHostDevice?(): Promise<unknown>;
  getWid?(): Promise<string>;
}

/**
 * CORE — messaging. Every provider must implement at least text + media.
 * Optional members are feature-gated via {@link ProviderCapabilities}.
 */
export interface MessagingApi {
  sendText(to: string, body: string, options?: unknown): Promise<unknown>;
  sendFile(to: string, file: unknown, options?: unknown): Promise<unknown>;
  sendImage(to: string, image: unknown, options?: unknown): Promise<unknown>;
  sendPtt?(to: string, audio: unknown, options?: unknown): Promise<unknown>;
  sendLocation?(to: string, location: unknown): Promise<unknown>;
  reply?(to: string, body: string, quotedId: string): Promise<unknown>;
  forward?(to: string, messageId: string): Promise<unknown>;
  react?(messageId: string, emoji: string): Promise<unknown>;
  edit?(messageId: string, newBody: string): Promise<unknown>;
  delete?(to: string, messageId: string): Promise<unknown>;
  markSeen(chatId: string): Promise<unknown>;
  sendContactVcard?(to: string, contactId: string): Promise<unknown>;
}

/* Optional / feature-gated sub-APIs. Each one is intentionally loose for now;
 * concrete method signatures are tightened as controllers migrate per block
 * (PR4-PR6). Presence of the sub-API on the adapter signals support, in
 * addition to the capability map. */
export type GroupApi = Record<string, (...args: any[]) => Promise<unknown>>;
export type ContactApi = Record<string, (...args: any[]) => Promise<unknown>>;
export type ChatApi = Record<string, (...args: any[]) => Promise<unknown>>;
export type CatalogApi = Record<string, (...args: any[]) => Promise<unknown>>;
export type LabelApi = Record<string, (...args: any[]) => Promise<unknown>>;
export type StatusApi = Record<string, (...args: any[]) => Promise<unknown>>;
export type CommunityApi = Record<string, (...args: any[]) => Promise<unknown>>;
export type NewsletterApi = Record<
  string,
  (...args: any[]) => Promise<unknown>
>;

/**
 * The provider abstraction. Sub-APIs are segregated by capability rather than
 * exposed as one flat interface of ~150 methods, so a provider can implement
 * only what it supports (e.g. Baileys without catalog/stories).
 *
 * During migration, {@link ProviderAdapter.raw} returns the underlying client
 * so the existing `req.client.*` call sites keep working unchanged.
 */
export interface ProviderAdapter {
  readonly id: ProviderId;
  readonly capabilities: ProviderCapabilities;

  readonly session: SessionApi;
  readonly messaging: MessagingApi;

  readonly groups?: GroupApi;
  readonly contacts?: ContactApi;
  readonly chats?: ChatApi;
  readonly catalog?: CatalogApi;
  readonly labels?: LabelApi;
  readonly status?: StatusApi;
  readonly community?: CommunityApi;
  readonly newsletter?: NewsletterApi;

  /** Subscribe to a normalized provider event (wired up by the EventDispatcher). */
  on(event: ProviderEvent, handler: (data: unknown) => void): void;

  /** Lightweight health probe for the manager / health checks. */
  health(): Promise<HealthState>;

  /**
   * Escape hatch returning the underlying client. Used as a bridge so the
   * existing controllers (`req.client.sendText`, etc.) keep working while
   * they are migrated to the typed sub-APIs. Removed once migration completes.
   */
  raw(): unknown;
}
