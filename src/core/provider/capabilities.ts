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

/**
 * Capabilities a provider may declare support for. Used by the standardized
 * error layer to return a `501 Not Implemented` when a route exercises a
 * feature the active provider does not support, instead of a generic `500`.
 *
 * Capability keys mirror the public route groups so the mapping from an
 * endpoint to a capability stays obvious.
 */
export const CAPABILITIES = [
  'messaging.text',
  'messaging.media',
  'messaging.location',
  'messaging.reply',
  'messaging.forward',
  'messaging.react',
  'messaging.edit',
  'messaging.delete',
  'messaging.poll',
  'messaging.buttons',
  'messaging.list',
  'messaging.pix',
  'messaging.order',
  'groups',
  'community',
  'newsletter',
  'contacts',
  'chats',
  'catalog',
  'labels',
  'stories',
  'presence',
  'screenshot',
  'business-profile',
] as const;

export type Capability = (typeof CAPABILITIES)[number];

/**
 * A read-only map declaring which capabilities a provider supports.
 * The `WppConnectAdapter` declares every capability `true`, so behavior is
 * unchanged until experimental providers (Baileys, whaileys, zapo) opt out.
 */
export type ProviderCapabilities = Readonly<Record<Capability, boolean>>;

/**
 * Builds a capability map, defaulting any unspecified capability to `false`.
 * Pass `{ all: true }` to default everything to `true` (used by wppconnect).
 */
export function buildCapabilities(
  overrides: Partial<Record<Capability, boolean>> = {},
  options: { all?: boolean } = {}
): ProviderCapabilities {
  const base = {} as Record<Capability, boolean>;
  for (const cap of CAPABILITIES) {
    base[cap] = options.all ?? false;
  }
  return Object.freeze({ ...base, ...overrides });
}

/**
 * Thrown when a route exercises a capability the active provider does not
 * support. The central error handler maps this to HTTP 501.
 */
export class NotSupportedError extends Error {
  public readonly httpStatus = 501;

  constructor(
    public readonly providerId: string,
    public readonly capability: Capability
  ) {
    super(
      `Provider "${providerId}" does not support capability "${capability}".`
    );
    this.name = 'NotSupportedError';
  }
}

/**
 * Thrown when an action is attempted on a session that has no live provider
 * yet (not started / not connected). The central error handler maps this to
 * HTTP 404, preserving the current "session not connected" semantics.
 */
export class SessionNotReadyError extends Error {
  public readonly httpStatus = 404;

  constructor(public readonly session: string) {
    super(`Session "${session}" is not ready.`);
    this.name = 'SessionNotReadyError';
  }
}
