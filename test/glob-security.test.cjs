/*!
 * Copyright 2026 WPPConnect Team
 * Licensed under the Apache License, Version 2.0.
 * http://www.apache.org/licenses/LICENSE-2.0
 */
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const { createRequire } = require('node:module');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');

const root = path.resolve(__dirname, '..');
const owner = createRequire(require.resolve('eslint-plugin-import'));
const modern = createRequire(require.resolve('test-exclude'));
const legacy = owner('minimatch');
const legacyRequire = createRequire(owner.resolve('minimatch'));

test('legacy callers retain the callable API and attached matching helpers', () => {
  assert.equal(typeof legacy, 'function');
  assert.equal(legacy('lib/a.js', '**/*.js'), true);
  assert.equal(legacy('lib/.hidden.js', '**/*.js'), false);
  assert.equal(legacy('lib/.hidden.js', '**/*.js', { dot: true }), true);
  assert.equal(legacy('ABC.js', '*.js', { nocase: true }), true);
  assert.deepEqual(legacy.match(['a.js', 'b.ts'], '*.js'), ['a.js']);
  assert.equal(legacy.filter('*.js')('a.js'), true);
  assert.equal(legacy.makeRe('*.js').test('a.js'), true);
  assert.deepEqual(legacy.braceExpand('*.{js,ts}'), ['*.js', '*.ts']);
  assert.equal(new legacy.Minimatch('**/*.js').match('lib/a.js'), true);
  assert.equal(legacy.defaults({ dot: true })('.hidden', '*'), true);
  assert.equal(
    new (legacy.defaults({ dot: true }).Minimatch)('*').match('.hidden'),
    true
  );
  assert.ok(legacy.GLOBSTAR);
  const model = new legacy.Minimatch('**/*.{js,ts}');
  assert.equal(model.set.length, model.globSet.length);
  const segment = model.set[0][1];
  assert.equal(segment._glob, '*.js');
  assert.ok('a.js'.match(segment));
  assert.equal('a.ts'.match(segment), null);
});

test('the installed facade is the reviewed source and delegates to a patched registry engine', () => {
  assert.equal(
    legacyRequire('minimatch-engine/package.json').version,
    '11.0.3'
  );
  assert.equal(modern('minimatch/package.json').version, '11.0.3');
  assert.equal(
    fs.readFileSync(owner.resolve('minimatch'), 'utf8').replace(/\r\n/g, '\n'),
    fs
      .readFileSync(
        path.join(root, 'vendor/minimatch-legacy-compat/index.cjs'),
        'utf8'
      )
      .replace(/\r\n/g, '\n')
  );
});

test('both registry engines bound first-phase glob amplification', () => {
  for (const modulePath of [
    modern.resolve('minimatch'),
    legacyRequire.resolve('minimatch-engine'),
  ]) {
    const code = `
      const assert = require('node:assert/strict');
      const { Minimatch } = require(${JSON.stringify(modulePath)});
      let peak = 0;
      class Probe extends Minimatch {
        firstPhasePreProcess(parts) {
          const result = super.firstPhasePreProcess(parts);
          peak = result.length;
          return result;
        }
      }
      new Probe(Array.from({length:12}, (_, i) => 'p'+i+'/**/../q'+i).join('/'),
        { optimizationLevel: 2, braceExpandMax: 64 });
      assert(peak > 1 && peak <= 64, 'first-phase pattern budget exceeded: '+peak);
    `;
    const result = spawnSync(
      process.execPath,
      ['--max-old-space-size=192', '-e', code],
      {
        encoding: 'utf8',
        timeout: 3000,
      }
    );
    assert.equal(
      result.status,
      0,
      result.stderr + (result.error?.message || '')
    );
  }
});

function fixture(depth = 0) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wpp-server-glob-'));
  function add(base, level) {
    fs.mkdirSync(base, { recursive: true });
    fs.writeFileSync(path.join(base, 'file.txt'), 'fixture');
    if (level)
      for (let i = 0; i < 3; i++) add(path.join(base, 'd' + i), level - 1);
  }
  add(dir, depth);
  return dir;
}
function cleanup(dir) {
  const resolved = fs.realpathSync(dir);
  assert.equal(path.dirname(resolved), fs.realpathSync(os.tmpdir()));
  assert.ok(path.basename(resolved).startsWith('wpp-server-glob-'));
  fs.rmSync(resolved, { recursive: true, force: true });
}

test('installed compatibility metadata matches the committed source', () => {
  assert.deepEqual(
    legacyRequire('./package.json'),
    require('../vendor/minimatch-legacy-compat/package.json')
  );
});

test('the actual ESLint import rule still rejects forbidden internal modules', () => {
  const { Linter } = require('eslint');
  const plugin = require('eslint-plugin-import');
  const linter = new Linter();
  linter.defineRule(
    'import/no-internal-modules',
    plugin.rules['no-internal-modules']
  );
  const messages = linter.verify(
    "import allowed from 'eslint-plugin-import'; import denied from 'eslint-plugin-import/lib/rules/no-internal-modules';",
    {
      parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
      rules: {
        'import/no-internal-modules': [
          'error',
          { forbid: ['eslint-plugin-import/lib/**'] },
        ],
      },
    },
    { filename: path.join(root, 'compat-check.js') }
  );
  assert.equal(messages.length, 1, JSON.stringify(messages));
  assert.equal(messages[0].ruleId, 'import/no-internal-modules');
});

test('actual Commitizen glob7 preserves callback, brace, ignore and dotfile traversal', async () => {
  const dir = fixture();
  try {
    fs.mkdirSync(path.join(dir, 'nested'));
    fs.writeFileSync(path.join(dir, '.czrc'), '{}');
    for (const name of ['a.js', 'b.ts', '.hidden.js'])
      fs.writeFileSync(path.join(dir, 'nested', name), '');
    const cz = createRequire(require.resolve('commitizen'));
    const glob = cz('glob');
    assert.equal(cz('glob/package.json').version, '7.2.3');
    assert.deepEqual(
      glob.sync('**/*.{js,ts}', { cwd: dir, ignore: '**/*.ts' }),
      ['nested/a.js']
    );
    assert.deepEqual(glob.sync('**/*.js', { cwd: dir, dot: true }), [
      'nested/.hidden.js',
      'nested/a.js',
    ]);
    assert.deepEqual(
      glob.sync('missing/*.{js,ts}', { cwd: dir, nonull: true }),
      ['missing/*.js', 'missing/*.ts']
    );
    assert.deepEqual(
      await new Promise((resolve, reject) =>
        glob('**/*.js', { cwd: dir }, (error, files) =>
          error ? reject(error) : resolve(files)
        )
      ),
      ['nested/a.js']
    );
    assert.equal(
      cz('./configLoader/findup.js').default(
        ['.czrc'],
        { cwd: path.join(dir, 'nested') },
        fs.existsSync
      ),
      path.join(dir, '.czrc')
    );
  } finally {
    cleanup(dir);
  }
});

test('the real Archiver/readdir-glob ZIP includes matching files and respects ignore', async () => {
  const dir = fixture();
  try {
    fs.mkdirSync(path.join(dir, 'nested'));
    fs.mkdirSync(path.join(dir, 'skip'));
    fs.writeFileSync(path.join(dir, 'nested', 'child.txt'), 'child');
    fs.writeFileSync(path.join(dir, 'skip', 'secret.txt'), 'excluded');
    fs.writeFileSync(path.join(dir, 'other.js'), 'excluded');
    const archive = require('archiver')('zip', { zlib: { level: 0 } });
    const chunks = [];
    const finished = new Promise((resolve, reject) => {
      archive.on('data', (chunk) => chunks.push(chunk));
      archive.on('error', reject);
      archive.on('end', resolve);
    });
    archive.glob('**/*.txt', { cwd: dir, ignore: ['skip/**'] });
    await archive.finalize();
    await finished;
    const output = await require('unzipper').Open.buffer(Buffer.concat(chunks));
    assert.deepEqual(output.files.map((file) => file.path).sort(), [
      'file.txt',
      'nested/child.txt',
    ]);
  } finally {
    cleanup(dir);
  }
});

test('modern owners use patched glob and retain synchronous and asynchronous APIs', async () => {
  const dir = fixture();
  try {
    for (const name of [
      'archiver-utils',
      'test-exclude',
      'rimraf',
      '@jest/reporters',
      'jest-config',
      'jest-runtime',
      'cacache',
    ]) {
      const caller = createRequire(require.resolve(name));
      const glob = caller('glob');
      assert.equal(caller('glob/package.json').version, '14.0.2', name);
      assert.deepEqual(
        glob.globSync('*.txt', { cwd: dir }),
        ['file.txt'],
        name
      );
      assert.deepEqual(
        await glob.glob('*.txt', { cwd: dir }),
        ['file.txt'],
        name
      );
    }
  } finally {
    cleanup(dir);
  }
});

for (const method of ['promise', 'stream'])
  test(`glob ${method} stops filesystem traversal after cancellation`, async () => {
    const dir = fixture(4);
    const controller = new AbortController();
    let reads = 0,
      atReject = 0,
      rejected = false;
    const customFs = {
      ...fs,
      readdir(file, options, callback) {
        reads++;
        fs.readdir(file, options, (error, entries) => {
          if (reads === 1) controller.abort(new Error('fixture-abort'));
          callback(error, entries);
        });
      },
    };
    try {
      const glob = modern('glob');
      const options = { cwd: dir, signal: controller.signal, fs: customFs };
      try {
        if (method === 'stream') {
          for await (const entry of glob.globStream('**/*', options))
            void entry;
        } else await glob.glob('**/*', options);
      } catch (error) {
        assert.equal(error.message, 'fixture-abort');
        rejected = true;
        atReject = reads;
      }
      await new Promise((resolve) => setTimeout(resolve, 120));
      assert.equal(rejected, true);
      assert.equal(
        reads - atReject,
        0,
        'filesystem traversal continued after rejection'
      );
      assert.equal(reads, 1);
    } finally {
      cleanup(dir);
    }
  });
