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

import { ProviderId } from '../provider/ProviderAdapter';
import { createSessionHandle, SessionHandle } from './SessionHandle';

/**
 * Owns the set of live sessions, keyed by session name. Replaces the global
 * `clientsArray` (which was typed as an array but used as a string-keyed map).
 *
 * During migration `clientsArray` remains exported from `util/sessionUtil` as a
 * read-through facade over this manager, so call sites reading
 * `clientsArray[session]` keep working until they are migrated (PR7).
 */
export class SessionManager {
  private readonly sessions = new Map<string, SessionHandle>();

  get(name: string): SessionHandle | undefined {
    return this.sessions.get(name);
  }

  has(name: string): boolean {
    return this.sessions.has(name);
  }

  /**
   * Returns the existing handle for `name`, or creates a new one. The provider
   * is only applied when creating; an existing handle keeps its provider.
   */
  getOrCreate(
    name: string,
    providerId: ProviderId = 'wppconnect'
  ): SessionHandle {
    let handle = this.sessions.get(name);
    if (!handle) {
      handle = createSessionHandle(name, providerId);
      this.sessions.set(name, handle);
    }
    return handle;
  }

  list(): SessionHandle[] {
    return Array.from(this.sessions.values());
  }

  names(): string[] {
    return Array.from(this.sessions.keys());
  }

  delete(name: string): void {
    this.sessions.delete(name);
  }
}

/**
 * Process-wide singleton. The server keeps a single in-memory session table,
 * matching the previous `clientsArray` lifetime.
 */
export const sessionManager = new SessionManager();
