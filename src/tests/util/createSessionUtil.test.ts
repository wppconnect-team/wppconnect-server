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
import CreateSessionUtil from '../../util/createSessionUtil';

jest.mock('@wppconnect-team/wppconnect', () => ({
  create: jest.fn(),
  SocketState: { CONFLICT: 'CONFLICT' },
  StatusFind: {},
}));
jest.mock('../../controller/sessionController', () => ({
  download: jest.fn(),
}));
jest.mock('../../util/functions', () => ({
  autoDownload: jest.fn(),
  callWebHook: jest.fn(),
  startHelper: jest.fn(),
}));
jest.mock('../../util/tokenStore/factory', () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe('CreateSessionUtil optional webhook listeners', function () {
  const cases = [
    {
      method: 'onParticipantsChanged',
      listener: 'onParticipantsChanged',
      register: (util: CreateSessionUtil, client: any, req: any) =>
        util.onParticipantsChanged(req, client),
    },
    {
      method: 'onReactionMessage',
      listener: 'onReactionMessage',
      register: (util: CreateSessionUtil, client: any, req: any) =>
        util.onReactionMessage(client, req),
    },
    {
      method: 'onRevokedMessage',
      listener: 'onRevokedMessage',
      register: (util: CreateSessionUtil, client: any, req: any) =>
        util.onRevokedMessage(client, req),
    },
    {
      method: 'onPollResponse',
      listener: 'onPollResponse',
      register: (util: CreateSessionUtil, client: any, req: any) =>
        util.onPollResponse(client, req),
    },
    {
      method: 'onLabelUpdated',
      listener: 'onUpdateLabel',
      register: (util: CreateSessionUtil, client: any, req: any) =>
        util.onLabelUpdated(client, req),
    },
  ];

  it.each(cases)(
    'registers $method without probing WAPI connection state',
    async ({ listener, register }) => {
      const util = new CreateSessionUtil();
      const client = {
        isConnected: jest
          .fn()
          .mockRejectedValue(new ReferenceError('WAPI is not defined')),
        [listener]: jest.fn().mockResolvedValue(undefined),
      };
      const req = { io: { emit: jest.fn() } };

      await expect(register(util, client, req)).resolves.toBeUndefined();
      expect(client.isConnected).not.toHaveBeenCalled();
      expect(client[listener]).toHaveBeenCalledTimes(1);
    }
  );
});
