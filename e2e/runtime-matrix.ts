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
const START_NODE = process.env.MATRIX_START_NODE !== '0';
const START_GO = process.env.MATRIX_START_GO !== '0';
const TEST_NODE = process.env.MATRIX_TEST_NODE !== '0';
const TEST_GO = process.env.MATRIX_TEST_GO !== '0';
const PROVIDERS = (process.env.MATRIX_PROVIDERS || 'wppconnect,baileys,whaileys,zapo')
  .split(',')
  .map((p) => p.trim())
  .filter(Boolean);

type Result = { name: string; ok: boolean; detail: string };
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

  const deadline = Date.now() + QR_TIMEOUT_MS;
  let lastStatus = 'unknown';
  while (Date.now() < deadline) {
    const data = await api
      .get(`/api/${session}/status-session`, auth)
      .then((res) => res.data)
      .catch((error) => ({ status: `error:${error?.response?.status || error.message}` }));

    lastStatus = data?.status || lastStatus;
    const hasQr = Boolean(data?.urlcode || data?.qrcode);
    const connected = data?.status === 'CONNECTED' || data?.status === 'inChat';

    if (connected || (hasQr && !INTERACTIVE)) {
      record(`node provider ${provider}`, true, connected ? 'CONNECTED' : `QR emitted (${lastStatus})`);
      await api.post(`/api/${session}/close-session`, {}, auth).catch(() => undefined);
      return;
    }
    await sleep(2000);
  }

  record(`node provider ${provider}`, false, `timeout waiting for ${INTERACTIVE ? 'CONNECTED' : 'QR'}; last=${lastStatus}`);
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

  const deadline = Date.now() + QR_TIMEOUT_MS;
  let lastStatus = 'unknown';
  while (Date.now() < deadline) {
    const data = await api
      .get(`/api/${session}/status-session`, auth)
      .then((res) => res.data)
      .catch((error) => ({ status: `error:${error?.response?.status || error.message}` }));

    lastStatus = data?.status || lastStatus;
    const hasQr = Boolean(data?.urlcode || data?.qrcode);
    const connected = data?.status === 'CONNECTED';
    if (connected || (hasQr && !INTERACTIVE)) {
      record('go session start', true, connected ? 'CONNECTED' : `QR emitted (${lastStatus})`);
      await api.post(`/api/${session}/close-session`, {}, auth).catch(() => undefined);
      return;
    }
    await sleep(2000);
  }

  record('go session start', false, `timeout waiting for ${INTERACTIVE ? 'CONNECTED' : 'QR'}; last=${lastStatus}`);
}

async function main() {
  console.log('=== WPPConnect runtime matrix ===');
  console.log(`providers=${PROVIDERS.join(', ')} interactive=${INTERACTIVE ? 'yes' : 'no'} timeout=${QR_TIMEOUT_MS}ms`);
  console.log('');

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
