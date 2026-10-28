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
// Run with npm run test:packed-security so npm_execpath is the native npm CLI.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const scratch = fs.mkdtempSync(
  path.join(os.tmpdir(), 'wpp-cli-package-security-')
);
const npm = process.env.npm_execpath;
assert(
  npm && /npm-cli\.js$/.test(npm),
  'Run this check using npm run test:packed-security'
);
const env = { ...process.env, PUPPETEER_SKIP_DOWNLOAD: 'true', RUN_SERVER: '' };
function run(args, cwd) {
  const result = spawnSync(process.execPath, args, {
    cwd,
    env,
    encoding: 'utf8',
    timeout: 300000,
    maxBuffer: 16 * 1024 * 1024,
  });
  assert.equal(
    result.status,
    0,
    result.stdout + result.stderr + (result.error?.message || '')
  );
  return result.stdout;
}
try {
  const packed = JSON.parse(
    run(
      [
        npm,
        'pack',
        '--ignore-scripts',
        '--json',
        '--pack-destination',
        scratch,
      ],
      root
    )
  )[0];
  const files = new Set(packed.files.map((file) => file.path));
  for (const file of [
    'dist/security/runtime.js',
    'vendor/deepmerge/index.cjs',
    'vendor/deepmerge/is-mergeable-object.cjs',
    'vendor/deepmerge/LICENSE',
  ]) {
    assert(
      files.has(file),
      `Runtime security file missing from packed CLI: ${file}`
    );
  }
  const artifact = path.join(scratch, packed.filename);
  const helper = path.join(__dirname, 'helpers', 'assert-packed-merger.cjs');
  for (const mode of ['local', 'global']) {
    const prefix = path.join(scratch, mode);
    fs.mkdirSync(prefix);
    fs.writeFileSync(
      path.join(prefix, 'package.json'),
      JSON.stringify({
        name: 'wpp-cli-security-consumer',
        version: '0.0.0',
        private: true,
      })
    );
    const install = [
      npm,
      'install',
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
    ];
    if (mode === 'global') install.push('--global', '--prefix', prefix);
    install.push(artifact);
    run(install, prefix);
    const installed = path.join(
      prefix,
      process.platform === 'win32' || mode === 'local'
        ? 'node_modules'
        : 'lib/node_modules',
      '@wppconnect/server'
    );
    process.stdout.write(run([helper, installed], prefix));
  }
} finally {
  assert.equal(path.dirname(path.resolve(scratch)), path.resolve(os.tmpdir()));
  fs.rmSync(scratch, { recursive: true, force: true });
}
