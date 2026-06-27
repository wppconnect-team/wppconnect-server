import { Whatsapp } from '@wppconnect-team/wppconnect';

import { WppConnectAdapter } from '../../core/provider/wppconnect/WppConnectAdapter';

function fakeClient() {
  return {
    status: 'CONNECTED',
    sendText: jest.fn().mockResolvedValue({ id: 'msg-1' }),
    sendSeen: jest.fn().mockResolvedValue(true),
    isConnected: jest.fn().mockResolvedValue(true),
    close: jest.fn().mockResolvedValue(undefined),
  };
}

describe('WppConnectAdapter', function () {
  it('declares wppconnect id and full capabilities', function () {
    const adapter = new WppConnectAdapter(fakeClient() as unknown as Whatsapp);
    expect(adapter.id).toBe('wppconnect');
    expect(adapter.capabilities['messaging.text']).toBe(true);
    expect(adapter.capabilities.groups).toBe(true);
  });

  it('raw() returns the underlying client so req.client keeps working', function () {
    const client = fakeClient();
    const adapter = new WppConnectAdapter(client as unknown as Whatsapp);
    expect(adapter.raw()).toBe(client);
  });

  it('delegates messaging.sendText to the underlying client', async function () {
    const client = fakeClient();
    const adapter = new WppConnectAdapter(client as unknown as Whatsapp);

    const result = await adapter.messaging.sendText('5521999@c.us', 'hi', {});
    expect(client.sendText).toHaveBeenCalledWith('5521999@c.us', 'hi', {});
    expect(result).toStrictEqual({ id: 'msg-1' });
  });

  it('maps markSeen to sendSeen', async function () {
    const client = fakeClient();
    const adapter = new WppConnectAdapter(client as unknown as Whatsapp);
    await adapter.messaging.markSeen('5521999@c.us');
    expect(client.sendSeen).toHaveBeenCalledWith('5521999@c.us');
  });

  it('reports health from the client', async function () {
    const client = fakeClient();
    const adapter = new WppConnectAdapter(client as unknown as Whatsapp);
    const health = await adapter.health();
    expect(health).toStrictEqual({ connected: true, state: 'CONNECTED' });
  });

  it('re-emits normalized events on its bus', function () {
    const adapter = new WppConnectAdapter(fakeClient() as unknown as Whatsapp);
    const handler = jest.fn();
    adapter.on('message', handler);
    adapter.emit('message', { body: 'hello' });
    expect(handler).toHaveBeenCalledWith({ body: 'hello' });
  });
});
