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
const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const { test } = require('node:test');
const owner = createRequire(require.resolve('puppeteer-extra'));
const merge = owner('deepmerge');

const malicious = () => JSON.parse('{"__proto__":{"isAdmin":true}}');
function assertSafe(value) {
  assert.equal(Object.getPrototypeOf(value), Object.prototype);
  assert.equal(value.isAdmin, undefined);
  assert.equal(Object.hasOwn(value, '__proto__'), false);
  assert.equal({}.isAdmin, undefined);
}

test('browser options cannot inherit attacker values from a null-prototype target', () => {
  const target = Object.assign(Object.create(null), { debug: false });
  const result = merge(target, malicious());
  assertSafe(result);
  assert.equal(result.debug, false);
});
test('browser options cannot inherit attacker values through a null placeholder', () => {
  const input = { session: malicious() };
  assertSafe(merge({ session: null }, input).session);
});
test('browser options reject a proto key already present in the defaults', () => {
  const result = merge(malicious(), { debug: false });
  assertSafe(result);
  assert.equal(result.debug, false);
});
test('browser options cannot inherit attacker values through a primitive placeholder', () => {
  assertSafe(merge({ session: 1 }, { session: malicious() }).session);
});
test('cloned browser option arrays retain safe element prototypes', () => {
  const result = merge({ list: [] }, { list: [malicious()] });
  assertSafe(result.list[0]);
});
test('browser option merging retains arrays, symbols, custom merging and source objects', () => {
  const key = Symbol('option');
  const first = { args: ['--one'], nested: { a: 1 }, [key]: 1 };
  const second = { args: ['--two'], nested: { b: 2 } };
  assert.deepEqual(merge.all([first, second]).args, ['--one', '--two']);
  assert.deepEqual(first.args, ['--one']);
  assert.equal(merge(first, second)[key], 1);
  assert.deepEqual(merge(first, second, { arrayMerge: (_a, b) => b }).args, [
    '--two',
  ]);
  assert.deepEqual(
    merge(first, second, {
      customMerge: (name) =>
        name === 'nested' ? (a, b) => ({ a: a.a + b.b }) : undefined,
    }).nested,
    { a: 3 }
  );
});

const fs = require('node:fs');
const path = require('node:path');
test('installed browser merger matches the reviewed private runtime files', () => {
  const installed = path.dirname(owner.resolve('deepmerge'));
  for (const file of ['index.cjs', 'is-mergeable-object.cjs']) {
    const actual = fs
      .readFileSync(path.join(installed, file), 'utf8')
      .replace(/\r\n/g, '\n');
    const expected = fs
      .readFileSync(path.join(__dirname, '../vendor/deepmerge', file), 'utf8')
      .replace(/\r\n/g, '\n');
    assert.equal(actual, expected);
  }
});

test('Express-owned query serialization handles hostile comma elements and retains ordinary behavior', () => {
  const expressOwner = createRequire(require.resolve('express'));
  const qs = expressOwner('qs');
  for (const input of [
    { a: [{ toString: 'x' }] },
    qs.parse('a[0][toString]=x', { allowPrototypes: true }),
    qs.parse('a[0][b]=c', { plainObjects: true }),
  ]) {
    for (const encodeValuesOnly of [false, true]) {
      assert.doesNotThrow(() =>
        qs.stringify(input, { arrayFormat: 'comma', encodeValuesOnly })
      );
    }
  }
  assert.equal(
    qs.stringify({ a: ['x', 'y'] }, { arrayFormat: 'comma' }),
    'a=x%2Cy'
  );
  assert.deepEqual(qs.parse('session=test&nested[x]=1'), {
    session: 'test',
    nested: { x: '1' },
  });
});
