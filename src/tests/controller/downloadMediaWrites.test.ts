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
import fs from 'fs';

import { download } from '../../controller/sessionController';

jest.mock('../..', () => ({ logger: { error: jest.fn() } }));
jest.mock('fs', () => ({
  readFileSync: jest.requireActual('fs').readFileSync,
  existsSync: jest.fn().mockReturnValue(false),
  writeFile: jest.fn(),
  promises: { writeFile: jest.fn() },
}));
jest.mock('../../util/functions', () => ({ callWebHook: jest.fn() }));
jest.mock('../../util/createSessionUtil', () => ({
  __esModule: true,
  default: jest.fn(),
}));

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

const write = fs.promises.writeFile as jest.Mock;
const buffer = Buffer.from('downloaded media');
const logger = { error: jest.fn(), warn: jest.fn() };

beforeEach(() => {
  jest.clearAllMocks();
  write.mockReset();
  (fs.existsSync as jest.Mock).mockReturnValue(false);
});

it.each([
  ['image', 'image/png', 'png'],
  ['ptt', 'audio/ogg', 'oga'],
])(
  'waits for the decrypted %s write before returning its path',
  async (type, mimetype, extension) => {
    const pending = deferred();
    write.mockReturnValue(pending.promise);
    const client = {
      decryptFile: jest.fn().mockResolvedValue(buffer),
      downloadMedia: jest.fn(),
    };
    let settled = false;
    const result = download({ type, mimetype, t: 123 }, client, logger).then(
      (path) => {
        settled = true;
        return path;
      }
    );
    await new Promise(setImmediate);
    expect(settled).toBe(false);
    expect(write).toHaveBeenCalledWith(
      `./WhatsAppImages/file123.${extension}`,
      buffer
    );
    pending.resolve();
    await expect(result).resolves.toBe(`WhatsAppImages/file123.${extension}`);
    expect(client.downloadMedia).not.toHaveBeenCalled();
  }
);

it('waits for a direct download write after decryption fails', async () => {
  const pending = deferred();
  write.mockReturnValue(pending.promise);
  const client = {
    decryptFile: jest.fn().mockRejectedValue(new Error('decrypt failed')),
    downloadMedia: jest.fn().mockResolvedValue(buffer),
  };
  let settled = false;
  const result = download(
    { type: 'image', mimetype: 'image/png', t: 123 },
    client,
    logger
  ).then((path) => {
    settled = true;
    return path;
  });
  await new Promise(setImmediate);
  expect(settled).toBe(false);
  pending.resolve();
  await expect(result).resolves.toBe('WhatsAppImages/file123.png');
});

it('waits for the fallback write if the first write fails', async () => {
  const pending = deferred();
  const error = new Error('first write failed');
  write.mockRejectedValueOnce(error).mockReturnValueOnce(pending.promise);
  const client = {
    decryptFile: jest.fn().mockResolvedValue(buffer),
    downloadMedia: jest.fn().mockResolvedValue(buffer),
  };
  let settled = false;
  const result = download(
    { type: 'image', mimetype: 'image/png', t: 123 },
    client,
    logger
  ).then((path) => {
    settled = true;
    return path;
  });
  await new Promise(setImmediate);
  expect(client.downloadMedia).toHaveBeenCalledTimes(1);
  expect(settled).toBe(false);
  expect(logger.error).toHaveBeenCalledWith(error);
  pending.resolve();
  await expect(result).resolves.toBe('WhatsAppImages/file123.png');
});

it('does not return a path when both writes fail', async () => {
  const error = new Error('disk full');
  write.mockRejectedValue(error);
  const client = {
    decryptFile: jest.fn().mockResolvedValue(buffer),
    downloadMedia: jest.fn().mockResolvedValue(buffer),
  };
  await expect(
    download({ type: 'image', mimetype: 'image/png', t: 123 }, client, logger)
  ).resolves.toBeUndefined();
  expect(write).toHaveBeenCalledTimes(2);
  expect(logger.error).toHaveBeenCalledWith(error);
});

it('does not return a path when the direct download write fails', async () => {
  const error = new Error('permission denied');
  write.mockRejectedValue(error);
  const client = {
    decryptFile: jest.fn().mockRejectedValue(new Error('decrypt failed')),
    downloadMedia: jest.fn().mockResolvedValue(buffer),
  };
  await expect(
    download({ type: 'ptt', mimetype: 'audio/ogg', t: 123 }, client, logger)
  ).resolves.toBeUndefined();
  expect(logger.error).toHaveBeenCalledWith(error);
});
