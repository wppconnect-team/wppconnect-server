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
import { deleteMessageWithResult } from './deleteMessageWithResult';

test('returns the browser result and forwards deletion options', async () => {
  const page = { evaluate: jest.fn().mockResolvedValue({ deleted: true }) };
  await expect(
    deleteMessageWithResult(page, 'recipient', 'message', false, true)
  ).resolves.toEqual({ deleted: true });
  expect(page.evaluate.mock.calls[0][1]).toEqual({
    chatId: 'recipient',
    messageId: 'message',
    deleteMediaInDevice: false,
    revoke: false,
  });
});

test('defaults to revocation and media deletion', async () => {
  const page = { evaluate: jest.fn().mockResolvedValue(true) };
  await deleteMessageWithResult(page, 'recipient', 'message');
  expect(page.evaluate.mock.calls[0][1]).toEqual({
    chatId: 'recipient',
    messageId: 'message',
    deleteMediaInDevice: true,
    revoke: true,
  });
});
