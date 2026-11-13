/*
 * Copyright 2026 WPPConnect Team
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
function isValidButton(button: any): boolean {
  if (!button || typeof button !== 'object' || Array.isArray(button))
    return false;
  const kinds = ['id', 'url', 'phoneNumber', 'code', 'raw'].filter(
    (key) => key in button
  );
  if (kinds.length !== 1) return false;
  if (kinds[0] === 'raw') {
    return (
      !!button.raw &&
      typeof button.raw.name === 'string' &&
      button.raw.name.trim().length > 0 &&
      (button.raw.buttonParamsJson === undefined ||
        typeof button.raw.buttonParamsJson === 'string')
    );
  }
  return (
    typeof button.text === 'string' &&
    button.text.trim().length > 0 &&
    typeof button[kinds[0]] === 'string' &&
    button[kinds[0]].trim().length > 0
  );
}

export function isValidCarousel(
  phone: any,
  body: any,
  cards: any,
  footer?: unknown
): boolean {
  return (
    Array.isArray(phone) &&
    phone.length > 0 &&
    phone.every(
      (value: any) => typeof value === 'string' && value.length > 0
    ) &&
    typeof body === 'string' &&
    (footer === undefined || typeof footer === 'string') &&
    Array.isArray(cards) &&
    cards.length >= 2 &&
    cards.length <= 10 &&
    cards.every(
      (card: any) =>
        card &&
        typeof card.image === 'string' &&
        card.image.startsWith('data:image/') &&
        typeof card.description === 'string' &&
        (card.title === undefined || typeof card.title === 'string') &&
        (card.footer === undefined || typeof card.footer === 'string') &&
        Array.isArray(card.buttons) &&
        card.buttons.length >= 1 &&
        card.buttons.length <= 3 &&
        card.buttons.every(isValidButton)
    )
  );
}
