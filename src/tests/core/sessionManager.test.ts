import { SessionManager } from '../../core/session/SessionManager';

describe('SessionManager', function () {
  it('returns undefined for an unknown session', function () {
    const manager = new SessionManager();
    expect(manager.get('nope')).toBeUndefined();
    expect(manager.has('nope')).toBe(false);
  });

  it('creates a handle on getOrCreate and returns the same one afterwards', function () {
    const manager = new SessionManager();
    const created = manager.getOrCreate('alice', 'wppconnect');

    expect(created.name).toBe('alice');
    expect(created.providerId).toBe('wppconnect');
    expect(created.status).toBe('INITIALIZING');
    expect(manager.has('alice')).toBe(true);

    const again = manager.getOrCreate('alice');
    expect(again).toBe(created);
  });

  it('keeps the original provider when getOrCreate is called again', function () {
    const manager = new SessionManager();
    manager.getOrCreate('bob', 'wppconnect');
    const again = manager.getOrCreate('bob', 'baileys');
    expect(again.providerId).toBe('wppconnect');
  });

  it('lists and names every live session', function () {
    const manager = new SessionManager();
    manager.getOrCreate('a');
    manager.getOrCreate('b');
    expect(manager.names().sort()).toStrictEqual(['a', 'b']);
    expect(
      manager
        .list()
        .map((h) => h.name)
        .sort()
    ).toStrictEqual(['a', 'b']);
  });

  it('deletes a session', function () {
    const manager = new SessionManager();
    manager.getOrCreate('a');
    manager.delete('a');
    expect(manager.has('a')).toBe(false);
    expect(manager.get('a')).toBeUndefined();
  });
});
