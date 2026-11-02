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

import { SocketProviderAdapter } from '../socket/SocketProviderAdapter';

/**
 * EXPERIMENTAL provider backed by the Baileys family. Prefers the controlled
 * package name `@wppconnect/baileys`, falling back to upstream
 * `@whiskeysockets/baileys`. The scoped package is currently installed as an
 * npm alias, so runtime imports keep working until a native fork is published.
 * See {@link SocketProviderAdapter} for behavior.
 */
export class BaileysAdapter extends SocketProviderAdapter {
  constructor(sessionName: string, bus?: EventEmitter) {
    super(
      'baileys',
      ['@wppconnect/baileys', '@whiskeysockets/baileys'],
      sessionName,
      bus
    );
  }
}
