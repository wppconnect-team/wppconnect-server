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

import { BaileysAdapter } from './baileys/BaileysAdapter';
import { ProviderAdapter, ProviderId } from './ProviderAdapter';
import { WhaileysAdapter } from './whaileys/WhaileysAdapter';
import { WppConnectAdapter } from './wppconnect/WppConnectAdapter';
import { ZapoAdapter } from './zapo/ZapoAdapter';

/** Provider ids backed by a socket library (created on demand by name). */
const SOCKET_PROVIDERS: ReadonlySet<ProviderId> = new Set<ProviderId>([
  'baileys',
  'whaileys',
  'zapo',
]);

/**
 * Builds {@link ProviderAdapter} instances, mirroring the existing
 * `tokenStore/factory.ts` pattern (select-by-type, return the abstraction).
 *
 * All providers are first-class: `wppconnect` wraps the browser client created
 * by `createSessionUtil`; the socket providers (baileys, whaileys, zapo) are
 * created by name. No feature flag — the provider is chosen per session via the
 * `provider` field on `start-session`.
 */
export class ProviderFactory {
  /**
   * Wraps an already-created wppconnect client in its adapter. This is the path
   * used today: `createSessionUtil` builds the client, the factory just adapts
   * it without changing the creation flow.
   */
  public createWppConnect(
    client: Whatsapp,
    bus?: EventEmitter
  ): ProviderAdapter {
    return new WppConnectAdapter(client, bus);
  }

  /**
   * Creates a socket-based provider adapter (baileys, whaileys, zapo) by id.
   * The session name is needed for the provider's own credential storage.
   */
  public createSocketProvider(
    providerId: ProviderId,
    sessionName: string,
    bus?: EventEmitter
  ): ProviderAdapter {
    switch (providerId) {
      case 'baileys':
        return new BaileysAdapter(sessionName, bus);
      case 'whaileys':
        return new WhaileysAdapter(sessionName, bus);
      case 'zapo':
        return new ZapoAdapter(sessionName, bus);
      default:
        throw new Error(`Provider "${providerId}" is not a socket provider.`);
    }
  }

  /** Whether a provider id is known/supported. */
  public isKnown(providerId: ProviderId): boolean {
    return providerId === 'wppconnect' || SOCKET_PROVIDERS.has(providerId);
  }

  /** Whether a provider is socket-based (vs the wppconnect browser flow). */
  public isSocketProvider(providerId: ProviderId): boolean {
    return SOCKET_PROVIDERS.has(providerId);
  }

  /** Validates a provider id can be used. Throws for unknown providers. */
  public assertSupported(providerId: ProviderId): void {
    if (!this.isKnown(providerId)) {
      throw new Error(`Unknown provider "${providerId}".`);
    }
  }
}

export const providerFactory = new ProviderFactory();
