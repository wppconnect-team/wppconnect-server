import { EventEmitter } from 'events';
import QRCode from 'qrcode';

import { providerFactory } from '../../core/provider/ProviderFactory';
import { sessionManager } from '../../core/session/SessionManager';
import CreateSessionUtil from '../../util/createSessionUtil';
import { callWebHook } from '../../util/functions';
import {
  cleanupSession,
  clientsArray,
  deleteSessionOnArray,
} from '../../util/sessionUtil';

jest.mock('@wppconnect-team/wppconnect', () => ({
  create: jest.fn(),
  SocketState: {},
  StatusFind: {},
}));
jest.mock('../../controller/sessionController', () => ({
  download: jest.fn(),
}));
jest.mock('../../util/tokenStore/factory', () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock('../../util/functions', () => ({
  autoDownload: jest.fn(),
  callWebHook: jest.fn(),
  startHelper: jest.fn(),
}));

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

function setup() {
  const managerEmit = jest.fn();
  const managerRoom = jest.fn(() => ({ emit: managerEmit }));
  const req: any = {
    body: { provider: 'baileys' },
    serverOptions: { webhook: { listenAcks: true } },
    logger: { info: jest.fn(), error: jest.fn() },
    io: { emit: jest.fn(), of: jest.fn(() => ({ to: managerRoom })) },
  };
  const adapters: any[] = [];
  const factory = jest
    .spyOn(providerFactory, 'createSocketProvider')
    .mockImplementation((id, session, bus = new EventEmitter()) => {
      const facade = { session, config: {} };
      const adapter: any = {
        id,
        session: {
          start: jest.fn().mockResolvedValue(undefined),
          close: jest.fn().mockResolvedValue(undefined),
        },
        raw: () => facade,
        on: (event: string, listener: any) => bus.on(event, listener),
        emit: (event: string, data: any) => bus.emit(event, data),
      };
      adapters.push(adapter);
      return adapter;
    });
  return {
    req,
    factory,
    adapters,
    util: new CreateSessionUtil(),
    managerEmit,
    managerRoom,
  };
}

describe('provider lifecycle and event contracts', () => {
  afterEach(() => {
    Object.keys(clientsArray).forEach(deleteSessionOnArray);
    sessionManager.names().forEach((name) => sessionManager.delete(name));
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('allows retry after a transient startup failure', async () => {
    const { util, req, factory, adapters } = setup();
    const implementation = factory.getMockImplementation()!;
    factory.mockImplementationOnce((...args) => {
      const adapter = implementation(...args);
      (adapter.session.start as jest.Mock).mockRejectedValueOnce(
        new Error('offline')
      );
      return adapter;
    });
    await util.opendata(req, 'retry');
    expect(clientsArray.retry.status).toBe('CLOSED');
    expect(sessionManager.has('retry')).toBe(false);
    await util.opendata(req, 'retry');
    expect(factory).toHaveBeenCalledTimes(2);
    expect(adapters[1].session.start).toHaveBeenCalledTimes(1);
  });

  it('cancels pending startup without resurrecting or closing its replacement', async () => {
    const { util, req, factory, adapters } = setup();
    const pending = deferred();
    const implementation = factory.getMockImplementation()!;
    factory.mockImplementationOnce((...args) => {
      const adapter = implementation(...args);
      (adapter.session.start as jest.Mock).mockReturnValue(pending.promise);
      return adapter;
    });
    const starting = util.opendata(req, 'replacement');
    await cleanupSession('replacement', async () => undefined);
    await util.opendata(req, 'replacement');
    const replacement = sessionManager.get('replacement');
    adapters[0].emit('connection-state', { status: 'CONNECTED' });
    pending.resolve();
    await starting;
    expect(sessionManager.get('replacement')).toBe(replacement);
    expect(replacement?.status).toBe('INITIALIZING');
    expect(adapters[0].session.close).toHaveBeenCalledTimes(1);
    expect(adapters[1].session.close).not.toHaveBeenCalled();
    expect(req.io.emit).not.toHaveBeenCalled();
  });

  it('emits a single PNG QR and scopes the manager event to its authenticated session', async () => {
    const { util, req, adapters, managerRoom, managerEmit } = setup();
    await util.opendata(req, 'pairing');
    adapters[0].emit('qr', {
      qrcode: 'raw-pairing-code',
      base64: 'data:image/png;base64,aGVsbG8=',
    });
    await Promise.resolve();
    expect(req.io.emit).toHaveBeenCalledTimes(1);
    expect(req.io.emit).toHaveBeenCalledWith('qrCode', {
      data: 'data:image/png;base64,aGVsbG8=',
      session: 'pairing',
    });
    expect(managerRoom).toHaveBeenCalledWith('session:pairing');
    expect(managerEmit).toHaveBeenCalledWith('qrCode', {
      session: 'pairing',
      data: { qrcode: 'data:image/png;base64,aGVsbG8=' },
    });
    expect(sessionManager.get('pairing')?.qrcode).toBe('raw-pairing-code');
    expect(callWebHook).toHaveBeenCalledWith(expect.anything(), req, 'qrcode', {
      qrcode: 'aGVsbG8=',
      urlcode: 'raw-pairing-code',
      session: 'pairing',
    });
  });

  it('clears pairing data on connect and never forwards events after cleanup', async () => {
    const { util, req, adapters } = setup();
    await util.opendata(req, 'closed');
    adapters[0].emit('qr', {
      qrcode: 'raw',
      base64: 'data:image/png;base64,aA==',
    });
    adapters[0].emit('connection-state', { status: 'CONNECTED' });
    expect(sessionManager.get('closed')?.qrcode).toBeUndefined();
    await cleanupSession('closed', async () => undefined);
    req.io.emit.mockClear();
    adapters[0].emit('qr', {
      qrcode: 'stale',
      base64: 'data:image/png;base64,aA==',
    });
    adapters[0].emit('any-message', { body: 'stale' });
    expect(req.io.emit).not.toHaveBeenCalled();
    expect(sessionManager.has('closed')).toBe(false);
  });

  it('does not publish a late QR conversion after the session has connected', async () => {
    const { util, req, adapters } = setup();
    let resolve!: (value: string) => void;
    jest.spyOn(QRCode, 'toDataURL').mockImplementation(
      () =>
        new Promise<string>((done) => {
          resolve = done;
        }) as any
    );
    await util.opendata(req, 'qr-race');
    adapters[0].emit('qr', { qrcode: 'raw' });
    adapters[0].emit('connection-state', { status: 'CONNECTED' });
    resolve('data:image/png;base64,aA==');
    await Promise.resolve();
    expect(sessionManager.get('qr-race')?.status).toBe('CONNECTED');
    expect(
      req.io.emit.mock.calls.filter(([event]: any[]) => event === 'qrCode')
    ).toHaveLength(0);
  });

  it('preserves received-message response wrapping and suppresses self webhooks by default', async () => {
    const { util, req, adapters } = setup();
    await util.opendata(req, 'messages');
    const message = { id: 'm1', body: 'hello', fromMe: true };
    adapters[0].emit('message', message);
    adapters[0].emit('any-message', message);
    expect(callWebHook).not.toHaveBeenCalled();
    expect(req.io.emit).toHaveBeenCalledWith('received-message', {
      response: message,
    });
  });

  it('invalidates the default provider before browser teardown even when teardown rejects', async () => {
    setup();
    const client: any = { status: 'CONNECTED', session: 'browser' };
    clientsArray.browser = client;
    sessionManager.getOrCreate('browser').adapter = {
      raw: () => client,
    } as any;
    await expect(
      cleanupSession('browser', async () => {
        expect(sessionManager.has('browser')).toBe(false);
        throw new Error('browser still owns profile');
      })
    ).rejects.toThrow('browser still owns profile');
    expect(clientsArray.browser).toBe(client);
    expect(client.status).toBe('ERROR');
    expect(sessionManager.get('browser')?.adapter?.raw()).toBe(client);
    expect(sessionManager.get('browser')?.status).toBe('CLOSED');
  });

  it('suppresses late browser messages after default-provider cleanup', async () => {
    const { util, req } = setup();
    const listeners: Record<string, any> = {};
    const client: any = {
      session: 'late-browser',
      status: 'CONNECTED',
      onMessage: jest.fn((handler) => {
        listeners.message = handler;
      }),
      onAnyMessage: jest.fn((handler) => {
        listeners.any = handler;
      }),
      onIncomingCall: jest.fn((handler) => {
        listeners.call = handler;
      }),
    };
    clientsArray['late-browser'] = client;
    await util.listenMessages(client, req);
    await cleanupSession('late-browser', async () => undefined);
    await listeners.message({ body: 'late' });
    await listeners.any({ body: 'late' });
    await listeners.call({ id: 'late' });
    expect(req.io.emit).not.toHaveBeenCalled();
    expect(callWebHook).not.toHaveBeenCalled();
  });
});
