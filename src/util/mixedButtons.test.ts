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
import { normalizeMixedButtons } from './mixedButtons';

test('normalizes mixed reply and URL buttons without mutating the input', () => {
  const options = {
    useInteractiveMessage: true,
    buttons: [
      { text: 'Reply', id: 'reply' },
      { text: 'Visit', url: 'https://example.com' },
    ],
  };
  const result = normalizeMixedButtons(options);
  expect(result.buttons.map((button: any) => button.raw.name)).toEqual([
    'quick_reply',
    'cta_url',
  ]);
  expect(JSON.parse(result.buttons[0].raw.buttonParamsJson).id).toBe('reply');
  expect(options.buttons[0]).toEqual({ text: 'Reply', id: 'reply' });
});

test('preserves unmixed or disabled options', () => {
  const options = {
    useInteractiveMessage: true,
    buttons: [{ text: 'Reply', id: 'reply' }],
  };
  expect(normalizeMixedButtons(options)).toBe(options);
  expect(normalizeMixedButtons(undefined)).toBeUndefined();
});

test('preserves disabled input and existing raw, call and copy buttons', () => {
  const disabled = { buttons: [null] };
  expect(normalizeMixedButtons(disabled)).toBe(disabled);
  const raw = { raw: { name: 'custom', buttonParamsJson: '{}' } };
  const call = { phoneNumber: '+5511999999999', text: 'Call' };
  const copy = { code: 'token', text: 'Copy' };
  const options = {
    useInteractiveMessage: true,
    buttons: [
      { id: 'reply', text: 'Reply' },
      { url: 'https://example.com', text: 'Visit' },
      raw,
      call,
      copy,
    ],
  };
  const result = normalizeMixedButtons(options);
  expect(result.buttons.slice(2)).toEqual([raw, call, copy]);
  expect(result.buttons[2]).toBe(raw);
});
