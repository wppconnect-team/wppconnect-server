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
 * Normalizes a phone number / id into a Baileys JID. Mirrors the logic used by
 * Evolution API's `createJid`: Baileys uses `@s.whatsapp.net` for individuals
 * (NOT `@c.us`, which is wppconnect's format) and `@g.us` for groups, plus the
 * Brazil 9th-digit handling.
 */
export function createJid(input: string): string {
  let number = String(input);

  // Already a JID — pass through unchanged.
  if (
    number.includes('@g.us') ||
    number.includes('@s.whatsapp.net') ||
    number.includes('@lid') ||
    number.includes('@broadcast') ||
    number.includes('@newsletter')
  ) {
    return number;
  }

  // wppconnect-style suffix: convert @c.us -> bare number.
  number = number.replace('@c.us', '');

  // Clean: drop spaces, +, parentheses, and anything after : or @.
  number = number
    .replace(/\s/g, '')
    .replace(/\+/g, '')
    .replace(/\(/g, '')
    .replace(/\)/g, '')
    .split(':')[0]
    .split('@')[0];

  // Group ids (long numeric, possibly hyphenated).
  if ((number.includes('-') && number.length >= 24) || number.length >= 18) {
    number = number.replace(/[^\d-]/g, '');
    return `${number}@g.us`;
  }

  number = number.replace(/\D/g, '');

  // Brazil (55): drop the extra 9th digit for older area codes when present.
  number = applyBrazilRule(number);

  return `${number}@s.whatsapp.net`;
}

function applyBrazilRule(number: string): string {
  if (!number.startsWith('55')) return number;
  // 55 + DDD(2) + 9 + 8 digits = 13 chars
  const match = number.match(/^(\d{2})(\d{2})\d{1}(\d{8})$/);
  if (!match) return number;
  const areaCode = parseInt(match[2], 10);
  const firstMobileDigit = number.charAt(4);
  // Keep the 9 for newer area codes (>= 31) / mobile prefixes (>= 7).
  if (parseInt(firstMobileDigit, 10) < 7 || areaCode < 31) {
    return number;
  }
  return match[1] + match[2] + match[3];
}
