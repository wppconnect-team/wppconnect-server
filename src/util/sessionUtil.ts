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

export const chromiumArgs = [
  '--disable-web-security', // Disables web security
  '--no-sandbox', // Disables sandbox
  '--aggressive-cache-discard', // Aggressively discards cache
  '--disable-cache', // Disables cache
  '--disable-application-cache', // Disables application cache
  '--disable-offline-load-stale-cache', // Disables loading stale offline cache
  '--disk-cache-size=0', // Sets disk cache size to 0
  '--disable-background-networking', // Disables background networking activities
  '--disable-default-apps', // Disables default apps
  '--disable-extensions', // Disables extensions
  '--disable-sync', // Disables synchronization
  '--disable-translate', // Disables translation
  '--hide-scrollbars', // Hides scrollbars
  '--metrics-recording-only', // Records metrics only
  '--mute-audio', // Mutes audio
  '--no-first-run', // Skips first run
  '--safebrowsing-disable-auto-update', // Disables Safe Browsing auto-update
  '--ignore-certificate-errors', // Ignores certificate errors
  '--ignore-ssl-errors', // Ignores SSL errors
  '--ignore-certificate-errors-spki-list', // Ignores certificate errors in SPKI list
];
// eslint-disable-next-line prefer-const
export let clientsArray: Whatsapp[] = [];
export const sessions = [];
export const eventEmitter = new EventEmitter();

export function deleteSessionOnArray(session: string): void {
  const newArray = clientsArray;
  delete clientsArray[session];
  clientsArray = newArray;
}
