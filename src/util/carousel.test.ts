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
import { isValidCarousel } from './carousel';

test('validates carousel card and recipient limits', () => {
  const card = {
    image: 'data:image/png;base64,AA==',
    description: 'Card',
    buttons: [{ id: 'reply', text: 'Reply' }],
  };
  expect(isValidCarousel(['recipient'], 'Body', [card, card])).toBe(true);
  expect(isValidCarousel([], 'Body', [card, card])).toBe(false);
  expect(isValidCarousel(['recipient'], 'Body', [card])).toBe(false);
  expect(
    isValidCarousel(['recipient'], 'Body', [card, { ...card, buttons: [] }])
  ).toBe(false);
  expect(
    isValidCarousel(['recipient'], 'Body', [
      card,
      { ...card, image: 'https://example.com/image.png' },
    ])
  ).toBe(false);
});

test.each([
  null,
  {},
  [],
  { id: 'reply' },
  { text: 'Reply', id: 1 },
  { id: 'reply', url: 'https://example.com', text: 'Conflict' },
  { raw: {} },
])('rejects invalid carousel buttons: %j', (button) => {
  const card = {
    image: 'data:image/png;base64,AA==',
    description: 'Card',
    buttons: [button],
  };
  expect(isValidCarousel(['recipient'], 'Body', [card, card])).toBe(false);
});

test.each([
  { id: 'reply', text: 'Reply' },
  { url: 'https://example.com', text: 'Visit' },
  { phoneNumber: '+5511999999999', text: 'Call' },
  { code: 'token', text: 'Copy' },
  {
    raw: {
      name: 'quick_reply',
      buttonParamsJson: '{"id":"reply","display_text":"Reply"}',
    },
  },
])('retains supported native button forms: %j', (button) => {
  const card = {
    image: 'data:image/png;base64,AA==',
    description: 'Card',
    buttons: [button],
  };
  expect(isValidCarousel(['recipient'], 'Body', [card, card], 'Footer')).toBe(
    true
  );
  expect(isValidCarousel(['recipient'], 'Body', [card, card], 42)).toBe(false);
});

test('rejects upper card and button limits and malformed optional card text', () => {
  const card = {
    image: 'data:image/png;base64,AA==',
    description: 'Card',
    buttons: [{ id: 'reply', text: 'Reply' }],
  };
  expect(isValidCarousel(['recipient'], 'Body', Array(11).fill(card))).toBe(
    false
  );
  expect(
    isValidCarousel(['recipient'], 'Body', [
      card,
      { ...card, buttons: Array(4).fill(card.buttons[0]) },
    ])
  ).toBe(false);
  expect(
    isValidCarousel(['recipient'], 'Body', [card, { ...card, title: 123 }])
  ).toBe(false);
});
