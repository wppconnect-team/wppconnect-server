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

import { Request } from 'express';

import { WhatsAppServer } from '../../types/WhatsAppServer';

/**
 * Returns the active WhatsApp client for the request, routed THROUGH the
 * provider layer: the provider adapter's `raw()` when a provider is attached,
 * otherwise the legacy `req.client`.
 *
 * Controllers call this instead of touching `req.client` directly, so every
 * data access flows through the provider abstraction. For the default
 * wppconnect provider `raw()` returns the same underlying client, so behavior
 * and the public API are unchanged — this is the seam that lets an alternative
 * provider take over without rewriting ~150 controller call sites.
 */
export function getClient(req: Request): WhatsAppServer {
  const fromProvider = req.provider?.raw() as WhatsAppServer | undefined;
  return fromProvider ?? req.client;
}
