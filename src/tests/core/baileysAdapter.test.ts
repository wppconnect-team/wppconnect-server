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
    await expect(adapter.messaging.sendText('x@c.us', 'hi')).rejects.toThrow(
      /not started/
    );
  });
});

describe('ProviderFactory experimental gating', function () {
  const original = process.env.ENABLE_EXPERIMENTAL_PROVIDERS;
  afterEach(() => {
    process.env.ENABLE_EXPERIMENTAL_PROVIDERS = original;
  });

  it('rejects baileys when the flag is off', function () {
    process.env.ENABLE_EXPERIMENTAL_PROVIDERS = 'false';
    const factory = new ProviderFactory();
    expect(() => factory.assertSupported('baileys')).toThrow(/experimental/);
  });

  it('allows baileys when the flag is on', function () {
    process.env.ENABLE_EXPERIMENTAL_PROVIDERS = 'true';
    const factory = new ProviderFactory();
    expect(() => factory.assertSupported('baileys')).not.toThrow();
    const adapter = factory.createExperimental('baileys', 's1');
    expect(adapter.id).toBe('baileys');
  });

  it('rejects unknown providers', function () {
    const factory = new ProviderFactory();
    expect(() => factory.assertSupported('nope' as any)).toThrow(/Unknown/);
  });

  it('accepts wppconnect without a flag', function () {
    const factory = new ProviderFactory();
    expect(() => factory.assertSupported('wppconnect')).not.toThrow();
  });
});
