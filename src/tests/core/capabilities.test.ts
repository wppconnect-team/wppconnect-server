import {
  buildCapabilities,
  CAPABILITIES,
  NotSupportedError,
  SessionNotReadyError,
} from '../../core/provider/capabilities';
import { ProviderAdapter } from '../../core/provider/ProviderAdapter';
import {
  requireCapability,
  supportsCapability,
} from '../../core/provider/requireCapability';

describe('capabilities', function () {
  it('defaults every capability to false', function () {
    const caps = buildCapabilities();
    for (const cap of CAPABILITIES) {
      expect(caps[cap]).toBe(false);
    }
  });

  it('defaults every capability to true with { all: true }', function () {
    const caps = buildCapabilities({}, { all: true });
    for (const cap of CAPABILITIES) {
      expect(caps[cap]).toBe(true);
    }
  });

  it('applies overrides over the default', function () {
    const caps = buildCapabilities({ groups: false }, { all: true });
    expect(caps.groups).toBe(false);
    expect(caps['messaging.text']).toBe(true);
  });

  it('returns a frozen map', function () {
    const caps = buildCapabilities();
    expect(Object.isFrozen(caps)).toBe(true);
  });
});

function fakeProvider(supported: boolean): ProviderAdapter {
  return {
    id: 'baileys',
    capabilities: buildCapabilities({ groups: supported }),
    session: {} as any,
    messaging: {} as any,
    on: () => undefined,
    health: async () => ({ connected: false, state: 'CLOSED' }),
    raw: () => undefined,
  };
}

describe('requireCapability', function () {
  it('does not throw when the capability is supported', function () {
    expect(() => requireCapability(fakeProvider(true), 'groups')).not.toThrow();
    expect(supportsCapability(fakeProvider(true), 'groups')).toBe(true);
  });

  it('throws NotSupportedError (501) when unsupported', function () {
    try {
      requireCapability(fakeProvider(false), 'groups');
      fail('expected NotSupportedError');
    } catch (e) {
      expect(e).toBeInstanceOf(NotSupportedError);
      expect((e as NotSupportedError).httpStatus).toBe(501);
      expect((e as NotSupportedError).capability).toBe('groups');
    }
  });

  it('throws NotSupportedError when provider is undefined', function () {
    expect(() => requireCapability(undefined, 'groups')).toThrow(
      NotSupportedError
    );
    expect(supportsCapability(undefined, 'groups')).toBe(false);
  });
});

describe('SessionNotReadyError', function () {
  it('carries a 404 status and the session name', function () {
    const err = new SessionNotReadyError('alice');
    expect(err.httpStatus).toBe(404);
    expect(err.session).toBe('alice');
  });
});
