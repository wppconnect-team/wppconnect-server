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
import fs from 'fs';
import { PassThrough, Writable } from 'stream';
import unzipper from 'unzipper';

import CreateSessionUtil from '../../util/createSessionUtil';
import { startAllSessions } from '../../util/functions';
import getAllTokens from '../../util/getAllTokens';
import { backupSessions, restoreSessions } from '../../util/manageSession';
import { isSessionMaintenanceActive } from '../../util/sessionMaintenance';
import { clientsArray } from '../../util/sessionUtil';

jest.mock('../..', () => ({ logger: { info: jest.fn(), error: jest.fn() } }));
jest.mock('@wppconnect-team/wppconnect', () => ({ create: jest.fn() }));
jest.mock('../../controller/sessionController', () => ({
  download: jest.fn(),
}));
jest.mock('../../util/tokenStore/factory', () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock('../../util/functions', () => ({ startAllSessions: jest.fn() }));
jest.mock('../../util/getAllTokens', () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock('archiver', () => jest.fn());
jest.mock('unzipper', () => ({ Open: { file: jest.fn() } }));

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => (resolve = done));
  return { promise, resolve };
}

const flush = () => new Promise<void>((resolve) => setImmediate(resolve));
const zip = { mimetype: 'application/zip', path: 'upload.zip' } as any;
const create = jest.requireMock('@wppconnect-team/wppconnect')
  .create as jest.Mock;
const Factory = jest.requireMock('../../util/tokenStore/factory')
  .default as jest.Mock;
const tokens = getAllTokens as jest.Mock;
const restart = startAllSessions as jest.Mock;
let util: CreateSessionUtil;
let req: any;
let archive: any;
let finalize: ReturnType<typeof deferred>;
let download: PassThrough;
let downloadStarted: ReturnType<typeof deferred>;
let extracted: ReturnType<typeof deferred>;
let extracting: ReturnType<typeof deferred>;
let input: PassThrough;

function runtime() {
  const close = jest.fn().mockResolvedValue(undefined);
  return { status: 'CONNECTED', page: { browser: () => ({ close }) }, close };
}

beforeEach(() => {
  jest.clearAllMocks();
  expect(isSessionMaintenanceActive()).toBe(false);
  for (const key of Object.keys(clientsArray)) delete clientsArray[key];
  req = {
    body: {},
    serverOptions: { createOptions: {}, webhook: {} },
    logger: { info: jest.fn(), error: jest.fn() },
    res: new Writable({ write: (_chunk, _encoding, done) => done() }),
  };
  util = new CreateSessionUtil();
  util.start = jest.fn().mockResolvedValue(undefined);
  Factory.mockImplementation(() => ({
    createTokenStory: () => ({
      getToken: jest.fn().mockResolvedValue({}),
      setToken: jest.fn().mockResolvedValue(true),
    }),
  }));
  create.mockImplementation(async () => runtime());
  tokens.mockResolvedValue([]);
  restart.mockImplementation(async () => {
    expect(isSessionMaintenanceActive()).toBe(false);
  });
  jest.spyOn(fs.promises, 'mkdtemp').mockResolvedValue('private-staging');
  jest.spyOn(fs.promises, 'rm').mockResolvedValue(undefined);
  jest.spyOn(fs.promises, 'mkdir').mockResolvedValue(undefined);
  jest.spyOn(fs, 'cpSync').mockImplementation(() => undefined);
  jest.spyOn(fs, 'existsSync').mockReturnValue(true);
  jest
    .spyOn(fs, 'createWriteStream')
    .mockImplementation(
      () => new Writable({ write: (_chunk, _encoding, done) => done() }) as any
    );
  download = new PassThrough();
  downloadStarted = deferred();
  jest.spyOn(fs, 'createReadStream').mockImplementation(() => {
    downloadStarted.resolve();
    return download as any;
  });
  finalize = deferred();
  archive = new PassThrough();
  archive.directory = jest.fn();
  archive.finalize = jest.fn(async () => {
    await finalize.promise;
    archive.end('zip bytes');
  });
  (archiver as unknown as jest.Mock).mockReturnValue(archive);
  input = new PassThrough();
  extracted = deferred();
  extracting = deferred();
  (unzipper.Open.file as jest.Mock).mockImplementation(async () => ({
    files: [{ path: 'tokens/token.json', type: 'File', stream: () => input }],
  }));
});

afterEach(() => {
  jest.restoreAllMocks();
  for (const key of Object.keys(clientsArray)) delete clientsArray[key];
  expect(isSessionMaintenanceActive()).toBe(false);
});

async function blockedStarts() {
  const calls = create.mock.calls.length;
  const stores = Factory.mock.calls.length;
  await util.opendata(req, 'new_session');
  await util.opendata(req, 'first');
  expect(create).toHaveBeenCalledTimes(calls);
  expect(Factory).toHaveBeenCalledTimes(stores);
  expect(clientsArray.new_session).toBeUndefined();
  expect(clientsArray.first).toBeUndefined();
}

function configureRestoreWriter() {
  (fs.createWriteStream as jest.Mock).mockImplementation(
    () =>
      new Writable({
        write: (_chunk, _encoding, done) => done(),
        final: (done) => {
          extracting.resolve();
          extracted.promise.then(() => done());
        },
      })
  );
}

async function finishBackup(operation: Promise<void>) {
  finalize.resolve();
  await downloadStarted.promise;
  download.end('zip response');
  await operation;
}

it('blocks new and restarted sessions during teardown, archiving and response streaming', async () => {
  const slow = deferred();
  const closing = deferred();
  clientsArray.first = runtime() as any;
  const second = runtime();
  second.close.mockImplementation(async () => {
    closing.resolve();
    await slow.promise;
  });
  clientsArray.second = second as any;
  tokens.mockResolvedValue(['first', 'second']);
  const operation = backupSessions(req);
  await closing.promise;
  await blockedStarts();
  expect(archiver).not.toHaveBeenCalled();
  slow.resolve();
  await flush();
  expect(archive.finalize).toHaveBeenCalledTimes(1);
  await blockedStarts();
  finalize.resolve();
  await downloadStarted.promise;
  await blockedStarts();
  download.end('response');
  await operation;
  expect(restart).toHaveBeenCalledTimes(1);
  await util.opendata(req, 'new_session');
  expect(create).toHaveBeenCalledTimes(1);
});

it('drains pending token reads, token writes and browser creation before teardown', async () => {
  const tokenRead = deferred();
  const tokenWrite = deferred();
  const browser = deferred();
  const client = runtime();
  Factory.mockImplementation(() => ({
    createTokenStory: () => ({
      getToken: async () => {
        await tokenRead.promise;
        return {};
      },
      setToken: async () => {
        await tokenWrite.promise;
        return true;
      },
    }),
  }));
  create.mockImplementation(async () => {
    await browser.promise;
    return client;
  });
  const starting = util.opendata(req, 'pending');
  const operation = backupSessions(req);
  await flush();
  expect(tokens).not.toHaveBeenCalled();
  await blockedStarts();
  tokenRead.resolve();
  await flush();
  expect(create).not.toHaveBeenCalled();
  expect(tokens).not.toHaveBeenCalled();
  tokenWrite.resolve();
  await flush();
  expect(create).toHaveBeenCalledTimes(1);
  expect(tokens).not.toHaveBeenCalled();
  browser.resolve();
  await starting;
  await flush();
  expect(client.close).toHaveBeenCalledTimes(1);
  expect(archive.finalize).toHaveBeenCalledTimes(1);
  await finishBackup(operation);
});

it('holds restore admission through extraction completion and both directory copies', async () => {
  configureRestoreWriter();
  const operation = restoreSessions(req, zip);
  await flush();
  await blockedStarts();
  input.end('archive');
  await extracting.promise;
  await flush();
  // Finishing the input stream is not proof that extracted files are closed.
  expect(fs.cpSync).not.toHaveBeenCalled();
  await blockedStarts();
  (fs.cpSync as jest.Mock).mockImplementation(() => {
    expect(isSessionMaintenanceActive()).toBe(true);
  });
  extracted.resolve();
  await expect(operation).resolves.toEqual({ success: true });
  expect(fs.cpSync).toHaveBeenCalledTimes(2);
  expect(restart).toHaveBeenCalledTimes(1);
  await util.opendata(req, 'new_session');
  expect(create).toHaveBeenCalledTimes(1);
});

it('rejects overlapping maintenance without releasing the current operation', async () => {
  const operation = backupSessions(req);
  await flush();
  await expect(restoreSessions(req, zip)).rejects.toThrow(
    'already in progress'
  );
  await expect(backupSessions(req)).rejects.toThrow('already in progress');
  await blockedStarts();
  expect(tokens).toHaveBeenCalledTimes(1);
  await finishBackup(operation);
});

it.each([
  'listing',
  'close',
  'copy',
  'archive',
  'output',
  'download',
  'cleanup',
])(
  'releases backup admission after a %s failure without restarting sessions',
  async (phase) => {
    if (phase === 'listing') tokens.mockResolvedValue(undefined);
    if (phase === 'close') {
      const client = runtime();
      client.close.mockRejectedValue(new Error('close failed'));
      clientsArray.broken = client as any;
    }
    if (phase === 'copy')
      (fs.cpSync as jest.Mock).mockImplementation(() => {
        throw new Error('copy failed');
      });
    if (phase === 'archive')
      archive.finalize.mockRejectedValue(new Error('archive failed'));
    if (phase === 'output')
      (fs.createWriteStream as jest.Mock).mockReturnValue(
        new Writable({
          write: (_chunk, _encoding, done) => done(new Error('write failed')),
        })
      );
    if (phase === 'cleanup')
      (fs.promises.rm as jest.Mock).mockRejectedValue(
        new Error('cleanup failed')
      );
    const operation = backupSessions(req);
    const rejected = expect(operation).rejects.toThrow();
    finalize.resolve();
    if (phase === 'download') {
      await downloadStarted.promise;
      download.destroy(new Error('download failed'));
    } else download.end('response');
    await rejected;
    expect(restart).not.toHaveBeenCalled();
    await util.opendata(req, 'new_session');
    expect(create).toHaveBeenCalledTimes(1);
  }
);

it.each(['input', 'extract', 'copy', 'cleanup'])(
  'releases restore admission after a %s failure and does not report success',
  async (phase) => {
    configureRestoreWriter();
    if (phase === 'copy')
      (fs.cpSync as jest.Mock).mockImplementation(() => {
        throw new Error('copy failed');
      });
    if (phase === 'cleanup')
      (fs.promises.rm as jest.Mock).mockRejectedValue(
        new Error('cleanup failed')
      );
    if (phase === 'extract') {
      (fs.createWriteStream as jest.Mock).mockImplementationOnce(
        () =>
          new Writable({
            write: (_chunk, _encoding, done) =>
              done(new Error('extract failed')),
          })
      );
    }
    const operation = restoreSessions(req, zip);
    const rejected = expect(operation).rejects.toThrow();
    await flush();
    if (phase === 'input') input.destroy(new Error('input failed'));
    else if (phase === 'extract') input.end('zip');
    else {
      input.end('zip');
      extracted.resolve();
    }
    await rejected;
    expect(restart).not.toHaveBeenCalled();
    await util.opendata(req, 'new_session');
    expect(create).toHaveBeenCalledTimes(1);
  }
);

it.each(['backup', 'restore'])(
  'retains %s admission until temporary files have been cleaned up',
  async (kind) => {
    const cleaning = deferred();
    const cleaned = deferred();
    (fs.promises.rm as jest.Mock).mockImplementationOnce(async () => {
      cleaning.resolve();
      await cleaned.promise;
    });
    let operation: Promise<unknown>;
    if (kind === 'backup') {
      operation = backupSessions(req);
      finalize.resolve();
      await downloadStarted.promise;
      download.end('zip');
    } else {
      configureRestoreWriter();
      operation = restoreSessions(req, zip);
      input.end('zip');
      extracted.resolve();
    }
    await cleaning.promise;
    await blockedStarts();
    await expect(backupSessions(req)).rejects.toThrow('already in progress');
    expect(restart).not.toHaveBeenCalled();
    cleaned.resolve();
    await operation;
    expect(restart).toHaveBeenCalledTimes(1);
  }
);

it('waits for a failed restore writer to close before releasing admission', async () => {
  const destroying = deferred();
  const destroyed = deferred();
  (fs.createWriteStream as jest.Mock).mockReturnValueOnce(
    new Writable({
      write: (_chunk, _encoding, done) => done(),
      destroy(error, done) {
        destroying.resolve();
        destroyed.promise.then(() => done(error));
      },
    })
  );
  const operation = restoreSessions(req, zip);
  const rejected = expect(operation).rejects.toThrow('input failed');
  await flush();
  input.destroy(new Error('input failed'));
  await destroying.promise;
  await blockedStarts();
  expect(fs.promises.rm).not.toHaveBeenCalled();
  expect(restart).not.toHaveBeenCalled();
  destroyed.resolve();
  await rejected;
});
