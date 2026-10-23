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
import archiver from 'archiver';
import { randomUUID } from 'crypto';
import { existsSync, promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { Writable } from 'stream';
import unzipper from 'unzipper';

import config from '../../config';
import { startAllSessions } from '../../util/functions';
import { backupSessions, restoreSessions } from '../../util/manageSession';
import { isSessionMaintenanceActive } from '../../util/sessionMaintenance';

jest.mock('../..', () => ({ logger: { info: jest.fn(), error: jest.fn() } }));
jest.mock('../../util/functions', () => ({ startAllSessions: jest.fn() }));
jest.mock('../../util/getAllTokens', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue([]),
}));

const tokensDirectory = path.resolve(__dirname, '../../../tokens');
const originalProfiles = config.customUserDataDir;
let fixture: string;
let ownsTokens = false;

beforeEach(async () => {
  jest.clearAllMocks();
  // This fixture owns a directory in the isolated checkout, never existing data.
  if (existsSync(tokensDirectory))
    throw new Error('Token fixture path already exists');
  await fs.mkdir(tokensDirectory);
  ownsTokens = true;
  fixture = await fs.mkdtemp(path.join(os.tmpdir(), 'wpp-maintenance-files-'));
  config.customUserDataDir = path.join(fixture, 'profiles');
  await fs.mkdir(config.customUserDataDir);
  await fs.writeFile(
    path.join(tokensDirectory, 'fixture.data.json'),
    '{"token":"before"}'
  );
  await fs.writeFile(
    path.join(config.customUserDataDir, 'state.txt'),
    'profile before'
  );
  (startAllSessions as jest.Mock).mockImplementation(async () => {
    expect(isSessionMaintenanceActive()).toBe(false);
  });
});

afterEach(async () => {
  config.customUserDataDir = originalProfiles;
  if (ownsTokens) {
    await fs.rm(tokensDirectory, { recursive: true, force: true });
    ownsTokens = false;
  }
  if (fixture) await fs.rm(fixture, { recursive: true, force: true });
  expect(isSessionMaintenanceActive()).toBe(false);
});

it('streams a real backup ZIP and awaits extraction and restored filesystem data', async () => {
  const chunks: Buffer[] = [];
  const response = new Writable({
    write(chunk, _encoding, done) {
      chunks.push(Buffer.from(chunk));
      done();
    },
  });
  const req = { res: response, logger: { error: jest.fn() } } as any;

  await backupSessions(req);

  expect(response.writableFinished).toBe(true);
  const bytes = Buffer.concat(chunks);
  const archive = await unzipper.Open.buffer(bytes);
  const token = archive.files.find(
    (entry) => entry.path === 'tokens/fixture.data.json'
  )!;
  const profile = archive.files.find(
    (entry) => entry.path === 'userDataDir/state.txt'
  )!;
  expect((await token.buffer()).toString()).toBe('{"token":"before"}');
  expect((await profile.buffer()).toString()).toBe('profile before');
  const uploaded = path.join(fixture, 'backup.zip');
  await fs.writeFile(uploaded, bytes);
  await fs.writeFile(
    path.join(tokensDirectory, 'fixture.data.json'),
    '{"token":"changed"}'
  );
  await fs.unlink(path.join(config.customUserDataDir, 'state.txt'));

  await expect(
    restoreSessions(req, { mimetype: 'application/zip', path: uploaded } as any)
  ).resolves.toEqual({ success: true });

  expect(
    await fs.readFile(path.join(tokensDirectory, 'fixture.data.json'), 'utf8')
  ).toBe('{"token":"before"}');
  expect(
    await fs.readFile(path.join(config.customUserDataDir, 'state.txt'), 'utf8')
  ).toBe('profile before');
  expect(startAllSessions).toHaveBeenCalledTimes(2);
});

it('rejects a real malformed archive without modifying live data or retaining the gate', async () => {
  const uploaded = path.join(fixture, 'broken.zip');
  await fs.writeFile(uploaded, 'this is not a zip archive');
  await expect(
    restoreSessions(
      {} as any,
      { mimetype: 'application/zip', path: uploaded } as any
    )
  ).rejects.toThrow();
  expect(
    await fs.readFile(path.join(tokensDirectory, 'fixture.data.json'), 'utf8')
  ).toBe('{"token":"before"}');
  expect(startAllSessions).not.toHaveBeenCalled();
});

async function zipEntries(entries: Array<{ name: string; text: string }>) {
  const archive = archiver('zip');
  const chunks: Buffer[] = [];
  archive.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
  const ended = new Promise<void>((resolve, reject) => {
    archive.on('end', resolve);
    archive.on('error', reject);
  });
  for (const entry of entries) archive.append(entry.text, { name: entry.name });
  await Promise.all([archive.finalize(), ended]);
  return Buffer.concat(chunks);
}

it('rejects conflicting archive entries without unhandled errors or a stuck gate', async () => {
  const uploaded = path.join(fixture, 'conflict.zip');
  await fs.writeFile(
    uploaded,
    await zipEntries([
      { name: 'tokens', text: 'a file cannot also be the parent directory' },
      { name: 'tokens/fixture.data.json', text: 'replacement' },
    ])
  );
  await expect(
    restoreSessions(
      {} as any,
      { mimetype: 'application/zip', path: uploaded } as any
    )
  ).rejects.toThrow();
  expect(
    await fs.readFile(path.join(tokensDirectory, 'fixture.data.json'), 'utf8')
  ).toBe('{"token":"before"}');
  expect(startAllSessions).not.toHaveBeenCalled();
});

it('skips ZIP entries that would escape the private extraction directory', async () => {
  const filename = `wpp-slip-${randomUUID()}.txt`;
  const safeName = `___${filename}`;
  const zipName = `../${filename}`;
  const bytes = await zipEntries([
    { name: safeName, text: 'must stay contained' },
  ]);
  // Keep equal-length local and central header names, bypassing the ZIP writer's
  // own path normalization to supply an actual traversal entry to the reader.
  let offset = 0;
  while ((offset = bytes.indexOf(safeName, offset)) !== -1) {
    bytes.write(zipName, offset);
    offset += zipName.length;
  }
  const uploaded = path.join(fixture, 'traversal.zip');
  await fs.writeFile(uploaded, bytes);
  await restoreSessions(
    {} as any,
    { mimetype: 'application/zip', path: uploaded } as any
  );
  expect(existsSync(path.join(os.tmpdir(), filename))).toBe(false);
  expect(
    await fs.readFile(path.join(tokensDirectory, 'fixture.data.json'), 'utf8')
  ).toBe('{"token":"before"}');
});
