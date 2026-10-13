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
import { clientsArray } from '../../util/sessionUtil';

jest.mock('@wppconnect-team/wppconnect', () => ({
  create: jest.fn(),
  SocketState: { CONFLICT: 'CONFLICT' },
  StatusFind: { autocloseCalled: 'autocloseCalled' },
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

describe('CreateSessionUtil initialization ownership', () => {
  function setup() {
    const create = jest.requireMock('@wppconnect-team/wppconnect').create;
    const Factory = jest.requireMock('../../util/tokenStore/factory').default;
    Factory.mockImplementation(() => ({
      createTokenStory: () => ({
        getToken: jest.fn().mockResolvedValue({}),
        setToken: jest.fn(),
      }),
    }));
    const req = {
      body: {},
      serverOptions: { createOptions: {}, webhook: {} },
      logger: { info: jest.fn(), error: jest.fn() },
    };
    const util = new CreateSessionUtil();
    util.start = jest.fn().mockResolvedValue(undefined);
    return { create, req, util };
  }

  afterEach(() => {
    delete (clientsArray as any).stale;
    jest.clearAllMocks();
  });

  it('releases INITIALIZING after an ordinary create error so it can be retried', async () => {
    const { create, req, util } = setup();
    create.mockRejectedValue(new Error('Browser startup failed'));
    await util.createSessionUtil(req, clientsArray, 'stale');
    expect((clientsArray as any).stale.status).toBe('CLOSED');
    await util.createSessionUtil(req, clientsArray, 'stale');
    expect(create).toHaveBeenCalledTimes(2);
  });

  it('closes a late client and preserves a replacement after cancellation', async () => {
    const { create, req, util } = setup();
    const replacement = { status: 'INITIALIZING', session: 'stale' };
    const lateClient = { close: jest.fn().mockResolvedValue(undefined) };
    create.mockImplementation(async () => {
      (clientsArray as any).stale = replacement;
      return lateClient;
    });
    await util.createSessionUtil(req, clientsArray, 'stale');
    expect(lateClient.close).toHaveBeenCalledTimes(1);
    expect((clientsArray as any).stale).toBe(replacement);
    expect(util.start).not.toHaveBeenCalled();
  });

  it('does not reset a replacement when the cancelled creation rejects', async () => {
    const { create, req, util } = setup();
    const replacement = { status: 'INITIALIZING', session: 'stale' };
    create.mockImplementation(async () => {
      (clientsArray as any).stale = replacement;
      throw new Error('Old browser failed');
    });
    await util.createSessionUtil(req, clientsArray, 'stale');
    expect((clientsArray as any).stale).toBe(replacement);
    expect(replacement.status).toBe('INITIALIZING');
  });

  it('ignores pairing and status callbacks from a failed attempt after retry', async () => {
    const { create, req, util } = setup();
    util.exportQR = jest.fn();
    util.exportPhoneCode = jest.fn();
    let previous: any;
    let retry: any;
    create
      .mockImplementationOnce(async (options: any) => {
        previous = options;
        throw new Error('First attempt failed');
      })
      .mockImplementationOnce(async () => {
        retry = (clientsArray as any).stale;
        previous.catchQR('qr', '', 1, 'code');
        previous.catchLinkCode('phone-code');
        previous.statusFind('autocloseCalled');
        expect((clientsArray as any).stale).toBe(retry);
        expect(retry.status).toBe('INITIALIZING');
        throw new Error('Second attempt completed for the fixture');
      });
    await util.createSessionUtil(req, clientsArray, 'stale');
    await util.createSessionUtil(req, clientsArray, 'stale');
    expect(util.exportQR).not.toHaveBeenCalled();
    expect(util.exportPhoneCode).not.toHaveBeenCalled();
  });

  it('does not start while profile cleanup holds the session reservation', async () => {
    const { create, req, util } = setup();
    (clientsArray as any).stale = { status: 'CLOSING', session: 'stale' };
    await util.createSessionUtil(req, clientsArray, 'stale');
    expect(create).not.toHaveBeenCalled();
  });

  it.each(['../outside', '/outside', 'C:\\outside'])(
    'rejects initialization session %s before creating a browser',
    async (session) => {
      const { create, req, util } = setup();
      await util.createSessionUtil(req, clientsArray, session);
      expect(create).not.toHaveBeenCalled();
      expect(Object.hasOwn(clientsArray, session)).toBe(false);
      expect(req.logger.error).toHaveBeenCalled();
    }
  );

  it('closes an initialized browser when listener setup fails before allowing a retry', async () => {
    const { create, req, util } = setup();
    const runtime = { close: jest.fn().mockResolvedValue(undefined) };
    create.mockResolvedValue(runtime);
    util.start = jest
      .fn()
      .mockRejectedValue(new Error('Listener setup failed'));
    await util.createSessionUtil(req, clientsArray, 'stale');
    expect(runtime.close).toHaveBeenCalledTimes(1);
    expect((clientsArray as any).stale.status).toBe('CLOSED');
  });

  it('retains a runtime that failed to close for explicit cleanup', async () => {
    const { create, req, util } = setup();
    const runtime = {
      close: jest.fn().mockRejectedValue(new Error('Browser close failed')),
    };
    create.mockResolvedValue(runtime);
    util.start = jest
      .fn()
      .mockRejectedValue(new Error('Listener setup failed'));
    await util.createSessionUtil(req, clientsArray, 'stale');
    expect((clientsArray as any).stale.status).toBe('ERROR');
    await util.createSessionUtil(req, clientsArray, 'stale');
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('ignores old callbacks when failed cleanup retains an ERROR owner', async () => {
    const { create, req, util } = setup();
    util.exportQR = jest.fn();
    util.exportPhoneCode = jest.fn();
    const runtime = { close: jest.fn().mockResolvedValue(undefined) };
    create.mockImplementation(async (options: any) => {
      const owner = (clientsArray as any).stale;
      owner.status = 'ERROR';
      options.catchQR('qr', '', 1, 'code');
      options.catchLinkCode('phone-code');
      options.statusFind('autocloseCalled');
      expect((clientsArray as any).stale).toBe(owner);
      expect(owner.status).toBe('ERROR');
      return runtime;
    });
    await util.createSessionUtil(req, clientsArray, 'stale');
    expect(util.exportQR).not.toHaveBeenCalled();
    expect(util.exportPhoneCode).not.toHaveBeenCalled();
    expect(runtime.close).toHaveBeenCalledTimes(1);
    expect(util.start).not.toHaveBeenCalled();
  });
});
