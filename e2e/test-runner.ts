/*
 * Copyright 2021 WPPConnect Team
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

/**
 * End-to-end smoke test runner for the wppconnect-server provider layer.
 *
 * What it does, in order:
 *   1. Starts a local webhook receiver (logs every event the server posts).
 *   2. Generates an auth token and starts a session.
 *   3. Renders the QR code in the terminal — you scan it with WhatsApp.
 *   4. Waits for the session to connect.
 *   5. Exercises every route group against the live session and prints a
 *      pass/fail report per endpoint, plus a summary of webhooks received.
 *
 * Usage:
 *   1. In one terminal:  yarn dev            (start the server on :21465)
 *   2. In another:       yarn e2e            (run this script)
 *
 * Environment variables (all optional, sensible defaults):
 *   E2E_BASE_URL   server base url           (default http://localhost:21465)
 *   E2E_SECRET_KEY server secretKey          (default THISISMYSECURETOKEN)
 *   E2E_SESSION    session name              (default E2E_TEST)
 *   E2E_WEBHOOK_PORT local webhook port      (default 8999)
 *   E2E_TARGET     phone to send tests to    (default = own number, set it!)
 *   E2E_PROVIDER   provider for the session  (default wppconnect)
 *
 * This is a manual/interactive script (it waits for a QR scan), so it is NOT
 * part of the Jest suite.
 */

import axios, { AxiosInstance } from 'axios';
import express from 'express';
import path from 'path';
import QRCode from 'qrcode';
import qrcode from 'qrcode-terminal';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:21465';
const SECRET_KEY = process.env.E2E_SECRET_KEY || 'THISISMYSECURETOKEN';
const SESSION = process.env.E2E_SESSION || 'E2E_TEST';
const WEBHOOK_PORT = Number(process.env.E2E_WEBHOOK_PORT || 8999);
const PROVIDER = process.env.E2E_PROVIDER || 'wppconnect';
// Phone the test messages are sent to. Defaults to a placeholder — override it
// with your own number so the send tests actually deliver.
const TARGET = process.env.E2E_TARGET || '';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* ----------------------------- webhook receiver ---------------------------- */

const webhookEvents: Record<string, number> = {};

function startWebhookReceiver(): Promise<string> {
  return new Promise((resolve) => {
    const app = express();
    app.use(express.json({ limit: '50mb' }));
    app.post('/webhook', (req, res) => {
      const event = req.body?.event || 'unknown';
      webhookEvents[event] = (webhookEvents[event] || 0) + 1;
      console.log(
        `  📩 webhook: ${event}  (total ${event}=${webhookEvents[event]})`
      );
      res.sendStatus(200);
    });
    app.listen(WEBHOOK_PORT, () => {
      const url = `http://host.docker.internal:${WEBHOOK_PORT}/webhook`;
      const local = `http://localhost:${WEBHOOK_PORT}/webhook`;
      console.log(`🔌 Webhook receiver on ${local}`);
      console.log(`   (use ${url} if the server runs in Docker)`);
      resolve(process.env.E2E_WEBHOOK_URL || local);
    });
  });
}

/* ------------------------------ test harness ------------------------------- */

type Result = { name: string; ok: boolean; status?: number; error?: string };
const results: Result[] = [];

async function step(
  name: string,
  fn: () => Promise<any>,
  opts: { allowNotSupported?: boolean } = {}
): Promise<void> {
  try {
    const res = await fn();
    const status = res?.status;
    results.push({ name, ok: true, status });
    console.log(`  ✅ ${name} (${status})`);
  } catch (e: any) {
    const status = e?.response?.status;
    // A 501 from a feature-gated route is an expected, correct outcome for
    // providers that don't support it — count it as a pass when allowed.
    if (opts.allowNotSupported && status === 501) {
      results.push({ name: `${name} (501 not supported)`, ok: true, status });
      console.log(`  ⚠️  ${name}: 501 not supported (expected)`);
      return;
    }
    results.push({
      name,
      ok: false,
      status,
      error: e?.response?.data?.message || e?.message,
    });
    console.log(`  ❌ ${name} (${status ?? 'ERR'}): ${e?.message}`);
  }
}

/* --------------------------------- main ------------------------------------ */

async function main() {
  console.log('=== wppconnect-server E2E runner ===\n');
  const webhookUrl = await startWebhookReceiver();

  const api: AxiosInstance = axios.create({ baseURL: BASE_URL });

  // 1. token
  console.log('\n🔑 Generating token...');
  const tokenRes = await api.post(
    `/api/${SESSION}/${SECRET_KEY}/generate-token`
  );
  const token: string = tokenRes.data.token;
  const auth = { headers: { Authorization: `Bearer ${token}` } };
  console.log('   token ok');

  // 2. wire QR over socket-less polling: start session with webhook + provider
  console.log('\n📲 Starting session...');
  await api.post(
    `/api/${SESSION}/start-session`,
    { webhook: webhookUrl, waitQrCode: true, provider: PROVIDER },
    auth
  );

  // 3. poll status, render QR when present (re-render when it rotates)
  console.log('\n⏳ Waiting for QR / connection...');
  let lastQr = '';
  let connected = false;
  // ~15 min window so there is plenty of time to read the QR and scan.
  for (let i = 0; i < 450 && !connected; i++) {
    const status = await api
      .get(`/api/${SESSION}/status-session`, auth)
      .then((r) => r.data)
      .catch(() => ({}));

    if (status?.status === 'CONNECTED' || status?.status === 'inChat') {
      connected = true;
      break;
    }
    const qr = status?.urlcode || status?.qrcode;
    if (qr && qr !== lastQr) {
      console.log('\n🔳 Scan this QR with WhatsApp (rotates ~every 20s):\n');
      qrcode.generate(qr, { small: true });
      // Also write a PNG — far more reliable to scan than terminal ASCII.
      const pngPath = path.resolve(`qr-${PROVIDER}.png`);
      try {
        await QRCode.toFile(pngPath, qr, { width: 400, margin: 2 });
        console.log(`\n🖼️  QR PNG saved to: ${pngPath}`);
      } catch {
        /* ignore PNG write errors */
      }
      lastQr = qr;
    }
    await sleep(2000);
  }

  if (!connected) {
    console.log('\n❌ Session did not connect in time. Aborting route tests.');
    printSummary();
    process.exit(1);
  }
  console.log('\n✅ Session connected!\n');

  const target = TARGET || (await getOwnNumber(api, auth));
  console.log(`📞 Test target: ${target}\n`);

  /* --------------------------- exercise routes --------------------------- */

  console.log('── Session / Device ──');
  await step('check-connection-session', () =>
    api.get(`/api/${SESSION}/check-connection-session`, auth)
  );
  await step('get-battery-level', () =>
    api.get(`/api/${SESSION}/get-battery-level`, auth)
  );
  await step('host-device', () => api.get(`/api/${SESSION}/host-device`, auth));
  await step('get-phone-number', () =>
    api.get(`/api/${SESSION}/get-phone-number`, auth)
  );

  console.log('\n── Messaging ──');
  await step('send-message', () =>
    api.post(
      `/api/${SESSION}/send-message`,
      { phone: [target], isGroup: false, message: 'E2E: send-message ✅' },
      auth
    )
  );
  await step('send-location', () =>
    api.post(
      `/api/${SESSION}/send-location`,
      { phone: target, lat: '-23.5505', lng: '-46.6333', title: 'SP' },
      auth
    )
  );
  await step('send-link-preview', () =>
    api.post(
      `/api/${SESSION}/send-link-preview`,
      { phone: target, url: 'https://wppconnect.io', caption: 'E2E' },
      auth
    )
  );

  console.log('\n── Contacts ──');
  await step('all-contacts', () =>
    api.get(`/api/${SESSION}/all-contacts`, auth)
  );
  await step('check-number-status', () =>
    api.get(`/api/${SESSION}/check-number-status/${target}`, auth)
  );
  await step('profile-pic', () =>
    api.get(`/api/${SESSION}/profile-pic/${target}`, auth)
  );

  console.log('\n── Chats ──');
  await step('list-chats', () =>
    api.post(`/api/${SESSION}/list-chats`, { count: 5 }, auth)
  );
  await step('all-chats-with-messages', () =>
    api.get(`/api/${SESSION}/all-chats-with-messages`, auth)
  );

  console.log(
    '\n── Groups ── (501 expected on providers without group support)'
  );
  await step('all-groups', () => api.get(`/api/${SESSION}/all-groups`, auth), {
    allowNotSupported: true,
  });

  console.log('\n── Labels (Business only) ──');
  await step(
    'get-all-labels',
    () => api.get(`/api/${SESSION}/get-all-labels`, auth),
    { allowNotSupported: true }
  );

  console.log('\n── Catalog (Business only — 501 on Baileys) ──');
  await step(
    'get-products',
    () => api.get(`/api/${SESSION}/get-products`, auth),
    { allowNotSupported: true }
  );

  // Give late webhooks (onmessage/onack) a moment to arrive.
  console.log('\n⏳ Waiting 5s for trailing webhooks...');
  await sleep(5000);

  printSummary();
  process.exit(results.every((r) => r.ok) ? 0 : 1);
}

async function getOwnNumber(api: AxiosInstance, auth: any): Promise<string> {
  try {
    const r = await api.get(`/api/${SESSION}/get-phone-number`, auth);
    const wid = r.data?.response || r.data?.id || '';
    return String(wid).split('@')[0] || '0000000000';
  } catch {
    return '0000000000';
  }
}

function printSummary() {
  console.log('\n\n══════════════ SUMMARY ══════════════');
  const passed = results.filter((r) => r.ok).length;
  const failed = results.length - passed;
  for (const r of results) {
    console.log(
      `${r.ok ? '✅' : '❌'} ${r.name}${r.error ? ` — ${r.error}` : ''}`
    );
  }
  console.log('─────────────────────────────────────');
  console.log(`Routes: ${passed} passed, ${failed} failed`);
  console.log('Webhooks received:');
  for (const [event, count] of Object.entries(webhookEvents)) {
    console.log(`  • ${event}: ${count}`);
  }
  if (Object.keys(webhookEvents).length === 0) {
    console.log('  (none — check the webhook URL is reachable by the server)');
  }
  console.log('═════════════════════════════════════\n');
}

main().catch((e) => {
  console.error('Fatal:', e?.response?.data || e?.message || e);
  printSummary();
  process.exit(1);
});
