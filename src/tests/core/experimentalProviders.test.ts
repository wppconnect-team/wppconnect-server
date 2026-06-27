import { ProviderFactory } from '../../core/provider/ProviderFactory';
import { SocketProviderAdapter } from '../../core/provider/socket/SocketProviderAdapter';
import { WhaileysAdapter } from '../../core/provider/whaileys/WhaileysAdapter';
import { ZapoAdapter } from '../../core/provider/zapo/ZapoAdapter';

describe('socket provider adapters', function () {
  it('whaileys declares its id and socket capabilities', function () {
    const a = new WhaileysAdapter('s1');
    expect(a.id).toBe('whaileys');
    expect(a).toBeInstanceOf(SocketProviderAdapter);
    expect(a.capabilities['messaging.text']).toBe(true);
    expect(a.capabilities.groups).toBe(true);
    expect(a.capabilities.catalog).toBe(false);
  });

  it('zapo declares its id and capabilities (own adapter)', function () {
    const a = new ZapoAdapter('s1');
    expect(a.id).toBe('zapo');
    expect(a.capabilities['messaging.text']).toBe(true);
    expect(a.capabilities.stories).toBe(false);
  });

  it('factory builds all three socket providers by name (no flag)', function () {
    const f = new ProviderFactory();
    expect(f.createSocketProvider('baileys', 's').id).toBe('baileys');
    expect(f.createSocketProvider('whaileys', 's').id).toBe('whaileys');
    expect(f.createSocketProvider('zapo', 's').id).toBe('zapo');
  });

  it('factory rejects unknown providers', function () {
    const f = new ProviderFactory();
    expect(() => f.assertSupported('nope' as any)).toThrow(/Unknown/);
  });
});
