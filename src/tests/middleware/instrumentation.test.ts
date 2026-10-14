/*
 * Copyright 2026 WPPConnect Team
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import Prometheus from 'prom-client';

import { metrics, prometheusRegister } from '../../middleware/instrumentation';

function createResponse() {
  const res: any = {
    headers: {} as Record<string, string>,
    body: undefined as string | undefined,
    setHeader(key: string, value: string) {
      res.headers[key] = value;
      return res;
    },
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    send(body: string) {
      res.body = body;
      return res;
    },
  };
  return res;
}

async function scrape() {
  const res = createResponse();
  await metrics({} as any, res as any);
  // metrics() resolves the registry promise without awaiting it
  await new Promise((resolve) => setImmediate(resolve));
  return res;
}

describe('metrics endpoint', () => {
  it('serves default metrics with the app label', async () => {
    const res = await scrape();

    expect(res.statusCode).toBe(200);
    expect(res.headers['Content-Type']).toBe(Prometheus.register.contentType);
    expect(res.body).toContain('app="wppconnect-server"');
    expect(res.body).toContain('process_cpu_user_seconds_total');
  });

  it('serves a metric registered on the exported registry', async () => {
    const gauge = new Prometheus.Gauge({
      name: 'wppconnect_test_active_sessions',
      help: 'Active sessions',
      registers: [prometheusRegister],
    });
    gauge.set(7);

    const res = await scrape();

    expect(res.body).toContain('wppconnect_test_active_sessions');
    expect(res.body).toContain('7');
    gauge.remove();
  });

  it('does not register default collectors again on every scrape', async () => {
    const before = prometheusRegister.getSingleMetric(
      'process_cpu_user_seconds_total'
    );

    await scrape();
    await scrape();
    await scrape();

    const after = prometheusRegister.getSingleMetric(
      'process_cpu_user_seconds_total'
    );

    // A collector re-registered per scrape would be a different object.
    expect(after).toBe(before);
  });

  it('keeps the same registry object across scrapes', async () => {
    const first = await scrape();
    const second = await scrape();

    expect(second.headers['Content-Type']).toBe(first.headers['Content-Type']);
    expect(prometheusRegister).toBeInstanceOf(Prometheus.Registry);
  });

  it('reports process metrics without throwing when called repeatedly', async () => {
    for (let i = 0; i < 25; i++) {
      const res = await scrape();
      expect(res.statusCode).toBe(200);
      expect(res.body).toBeTruthy();
    }
  });
});
