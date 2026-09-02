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
 *
 * Fail on registry security advisories while reporting package deprecations
 * separately. Yarn's audit command currently gives both the same non-zero
 * exit code, which would otherwise make a deprecation look like a CVE.
 */
import { spawnSync } from 'node:child_process';

const windows = process.platform === 'win32';
const audit = spawnSync(
  windows ? process.env.ComSpec || 'cmd.exe' : 'yarn',
  windows
    ? ['/d', '/s', '/c', 'yarn npm audit --all --recursive --json']
    : ['npm', 'audit', '--all', '--recursive', '--json'],
  { encoding: 'utf8' }
);

if (audit.error) throw audit.error;

const records = audit.stdout
  .split(/\r?\n/)
  .filter(Boolean)
  .flatMap((line) => {
    try {
      return [JSON.parse(line)];
    } catch {
      return [];
    }
  });

if (audit.status !== 0 && records.length === 0) {
  process.stderr.write(audit.stderr || audit.stdout);
  throw new Error('Yarn audit failed without returning an audit report');
}

const advisories = records.filter(
  (record) => typeof record?.children?.ID === 'number'
);
const deprecations = records.length - advisories.length;

if (advisories.length > 0) {
  for (const { value, children } of advisories) {
    console.error(
      `${children.Severity}: ${value} - ${children.Issue} (${children.URL})`
    );
  }
  process.exitCode = 1;
} else {
  console.log(
    `Security audit passed: 0 advisories (${deprecations} deprecation notices reported separately).`
  );
}
