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
export class InvalidMixedButtonsError extends Error {}

export function normalizeMixedButtons(options: any): any {
  if (!options?.useInteractiveMessage || !Array.isArray(options.buttons))
    return options;
  const buttons = options.buttons;
  if (
    buttons.some(
      (button: any) =>
        !button || typeof button !== 'object' || Array.isArray(button)
    )
  ) {
    throw new InvalidMixedButtonsError('Interactive buttons must be objects');
  }
  const hasReply = buttons.some(
    (button: any) =>
      button.id &&
      !button.url &&
      !button.phoneNumber &&
      !button.code &&
      !button.raw
  );
  if (!hasReply || !buttons.some((button: any) => button.url && !button.raw))
    return options;
  for (const button of buttons) {
    if (button.raw) continue;
    const isReply =
      button.id && !button.url && !button.phoneNumber && !button.code;
    if (button.url || isReply) {
      const action = button.url || button.id;
      if (
        typeof action !== 'string' ||
        !action.trim() ||
        typeof button.text !== 'string' ||
        !button.text.trim()
      ) {
        throw new InvalidMixedButtonsError(
          'Mixed reply and URL buttons require nonempty text and string actions'
        );
      }
    }
  }
  return {
    ...options,
    buttons: buttons.map((button: any) => {
      if (button.raw) return button;
      if (button.url)
        return {
          raw: {
            name: 'cta_url',
            buttonParamsJson: JSON.stringify({
              display_text: button.text,
              url: button.url,
            }),
          },
        };
      if (button.id && !button.phoneNumber && !button.code)
        return {
          raw: {
            name: 'quick_reply',
            buttonParamsJson: JSON.stringify({
              display_text: button.text,
              id: button.id,
            }),
          },
        };
      return button;
    }),
  };
}
