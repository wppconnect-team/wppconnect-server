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
import { pathToFileURL } from 'node:url';

const windows = process.platform === 'win32';

const runYarnAudit = () =>
  spawnSync(
    windows ? process.env.ComSpec || 'cmd.exe' : 'yarn',
    windows
      ? ['/d', '/s', '/c', 'yarn npm audit --all --recursive --json']
      : ['npm', 'audit', '--all', '--recursive', '--json'],
    { encoding: 'utf8' }
  );

const delay = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

export const parseAuditRecords = (output = '') =>
  output
    .split(/\r?\n/)
    .filter(Boolean)
    .flatMap((line) => {
      try {
        return [JSON.parse(line)];
      } catch {
        return [];
      }
    });

export async function getAuditReport({
  runAudit = runYarnAudit,
  wait = delay,
  attempts = 3,
  retryDelayMs = 2_000,
} = {}) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const audit = runAudit();

    if (audit.error) throw audit.error;

    const records = parseAuditRecords(audit.stdout);

    if (audit.status === 0 || records.length > 0) {
      return records;
    }

    process.stderr.write(audit.stderr || audit.stdout);

    if (attempt < attempts) {
      console.error(
        `Yarn audit returned no report (attempt ${attempt}/${attempts}); retrying...`
      );
      await wait(retryDelayMs * attempt);
    }
  }

  throw new Error(
    `Yarn audit failed without returning an audit report after ${attempts} attempts`
  );
}

export async function main() {
  const records = await getAuditReport();
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
}

const isDirectRun =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) await main();
