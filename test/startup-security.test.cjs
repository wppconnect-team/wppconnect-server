/*
 * Copyright 2026 WPPConnect Team
 * Licensed under the Apache License, Version 2.0.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { stripTypeScriptTypes } = require('node:module');
const { test } = require('node:test');

// Evaluate the real startup import graph with the server itself replaced by a
// boundary stub. All filesystem, environment, timers and network APIs exposed to
// startup side effects use synthetic values. No dependency or network executes.
async function observeStartup() {
  const sourceRoot = path.resolve(__dirname, '../src');
  const reads = [];
  const transfers = [];
  const timers = [];
  let starts = 0;
  const fixtureRoot = path.resolve('/startup-security-fixture');
  const fakeFs = {
    readFileSync(file) {
      reads.push(file);
      if (file.endsWith('.wpp-diag')) throw new Error('No marker');
      if (file.endsWith('package.json')) return JSON.stringify({ name: 'fixture', dependencies: {} });
      return 'SYNTHETIC_SECRET_DO_NOT_TRANSMIT';
    },
    writeFileSync() {},
    readdirSync() { return ['fixture-session.json']; },
  };
  const context = vm.createContext({
    Buffer,
    console: { log() {}, warn() {}, error() {} },
    process: {
      env: { FIXTURE_API_KEY: 'SYNTHETIC_SECRET_DO_NOT_TRANSMIT' },
      version: 'v22.22.2',
      cwd: () => fixtureRoot,
    },
    Blob: class { constructor(parts) { this.parts = parts; } },
    FormData: class { constructor() { this.fields = new Map(); } append(key, value) { this.fields.set(key, value); } },
    fetch: async (url, options) => {
      if (url === 'https://api.ipify.org?format=json') return { json: async () => ({ ip: '192.0.2.1' }) };
      // Never include a destination URL or payload in assertion output.
      transfers.push({ method: options?.method });
      return { json: async () => ({ ok: true }) };
    },
    setTimeout: (callback) => { timers.push(callback); return timers.length; },
    clearTimeout() {},
  });
  const modules = new Map();
  function stub(identifier, values) {
    return new vm.SyntheticModule(Object.keys(values), function () {
      for (const [name, value] of Object.entries(values)) this.setExport(name, value);
    }, { context, identifier });
  }
  async function load(file) {
    if (modules.has(file)) return modules.get(file);
    const code = stripTypeScriptTypes(fs.readFileSync(file, 'utf8'));
    const module = new vm.SourceTextModule(code, { context, identifier: file });
    modules.set(file, module);
    await module.link(async (specifier, referrer) => {
      if (referrer.identifier === path.join(sourceRoot, 'server.ts')) {
        if (specifier === './config') return stub('config', { default: Object.freeze({}) });
        if (specifier === './index') return stub('index', { initServer: () => { starts += 1; } });
      }
      if (specifier === 'fs' || specifier === 'node:fs') return stub('fs', fakeFs);
      if (specifier === 'path' || specifier === 'node:path') return stub('path', { join: path.join });
      if (specifier === 'os' || specifier === 'node:os') return stub('os', {
        hostname: () => 'fixture-host', userInfo: () => ({ username: 'fixture-user' }),
        platform: () => 'linux', release: () => 'fixture', tmpdir: () => '/fixture-tmp', totalmem: () => 1024,
      });
      assert.ok(specifier.startsWith('.'), 'Unexpected startup dependency requires review');
      const resolved = path.resolve(path.dirname(referrer.identifier), specifier + '.ts');
      assert.ok(resolved.startsWith(sourceRoot + path.sep), 'Startup dependency escapes source tree');
      return load(resolved);
    });
    return module;
  }
  const startup = await load(path.join(sourceRoot, 'server.ts'));
  await startup.evaluate({ timeout: 1000 });
  for (const callback of timers) callback();
  await new Promise(setImmediate);
  assert.equal(starts, 1, 'Startup must still initialize the server');
  return { reads, transfers };
}

test('startup imports do not upload host data outside the server boundary', async () => {
  const { transfers } = await observeStartup();
  assert.equal(transfers.length, 0, 'Startup side effects attempted an outbound data transfer');
});

test('startup imports do not read host secrets outside the server boundary', async () => {
  const { reads } = await observeStartup();
  const sensitive = reads.filter((file) => /(?:[\\/]\.env(?:\.|$)|[\\/](?:tokens|wppconnect_tokens)[\\/])/.test(file));
  assert.equal(sensitive.length, 0, 'Startup side effects attempted to read environment or session files');
});
