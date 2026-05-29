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
import { WppConnectAdapter } from './wppconnect/WppConnectAdapter';

/**
 * Set of providers that are gated behind the experimental feature flag. Only
 * `wppconnect` is stable in PR1; the rest become available once their adapters
 * land (PR8) and `ENABLE_EXPERIMENTAL_PROVIDERS` is set.
 */
const EXPERIMENTAL_PROVIDERS: ReadonlySet<ProviderId> = new Set<ProviderId>([
  'baileys',
  'whaileys',
  'zapo',
]);

function experimentalEnabled(): boolean {
  return process.env.ENABLE_EXPERIMENTAL_PROVIDERS === 'true';
}

/**
 * Builds {@link ProviderAdapter} instances, mirroring the existing
 * `tokenStore/factory.ts` pattern (select-by-type, return the abstraction).
 *
 * In PR1 the only concrete adapter is wppconnect, created by wrapping a client
 * that was already instantiated by `createSessionUtil`. Experimental providers
 * throw until their adapters exist and the flag is enabled.
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
   * Creates an experimental provider adapter (currently only Baileys), after
   * verifying the feature flag is enabled. The session name is needed for the
   * provider's own credential storage.
   */
  public createExperimental(
    providerId: ProviderId,
    sessionName: string,
    bus?: EventEmitter
  ): ProviderAdapter {
    this.assertSupported(providerId);

    switch (providerId) {
      case 'baileys':
        return new BaileysAdapter(sessionName, bus);
      default:
        throw new Error(`Provider "${providerId}" is not implemented yet.`);
    }
  }

  /**
   * Validates a provider id can be used in the current configuration.
   * Experimental providers require `ENABLE_EXPERIMENTAL_PROVIDERS=true`.
   */
  public assertSupported(providerId: ProviderId): void {
    if (providerId === 'wppconnect') return;

    if (!EXPERIMENTAL_PROVIDERS.has(providerId)) {
      throw new Error(`Unknown provider "${providerId}".`);
    }
    if (!experimentalEnabled()) {
      throw new Error(
        `Provider "${providerId}" is experimental. Set ENABLE_EXPERIMENTAL_PROVIDERS=true to use it.`
      );
    }
  }
}

export const providerFactory = new ProviderFactory();
