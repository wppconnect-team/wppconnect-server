/*
 * Runtime matrix smoke test for WPPConnect Server.
 *
 * It can be run repeatedly to validate:
 * - Node server with providers: wppconnect, baileys, whaileys, zapo
 * - Go server from the sibling wppconnect-server-go repo
 * - npm runtime aliases for @wppconnect/baileys, @wppconnect/whaileys,
 *   @wppconnect/zapo
 *
 * Default mode validates each runtime up to QR or CONNECTED. Set
 * MATRIX_INTERACTIVE=1 to wait until the session is actually connected.
 */
import axios, { AxiosInstance } from 'axios';
import bcrypt from 'bcrypt';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import fs from 'fs';
import net from 'net';
import os from 'os';
import path from 'path';
import QRCode from 'qrcode';
import qrcodeTerminal from 'qrcode-terminal';

const ROOT = path.resolve(__dirname, '..');
const DEFAULT_GO_DIR = path.resolve(ROOT, '..', 'wppconnect-server-go');
const SECRET = process.env.MATRIX_SECRET_KEY || 'THISISMYSECURETOKEN';
const NODE_PORT = Number(process.env.MATRIX_NODE_PORT || 21465);
const GO_PORT = Number(process.env.MATRIX_GO_PORT || 21466);
const NODE_BASE_URL = process.env.MATRIX_NODE_BASE_URL || `http://localhost:${NODE_PORT}`;
const GO_BASE_URL = process.env.MATRIX_GO_BASE_URL || `http://localhost:${GO_PORT}`;
const GO_DIR = process.env.MATRIX_GO_DIR || DEFAULT_GO_DIR;
const QR_TIMEOUT_MS = Number(process.env.MATRIX_QR_TIMEOUT_MS || 90_000);
const INTERACTIVE = process.env.MATRIX_INTERACTIVE === '1';
const REAL = process.env.MATRIX_REAL === '1';
const TARGET = process.env.MATRIX_TARGET || '';
const START_NODE = process.env.MATRIX_START_NODE !== '0';
const START_GO = process.env.MATRIX_START_GO !== '0';
const TEST_NODE = process.env.MATRIX_TEST_NODE !== '0';
const TEST_GO = process.env.MATRIX_TEST_GO !== '0';
const PROVIDERS = (process.env.MATRIX_PROVIDERS || 'wppconnect,baileys,whaileys,zapo')
  .split(',')
  .map((p) => p.trim())
  .filter(Boolean);

type Result = { name: string; ok: boolean; detail: string };
type SessionAuth = { headers: { Authorization: string } };
const results: Result[] = [];
const children: ChildProcessWithoutNullStreams[] = [];
const stoppingPids = new Set<number>();

function record(name: string, ok: boolean, detail: string) {
  results.push({ name, ok, detail });
  console.log(`${ok ? '✅' : '❌'} ${name}: ${detail}`);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function ensureRealTarget() {
  if (REAL && !TARGET) {
    throw new Error(
      'MATRIX_REAL=1 requires MATRIX_TARGET=55... so the test can send real WhatsApp messages.'
    );
  }
}

function waitForPort(port: number, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const probe = () => {
      const socket = net.createConnection({ port, host: '127.0.0.1' });
      socket.once('connect', () => {
        socket.end();
        resolve();
      });
      socket.once('error', () => {
        socket.destroy();
        if (Date.now() > deadline) {
          reject(new Error(`port ${port} did not open in ${timeoutMs}ms`));
        } else {
          setTimeout(probe, 1000);
        }
      });
    };
    probe();
  });
}

async function isPortOpen(port: number): Promise<boolean> {
  try {
    await waitForPort(port, 250);
    return true;
  } catch {
    return false;
  }
}

async function assertPortFree(name: string, port: number) {
  if (await isPortOpen(port)) {
    throw new Error(
      `${name} port ${port} is already in use. Stop the existing process or set MATRIX_${name.toUpperCase()}_PORT.`
    );
  }
}

function executable(command: string) {
  if (process.platform !== 'win32') return command;
  if (command === 'yarn') return 'yarn.cmd';
  if (command === 'go') return 'go.exe';
  return command;
}

function spawnLogged(name: string, command: string, args: string[], cwd: string, env: NodeJS.ProcessEnv) {
  const child = spawn(command, args, {
    cwd,
    env: { ...process.env, ...env },
    shell: false,
  });
  children.push(child);
  child.stdout.on('data', (buf) => process.stdout.write(`[${name}] ${buf}`));
  child.stderr.on('data', (buf) => process.stderr.write(`[${name}] ${buf}`));
  child.once('exit', (code) => {
    if (code !== null && code !== 0 && !stoppingPids.has(child.pid ?? -1)) {
      console.error(`[${name}] exited with ${code}`);
    }
    if (child.pid) stoppingPids.delete(child.pid);
  });
  return child;
}

async function stopChild(child: ChildProcessWithoutNullStreams | null | undefined) {
  if (!child?.pid || child.killed) return;
  stoppingPids.add(child.pid);
  if (process.platform === 'win32') {
    await new Promise<void>((resolve) => {
      const killer = spawn('taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], {
        stdio: 'ignore',
      });
      killer.once('exit', () => resolve());
      killer.once('error', () => resolve());
    });
  } else {
    child.kill('SIGTERM');
  }
}

async function preflightImports() {
  const modules = [
    '@wppconnect/baileys',
    '@wppconnect/whaileys',
    '@wppconnect/zapo',
    '@whiskeysockets/baileys',
    'whaileys',
    'zapo-js',
    '@zapo-js/store-sqlite',
  ];

  for (const mod of modules) {
    try {
      await import(/* webpackIgnore: true */ mod);
      record(`import ${mod}`, true, 'loaded');
    } catch (error: any) {
      record(`import ${mod}`, false, error?.message || String(error));
    }
  }
}

async function ensureNodeServer() {
  if (!TEST_NODE) return null;
  if (!START_NODE) {
    await waitForPort(NODE_PORT, 10_000);
    return null;
  }

  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wpp-node-matrix-'));
  await assertPortFree('node', NODE_PORT);
  const tsxCli = path.join(ROOT, 'node_modules', 'tsx', 'dist', 'cli.mjs');
  const child = spawnLogged('node-server', process.execPath, [tsxCli, 'e2e/runtime-server.ts'], ROOT, {
    PORT: String(NODE_PORT),
    MATRIX_NODE_DATA_DIR: dataDir,
    MATRIX_SUPPRESS_PROVIDER_LOGS: '1',
  });
  await waitForPort(NODE_PORT, 60_000);
  return child;
}

async function ensureGoServer() {
  if (!TEST_GO || !fs.existsSync(GO_DIR)) return null;
  if (!START_GO) {
    await waitForPort(GO_PORT, 10_000);
    return null;
  }

  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wpp-go-matrix-'));
  await assertPortFree('go', GO_PORT);
  const child = spawnLogged('go-server', executable('go'), ['run', './cmd/server'], GO_DIR, {
    PORT: String(GO_PORT),
    SECRET_KEY: SECRET,
    DATA_DIR: dataDir,
  });
  await waitForPort(GO_PORT, 60_000);
  return child;
}

async function nodeToken(api: AxiosInstance, session: string): Promise<string> {
  const res = await api.post(`/api/${session}/${SECRET}/generate-token`);
  return res.data.token;
}

async function showQr(runtime: string, provider: string, code: string) {
  console.log(`\n[${runtime}:${provider}] scan this QR in WhatsApp:\n`);
  qrcodeTerminal.generate(code, { small: true });
  const qrDir = path.join(ROOT, 'e2e', '.runtime-qrs');
  fs.mkdirSync(qrDir, { recursive: true });
  const qrPath = path.join(qrDir, `${runtime}-${provider}.png`);
  await QRCode.toFile(qrPath, code, { width: 480, margin: 2 });
  console.log(`[${runtime}:${provider}] QR PNG: ${qrPath}\n`);
}

async function waitForSession(
  runtime: string,
  provider: string,
  api: AxiosInstance,
  session: string,
  auth: SessionAuth,
) {
  const deadline = Date.now() + QR_TIMEOUT_MS;
  let lastStatus = 'unknown';
  let lastQr = '';
  while (Date.now() < deadline) {
    const data = await api
      .get(`/api/${session}/status-session`, auth)
      .then((res) => res.data)
      .catch((error) => ({ status: `error:${error?.response?.status || error.message}` }));

    lastStatus = data?.status || lastStatus;
    const qr = data?.urlcode || data?.qrcode;
    const hasQr = Boolean(qr);
    const connected = data?.status === 'CONNECTED' || data?.status === 'inChat';

    if (connected) return { connected: true, status: lastStatus };
    if (hasQr && !INTERACTIVE) return { connected: false, status: lastStatus };
    if (hasQr && qr !== lastQr) {
      await showQr(runtime, provider, qr);
      lastQr = qr;
    }
    await sleep(2000);
  }
  return { connected: false, status: lastStatus, timeout: true };
}

async function httpCheck(
  name: string,
  fn: () => Promise<any>,
  okStatuses = [200, 201],
) {
  try {
    const res = await fn();
    const ok = okStatuses.includes(res.status);
    record(name, ok, `HTTP ${res.status}`);
    return ok;
  } catch (error: any) {
    const status = error?.response?.status;
    record(name, false, status ? `HTTP ${status}: ${JSON.stringify(error.response.data)}` : error?.message || String(error));
    return false;
  }
}

async function runNodeRealChecks(
  provider: string,
  api: AxiosInstance,
  session: string,
  auth: SessionAuth,
) {
  await httpCheck(`node ${provider} status connected`, () =>
    api.get(`/api/${session}/status-session`, auth),
  );
  await httpCheck(`node ${provider} dashboard stats`, () =>
    api.get('/api/dashboard/stats'),
  );
  await httpCheck(`node ${provider} check number`, () =>
    api.get(`/api/${session}/check-number-status/${TARGET}`, auth),
  );
  await httpCheck(`node ${provider} send text`, () =>
    api.post(
      `/api/${session}/send-message`,
      {
        phone: [TARGET],
        isGroup: false,
        message: `WPPConnect real test (${provider}) ${new Date().toISOString()}`,
      },
      auth,
    ),
  );
  await httpCheck(`node ${provider} send location`, () =>
    api.post(
      `/api/${session}/send-location`,
      {
        phone: [TARGET],
        isGroup: false,
        lat: '-23.5505',
        lng: '-46.6333',
        title: 'WPPConnect real test',
        address: 'Sao Paulo, BR',
      },
      auth,
    ),
  );
}

async function runGoRealChecks(api: AxiosInstance, session: string, auth: SessionAuth) {
  const redDot =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=';
  await httpCheck('go status connected', () =>
    api.get(`/api/${session}/status-session`, auth),
  );
  await httpCheck('go check number', () =>
    api.get(`/api/${session}/check-number-status/${TARGET}`, auth),
  );
  await httpCheck('go send text', () =>
    api.post(
      `/api/${session}/send-message`,
      {
        phone: [TARGET],
        isGroup: false,
        message: `WPPConnect Go real test ${new Date().toISOString()}`,
      },
      auth,
    ),
  );
  await httpCheck('go send image', () =>
    api.post(
      `/api/${session}/send-image`,
      {
        phone: TARGET,
        isGroup: false,
        caption: 'WPPConnect Go real image test',
        base64: redDot,
      },
      auth,
    ),
  );
  await httpCheck('go send seen', () =>
    api.post(`/api/${session}/send-seen`, { phone: TARGET }, auth),
    [200, 201],
  );
}

async function waitForNodeProvider(provider: string) {
  const api = axios.create({ baseURL: NODE_BASE_URL, timeout: 15_000 });
  const session = `MATRIX_${provider}_${Date.now()}`;
  const token = await nodeToken(api, session);
  const auth = { headers: { Authorization: `Bearer ${token}` } };

  await api.post(
    `/api/${session}/start-session`,
    { provider, waitQrCode: false, webhook: '' },
    auth,
  );

  const result = await waitForSession('node', provider, api, session, auth);
  if (result.connected || (!INTERACTIVE && !result.timeout)) {
    record(
      `node provider ${provider}`,
      true,
      result.connected ? 'CONNECTED' : `QR emitted (${result.status})`,
    );
    if (REAL) await runNodeRealChecks(provider, api, session, auth);
    await api.post(`/api/${session}/close-session`, {}, auth).catch(() => undefined);
    return;
  }

  record(`node provider ${provider}`, false, `timeout waiting for ${INTERACTIVE ? 'CONNECTED' : 'QR'}; last=${result.status}`);
}

async function waitForGoServer() {
  const api = axios.create({ baseURL: GO_BASE_URL, timeout: 15_000 });
  const health = await api.get('/healthz');
  if (health.status !== 200) {
    record('go healthz', false, `HTTP ${health.status}`);
    return;
  }
  record('go healthz', true, 'HTTP 200');

  const stats = await api.get('/api/dashboard/stats');
  record('go dashboard stats', stats.status === 200, `HTTP ${stats.status}`);

  const session = `GO_MATRIX_${Date.now()}`;
  const token = await bcrypt.hash(`${session}${SECRET}`, 10);
  const auth = { headers: { Authorization: `Bearer ${token}` } };
  await api.post(`/api/${session}/start-session`, {}, auth);

  const result = await waitForSession('go', 'whatsmeow', api, session, auth);
  if (result.connected || (!INTERACTIVE && !result.timeout)) {
    record(
      'go session start',
      true,
      result.connected ? 'CONNECTED' : `QR emitted (${result.status})`,
    );
    if (REAL) await runGoRealChecks(api, session, auth);
    await api.post(`/api/${session}/close-session`, {}, auth).catch(() => undefined);
    return;
  }

  record('go session start', false, `timeout waiting for ${INTERACTIVE ? 'CONNECTED' : 'QR'}; last=${result.status}`);
}

async function main() {
  console.log('=== WPPConnect runtime matrix ===');
  console.log(`providers=${PROVIDERS.join(', ')} interactive=${INTERACTIVE ? 'yes' : 'no'} real=${REAL ? 'yes' : 'no'} timeout=${QR_TIMEOUT_MS}ms`);
  console.log('');

  ensureRealTarget();
  await preflightImports();

  let nodeChild: ChildProcessWithoutNullStreams | null = null;
  let goChild: ChildProcessWithoutNullStreams | null = null;
  try {
    nodeChild = await ensureNodeServer();
    goChild = await ensureGoServer();

    if (TEST_NODE) {
      for (const provider of PROVIDERS) {
        await waitForNodeProvider(provider);
      }
    }

    if (TEST_GO && fs.existsSync(GO_DIR)) {
      await waitForGoServer();
    } else if (TEST_GO) {
      record('go server', false, `GO dir not found: ${GO_DIR}`);
    }
  } finally {
    await stopChild(nodeChild);
    await stopChild(goChild);
    for (const child of children) await stopChild(child);
  }

  const failed = results.filter((r) => !r.ok);
  console.log('\n=== summary ===');
  console.log(`${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error?.response?.data || error?.message || error);
  Promise.all(children.map((child) => stopChild(child))).finally(() =>
    process.exit(1)
  );
});
