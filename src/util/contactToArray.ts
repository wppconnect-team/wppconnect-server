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

/** Normalizes one or more recipients to the legacy WPPConnect JID format. */
export function contactToArray(
  number: string | string[],
  isGroup?: boolean,
  isNewsletter?: boolean,
  isLid?: boolean
): string[] {
  const contacts = Array.isArray(number) ? number : number.split(/\s*[,;]\s*/g);

  return contacts.flatMap((value) => {
    let contact = value;
    contact =
      isGroup || isNewsletter
        ? contact.split('@')[0]
        : contact.split('@')[0]?.replace(/[^\w ]/g, '');

    if (!contact) return [];
    if (isGroup) return [`${contact}@g.us`];
    if (isNewsletter) return [`${contact}@newsletter`];
    if (isLid || contact.length > 14) return [`${contact}@lid`];
    return [`${contact}@c.us`];
  });
}
