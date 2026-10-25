import {
  buildCapabilities,
  RouteNotSupportedError,
} from '../../core/provider/capabilities';
import {
  ProviderAdapter,
  ProviderId,
} from '../../core/provider/ProviderAdapter';
import {
  assertProviderRouteSupported,
  PROVIDER_ROUTE_SUPPORT,
} from '../../core/provider/routeSupport';
import { normalizeSocketRecipients } from '../../middleware/statusConnection';

function provider(id: ProviderId): ProviderAdapter {
  return {
    id,
    capabilities: buildCapabilities({}, { all: true }),
    session: {} as any,
    messaging: {} as any,
    on: () => undefined,
    health: async () => ({ connected: false, state: 'CLOSED' }),
    raw: () => undefined,
  };
}

describe('provider route support', function () {
  it('keeps every route available to the default wppconnect provider', function () {
    expect(() =>
      assertProviderRouteSupported(
        provider('wppconnect'),
        'POST',
        '/api/:session/any-future-route'
      )
    ).not.toThrow();
  });

  it('allows explicitly implemented routes', function () {
    expect(() =>
      assertProviderRouteSupported(
        provider('baileys'),
        'POST',
        '/api/:session/send-message'
      )
    ).not.toThrow();
  });

  it('denies unknown and untranslated routes with a typed 501 error', function () {
    expect(() =>
      assertProviderRouteSupported(
        provider('baileys'),
        'GET',
        '/api/:session/blocklist'
      )
    ).toThrow(RouteNotSupportedError);
  });

  it('keeps provider-specific differences explicit', function () {
    expect(
      PROVIDER_ROUTE_SUPPORT.baileys.has('POST /api/:session/send-location')
    ).toBe(true);
    expect(
      PROVIDER_ROUTE_SUPPORT.zapo.has('POST /api/:session/send-location')
    ).toBe(false);
    expect(
      PROVIDER_ROUTE_SUPPORT.zapo.has(
        'GET /api/:session/check-number-status/:phone'
      )
    ).toBe(false);
  });

  it('denies legacy routes whose payload lacks the socket message key', function () {
    for (const id of ['baileys', 'whaileys', 'zapo'] as const) {
      expect(() =>
        assertProviderRouteSupported(
          provider(id),
          'POST',
          '/api/:session/react-message'
        )
      ).toThrow(RouteNotSupportedError);
      expect(() =>
        assertProviderRouteSupported(
          provider(id),
          'POST',
          '/api/:session/send-seen'
        )
      ).toThrow(RouteNotSupportedError);
    }
  });
});

describe('socket recipient normalization', function () {
  it('normalizes a phone string into one recipient', function () {
    const body = { phone: '5511999999999', isGroup: false };
    normalizeSocketRecipients(body);
    expect(body.phone).toEqual(['5511999999999@c.us']);
  });

  it('normalizes arrays without splitting their values', function () {
    const body = { phone: ['5511999999999', '5511888888888'] };
    normalizeSocketRecipients(body);
    expect(body.phone).toEqual(['5511999999999@c.us', '5511888888888@c.us']);
  });

  it('does not reinterpret invalid structured input', function () {
    const phone = { number: '5511999999999' };
    const body = { phone };
    normalizeSocketRecipients(body);
    expect(body.phone).toBe(phone);
  });
});
