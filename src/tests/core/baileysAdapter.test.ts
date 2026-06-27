import { BaileysAdapter } from '../../core/provider/baileys/BaileysAdapter';
import { ProviderFactory } from '../../core/provider/ProviderFactory';

describe('BaileysAdapter', function () {
  it('declares baileys id and partial capabilities', function () {
    const adapter = new BaileysAdapter('s1');
    expect(adapter.id).toBe('baileys');
    expect(adapter.capabilities['messaging.text']).toBe(true);
    expect(adapter.capabilities.groups).toBe(true);
    // WhatsApp-Web-only features are NOT supported -> central handler 501s.
    expect(adapter.capabilities.catalog).toBe(false);
    expect(adapter.capabilities.stories).toBe(false);
    expect(adapter.capabilities.community).toBe(false);
  });

  it('reports a disconnected health before start', async function () {
    const adapter = new BaileysAdapter('s1');
    expect(await adapter.health()).toStrictEqual({
      connected: false,
      state: 'INITIALIZING',
    });
  });

  it('throws when sending before the socket is started', async function () {
    const adapter = new BaileysAdapter('s1');
    await expect(
      adapter.messaging.sendText('5511999@c.us', 'hi')
    ).rejects.toThrow(/not started/);
  });
});

describe('ProviderFactory (no flag — all providers first-class)', function () {
  it('builds baileys by name without any flag', function () {
    const factory = new ProviderFactory();
    expect(() => factory.assertSupported('baileys')).not.toThrow();
    const adapter = factory.createSocketProvider('baileys', 's1');
    expect(adapter.id).toBe('baileys');
  });

  it('recognizes all four providers as known', function () {
    const factory = new ProviderFactory();
    expect(factory.isKnown('wppconnect')).toBe(true);
    expect(factory.isKnown('baileys')).toBe(true);
    expect(factory.isKnown('whaileys')).toBe(true);
    expect(factory.isKnown('zapo')).toBe(true);
  });

  it('flags socket providers vs wppconnect', function () {
    const factory = new ProviderFactory();
    expect(factory.isSocketProvider('baileys')).toBe(true);
    expect(factory.isSocketProvider('wppconnect')).toBe(false);
  });

  it('rejects unknown providers', function () {
    const factory = new ProviderFactory();
    expect(() => factory.assertSupported('nope' as any)).toThrow(/Unknown/);
  });

  it('accepts wppconnect', function () {
    const factory = new ProviderFactory();
    expect(() => factory.assertSupported('wppconnect')).not.toThrow();
  });
});
