import { EventDispatcher } from '../../core/events/EventDispatcher';

const callWebHookMock = jest.fn();
jest.mock('../../util/functions', () => ({
  callWebHook: (...args: any[]) => callWebHookMock(...args),
}));

function fakeReq() {
  return {
    io: { emit: jest.fn() },
    logger: { error: jest.fn() },
  } as any;
}

describe('EventDispatcher', function () {
  beforeEach(() => callWebHookMock.mockReset());

  it('emits to socket and webhook for "ack" with the mapped names', function () {
    const req = fakeReq();
    const client = { session: 's1' };
    new EventDispatcher(client, req).dispatch('ack', { id: 'a' });

    expect(req.io.emit).toHaveBeenCalledWith('onack', { id: 'a' });
    expect(callWebHookMock).toHaveBeenCalledWith(client, req, 'onack', {
      id: 'a',
    });
  });

  it('sends webhook only (no socket) for "message" -> onmessage', function () {
    const req = fakeReq();
    new EventDispatcher({ session: 's1' }, req).dispatch('message', {
      body: 'x',
    });

    expect(req.io.emit).not.toHaveBeenCalled();
    expect(callWebHookMock).toHaveBeenCalledWith(
      expect.anything(),
      req,
      'onmessage',
      { body: 'x' }
    );
  });

  it('emits socket only (no webhook) for "any-message" -> received-message', function () {
    const req = fakeReq();
    new EventDispatcher({ session: 's1' }, req).dispatch('any-message', {
      body: 'x',
    });

    expect(req.io.emit).toHaveBeenCalledWith('received-message', {
      body: 'x',
    });
    expect(callWebHookMock).not.toHaveBeenCalled();
  });

  it('does nothing for a socket+webhook-less event ("state-change")', function () {
    const req = fakeReq();
    new EventDispatcher({ session: 's1' }, req).dispatch('state-change', {});
    expect(req.io.emit).not.toHaveBeenCalled();
    expect(callWebHookMock).not.toHaveBeenCalled();
  });
});
