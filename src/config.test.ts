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
 */
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';

const originalEnv = process.env;
let directory: string;
let cwd: jest.SpyInstance;

beforeEach(() => {
  directory = mkdtempSync(path.join(tmpdir(), 'wppconnect-env-'));
  cwd = jest.spyOn(process, 'cwd').mockReturnValue(directory);
  process.env = { ...originalEnv };
  delete process.env.SECRET_KEY;
  delete process.env.PORT;
  delete process.env.MAX_LISTENERS;
  jest.resetModules();
});

afterEach(() => {
  process.env = originalEnv;
  cwd.mockRestore();
  if (path.dirname(directory) !== path.resolve(tmpdir()))
    throw new Error('Unexpected test directory');
  rmSync(directory, { recursive: true, force: true });
});

it('loads the optional cwd .env before resolving server settings', async () => {
  writeFileSync(
    directory + '/.env',
    'SECRET_KEY=test-env-key\nPORT=24552\nMAX_LISTENERS=27\n'
  );
  const { default: config } = await import('./config');
  expect(config.secretKey).toBe('test-env-key');
  expect(config.port).toBe('24552');
  expect(config.maxListeners).toBe(27);
});

it('keeps deployment environment values ahead of the .env file', async () => {
  writeFileSync(
    directory + '/.env',
    'SECRET_KEY=file-key\nPORT=24552\nMAX_LISTENERS=27\n'
  );
  process.env.SECRET_KEY = 'deployment-key';
  process.env.PORT = '24553';
  process.env.MAX_LISTENERS = '0';
  const { default: config } = await import('./config');
  expect(config.secretKey).toBe('deployment-key');
  expect(config.port).toBe('24553');
  expect(config.maxListeners).toBe(0);
});

it('starts with legacy defaults when no .env exists', async () => {
  const { default: config } = await import('./config');
  expect(config.secretKey).toBe('THISISMYSECURETOKEN');
  expect(config.port).toBe('21465');
  expect(config.maxListeners).toBe(15);
});
