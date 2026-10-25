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

import {
  ConnectionState,
  ProviderAdapter,
  ProviderId,
} from '../provider/ProviderAdapter';

/**
 * Per-session configuration. This is the object the server currently builds
 * from `req.body` on `/start-session` (webhook, proxy, chatWoot, ...), plus an
 * optional `provider` field selecting which provider backs the session
 * (defaults to `wppconnect` for backward compatibility).
 */
export interface SessionConfig {
  provider?: ProviderId;
  webhook?: unknown;
  proxy?: { url?: string; username?: string; password?: string };
  chatWoot?: unknown;
  phone?: string;
  deviceName?: string;
  poweredBy?: string;
  [key: string]: unknown;
}

/**
 * Everything the server tracks about a live session. Replaces the previous
 * pattern of mutating the wppconnect client in place (`Object.assign(wppClient,
 * client)`): session state lives here, the library object lives behind
 * `adapter`. The `bus` carries normalized provider events (consumed in PR2).
 */
export interface SessionHandle {
  readonly name: string;
  providerId: ProviderId;
  adapter?: ProviderAdapter;
  status: ConnectionState;
  qrcode?: string;
  urlcode?: string;
  phoneCode?: string;
  config: SessionConfig;
  readonly bus: EventEmitter;
  readonly metadata: {
    createdAt: number;
    lastStateChangeAt: number;
  };
}

/**
 * Creates a fresh handle for a session that has not been started yet.
 * `Date.now()` is read here (not at module load) so timestamps reflect real
 * creation time.
 */
export function createSessionHandle(
  name: string,
  providerId: ProviderId = 'wppconnect'
): SessionHandle {
  const now = Date.now();
  return {
    name,
    providerId,
    adapter: undefined,
    status: 'INITIALIZING',
    config: {},
    bus: new EventEmitter(),
    metadata: { createdAt: now, lastStateChangeAt: now },
  };
}
