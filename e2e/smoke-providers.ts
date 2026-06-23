/*
 * Runtime smoke test for the socket-based providers (baileys, whaileys, zapo).
 *
 * For each provider it builds the adapter, starts the session, and waits for
 * the first normalized event. A `qr` event proves the lib loaded, the socket
 * connected, and the adapter wiring works end-to-end up to the human step
 * (scanning). Anything else (or an error) is reported. No HTTP server / phone
 * needed.
 *
 * Run with: yarn tsx e2e/smoke-providers.ts
 */
import { ProviderId } from '../src/core/provider/ProviderAdapter';
import { providerFactory } from '../src/core/provider/ProviderFactory';

const PROVIDERS: ProviderId[] = ['baileys', 'whaileys', 'zapo'];

async function smoke(id: ProviderId): Promise<string> {
  const adapter = providerFactory.createSocketProvider(id, `SMOKE_${id}`);
  return new Promise<string>((resolve) => {
    let settled = false;
    const done = (msg: string) => {
      if (settled) return;
      settled = true;
      adapter.session.close().catch(() => undefined);
      resolve(msg);
    };

    adapter.on('qr', () =>
      done('QR emitted — lib loaded + socket connected ✅')
    );
    adapter.on('connection-state', (d: any) =>
      done(`connection-state: ${d?.status}`)
    );

    adapter.session
      .start()
      .catch((e: any) => done(`start error: ${e?.message ?? e}`));

    setTimeout(() => done('timeout (no event in 30s)'), 30000);
  });
}

(async () => {
  console.log('=== provider runtime smoke ===\n');
  for (const id of PROVIDERS) {
    process.stdout.write(`• ${id}: `);
    try {
      const result = await smoke(id);
      console.log(result);
    } catch (e: any) {
      console.log(`FAILED: ${e?.message ?? e}`);
    }
  }
  console.log('\n=== done ===');
  process.exit(0);
})();
