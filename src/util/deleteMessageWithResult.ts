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
export async function deleteMessageWithResult(
  page: any,
  chatId: string,
  messageId: string,
  deleteMediaInDevice?: boolean,
  onlyLocal?: boolean
): Promise<any> {
  return page.evaluate(
    async (args: any) => {
      return (window as any).WPP.chat.deleteMessage(
        args.chatId,
        args.messageId,
        args.deleteMediaInDevice,
        args.revoke
      );
    },
    {
      chatId,
      messageId,
      deleteMediaInDevice: deleteMediaInDevice !== false,
      revoke: onlyLocal !== true,
    }
  );
}
