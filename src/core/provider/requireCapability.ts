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

import { Capability, NotSupportedError } from './capabilities';
import { ProviderAdapter } from './ProviderAdapter';

/**
 * Asserts the given provider supports `capability`, throwing
 * {@link NotSupportedError} (HTTP 501) otherwise. Used by controllers/routes
 * to guard feature-gated actions in a single, consistent place rather than
 * scattering ad-hoc `501` responses.
 *
 * No-op for the default wppconnect provider, which declares every capability.
 */
export function requireCapability(
  provider: ProviderAdapter | undefined,
  capability: Capability
): void {
  if (!provider || !provider.capabilities[capability]) {
    throw new NotSupportedError(provider?.id ?? 'unknown', capability);
  }
}

export function supportsCapability(
  provider: ProviderAdapter | undefined,
  capability: Capability
): boolean {
  return Boolean(provider && provider.capabilities[capability]);
}
