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
const path = require('node:path');
const { createRequire } = require('node:module');

delete process.env.RUN_SERVER;
const root = path.resolve(process.argv[2]);
const project = createRequire(path.join(root, 'package.json'));
project(root);
const core = createRequire(project.resolve('@wppconnect-team/wppconnect'));
const extra = createRequire(core.resolve('puppeteer-extra'));
const merge = extra('deepmerge');
const privateRuntime = path.join(root, 'vendor', 'deepmerge', 'index.cjs');
assert.equal(merge, project(privateRuntime));
const payload = JSON.parse('{"__proto__":{"isAdmin":true}}');
for (const result of [
  merge(Object.create(null), payload),
  merge({ session: null }, { session: payload }).session,
  merge(payload, {}),
]) {
  assert.equal(Object.getPrototypeOf(result), Object.prototype);
  assert.equal(result.isAdmin, undefined);
}
assert.deepEqual(merge.all([{ args: ['a'] }, { args: ['b'] }]), {
  args: ['a', 'b'],
});
assert.equal({}.isAdmin, undefined);
console.log(
  JSON.stringify({
    publicEntryLoaded: true,
    privateRuntime,
    dependencyMetadataVersion: extra('deepmerge/package.json').version,
    prototypeCasesPassed: 3,
  })
);
