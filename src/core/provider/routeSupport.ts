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

import { RouteNotSupportedError } from './capabilities';
import { ProviderAdapter, ProviderId } from './ProviderAdapter';

export type ProviderRouteKey = `${Uppercase<string>} ${string}`;

function route(method: string, path: string): ProviderRouteKey {
  return `${method.toUpperCase()} ${path}` as ProviderRouteKey;
}

const SESSION_ROUTES = [
  route('GET', '/api/:session/check-connection-session'),
  route('GET', '/api/:session/qrcode-session'),
  route('GET', '/api/:session/status-session'),
  route('POST', '/api/:session/start-session'),
  route('POST', '/api/:session/close-session'),
  route('POST', '/api/:session/logout-session'),
  route('POST', '/api/:session/subscribe-presence'),
  route('POST', '/api/:session/set-online-presence'),
] as const;

const COMMON_SOCKET_ROUTES = [
  route('POST', '/api/:session/send-message'),
  route('POST', '/api/:session/send-image'),
  route('POST', '/api/:session/send-file'),
  route('POST', '/api/:session/send-file-base64'),
  route('POST', '/api/:session/send-voice'),
  route('POST', '/api/:session/send-reply'),
  route('POST', '/api/:session/delete-message'),
  route('POST', '/api/:session/archive-chat'),
  route('POST', '/api/:session/typing'),
  route('POST', '/api/:session/recording'),
  route('GET', '/api/:session/profile/:phone'),
  route('GET', '/api/:session/profile-pic/:phone'),
  route('GET', '/api/:session/profile-status/:phone'),
  route('POST', '/api/:session/block-contact'),
  route('POST', '/api/:session/unblock-contact'),
  route('GET', '/api/:session/host-device'),
  route('GET', '/api/:session/get-phone-number'),
  route('GET', '/api/:session/all-groups'),
  route('GET', '/api/:session/group-members/:groupId'),
  route('GET', '/api/:session/group-admins/:groupId'),
  route('GET', '/api/:session/group-invite-link/:groupId'),
  route('GET', '/api/:session/group-revoke-link/:groupId'),
  route('GET', '/api/:session/group-members-ids/:groupId'),
  route('POST', '/api/:session/create-group'),
  route('POST', '/api/:session/leave-group'),
  route('POST', '/api/:session/join-code'),
  route('POST', '/api/:session/add-participant-group'),
  route('POST', '/api/:session/remove-participant-group'),
  route('POST', '/api/:session/promote-participant-group'),
  route('POST', '/api/:session/demote-participant-group'),
  route('POST', '/api/:session/group-description'),
  route('POST', '/api/:session/group-subject'),
] as const;

const BAILEYS_FAMILY_ROUTES = [
  route('GET', '/api/:session/check-number-status/:phone'),
  route('POST', '/api/:session/send-location'),
  route('POST', '/api/:session/forward-messages'),
  route('POST', '/api/:session/contact-vcard'),
  route('GET', '/api/:session/all-contacts'),
  route('GET', '/api/:session/all-chats'),
  route('POST', '/api/:session/list-chats'),
  route('GET', '/api/:session/all-chats-archived'),
  route('GET', '/api/:session/all-chats-with-messages'),
] as const;

function supportedRoutes(
  ...groups: ReadonlyArray<readonly ProviderRouteKey[]>
) {
  return new Set(groups.flat());
}

/**
 * Explicit compatibility contract for the experimental providers. Unknown
 * routes are intentionally unsupported until their adapter translation and
 * response shape are covered by tests.
 */
export const PROVIDER_ROUTE_SUPPORT: Readonly<
  Record<Exclude<ProviderId, 'wppconnect'>, ReadonlySet<ProviderRouteKey>>
> = Object.freeze({
  baileys: supportedRoutes(
    SESSION_ROUTES,
    COMMON_SOCKET_ROUTES,
    BAILEYS_FAMILY_ROUTES
  ),
  whaileys: supportedRoutes(
    SESSION_ROUTES,
    COMMON_SOCKET_ROUTES,
    BAILEYS_FAMILY_ROUTES
  ),
  zapo: supportedRoutes(SESSION_ROUTES, COMMON_SOCKET_ROUTES),
});

export function assertProviderRouteSupported(
  provider: ProviderAdapter | undefined,
  method: string,
  path: unknown
): void {
  if (!provider || provider.id === 'wppconnect') return;

  const pathLabel = typeof path === 'string' ? path : String(path);
  const key = route(method, pathLabel);
  if (!PROVIDER_ROUTE_SUPPORT[provider.id].has(key)) {
    throw new RouteNotSupportedError(provider.id, method, pathLabel);
  }
}
