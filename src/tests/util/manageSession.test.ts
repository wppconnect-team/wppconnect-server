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
import fileSystem from 'fs';

import {
  backupSessions,
  closeAllSessions,
  restoreSessions,
} from '../../util/manageSession';
import { clientsArray } from '../../util/sessionUtil';

jest.mock('../..', () => ({
  logger: { info: jest.fn(), error: jest.fn() },
}));
jest.mock('../../util/getAllTokens', () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock('archiver', () => jest.fn());
jest.mock('unzipper', () => ({}));
jest.mock('../../util/functions', () => ({ startAllSessions: jest.fn() }));

const getAllTokens = jest.requireMock('../../util/getAllTokens')
  .default as jest.Mock;
const archiverMock = archiver as unknown as jest.Mock;

function makeClient() {
  const close = jest.fn().mockResolvedValue(undefined);
  return {
    status: 'CONNECTED',
    page: { browser: () => ({ close }) },
    close,
  };
}

const req = { logger: { error: jest.fn() } } as any;
const zipFile = { mimetype: 'application/zip', path: 'upload.zip' } as any;

describe('closeAllSessions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    for (const key of Object.keys(clientsArray))
      delete (clientsArray as any)[key];
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('does not resolve until every browser has closed', async () => {
    const first = makeClient();
    const second = makeClient();
    (clientsArray as any).first = first;
    (clientsArray as any).second = second;
    getAllTokens.mockResolvedValue(['first', 'second']);

    await closeAllSessions(req);

    // forEach would return before either close() was called.
    expect(first.close).toHaveBeenCalledTimes(1);
    expect(second.close).toHaveBeenCalledTimes(1);
  });

  it('waits for a slow close before returning', async () => {
    let finished = false;
    const client = makeClient();
    client.close.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => {
            finished = true;
            resolve(undefined);
          }, 5)
        )
    );
    (clientsArray as any).slow = client;
    getAllTokens.mockResolvedValue(['slow']);

    await closeAllSessions(req);

    expect(finished).toBe(true);
  });

  it('drops each session from the runtime map', async () => {
    (clientsArray as any).gone = makeClient();
    getAllTokens.mockResolvedValue(['gone']);

    await closeAllSessions(req);

    expect((clientsArray as any).gone).toBeUndefined();
  });

  it('closes sessions that only exist in the live registry', async () => {
    const live = makeClient();
    (clientsArray as any).live = live;
    getAllTokens.mockResolvedValue([]);

    await closeAllSessions(req);

    expect(live.close).toHaveBeenCalledTimes(1);
    expect((clientsArray as any).live).toBeUndefined();
  });

  it('rejects when the token listing fails instead of assuming no sessions', async () => {
    const live = makeClient();
    (clientsArray as any).live = live;
    getAllTokens.mockResolvedValue(undefined);

    await expect(closeAllSessions(req)).rejects.toThrow(
      'Could not list sessions to close'
    );

    // The sessions were never confirmed, so none may be touched.
    expect(live.close).not.toHaveBeenCalled();
    expect((clientsArray as any).live).toBe(live);
  });

  it('keeps closing the rest, then reports the session it could not stop', async () => {
    const broken = makeClient();
    broken.close.mockRejectedValue(new Error('browser already gone'));
    const healthy = makeClient();
    (clientsArray as any).broken = broken;
    (clientsArray as any).healthy = healthy;
    getAllTokens.mockResolvedValue(['broken', 'healthy']);

    await expect(closeAllSessions(req)).rejects.toThrow(
      'Could not stop sessions: broken'
    );

    expect(broken.close).toHaveBeenCalledTimes(1);
    expect(healthy.close).toHaveBeenCalledTimes(1);
    expect((clientsArray as any).healthy).toBeUndefined();
  });

  it('preserves the failed session runtime with an ERROR status', async () => {
    const broken = makeClient();
    broken.close.mockRejectedValue(new Error('browser already gone'));
    (clientsArray as any).broken = broken;
    getAllTokens.mockResolvedValue(['broken']);

    await expect(closeAllSessions(req)).rejects.toThrow(
      'Could not stop sessions: broken'
    );

    // The handle is kept so the still-running browser can be cleaned up
    // explicitly instead of being silently dropped.
    expect((clientsArray as any).broken).toBe(broken);
    expect(broken.status).toBe('ERROR');
  });
});

describe('backupSessions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    for (const key of Object.keys(clientsArray))
      delete (clientsArray as any)[key];
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('refuses to archive when a session cannot be stopped', async () => {
    const broken = makeClient();
    broken.close.mockRejectedValue(new Error('browser already gone'));
    (clientsArray as any).broken = broken;
    getAllTokens.mockResolvedValue(['broken']);
    const createWriteStream = jest.spyOn(fileSystem, 'createWriteStream');
    const cpSync = jest.spyOn(fileSystem, 'cpSync');

    await expect(backupSessions(req)).rejects.toThrow(
      'Could not stop sessions: broken'
    );

    expect(archiverMock).not.toHaveBeenCalled();
    expect(createWriteStream).not.toHaveBeenCalled();
    expect(cpSync).not.toHaveBeenCalled();
  });

  it('refuses to archive when the token listing fails', async () => {
    getAllTokens.mockResolvedValue(undefined);
    const createWriteStream = jest.spyOn(fileSystem, 'createWriteStream');
    const cpSync = jest.spyOn(fileSystem, 'cpSync');

    await expect(backupSessions(req)).rejects.toThrow(
      'Could not list sessions to close'
    );

    expect(archiverMock).not.toHaveBeenCalled();
    expect(createWriteStream).not.toHaveBeenCalled();
    expect(cpSync).not.toHaveBeenCalled();
  });
});

describe('restoreSessions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    for (const key of Object.keys(clientsArray))
      delete (clientsArray as any)[key];
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('does not extract anything when a session cannot be stopped', async () => {
    const broken = makeClient();
    broken.close.mockRejectedValue(new Error('browser already gone'));
    (clientsArray as any).broken = broken;
    getAllTokens.mockResolvedValue(['broken']);
    const createReadStream = jest.spyOn(fileSystem, 'createReadStream');
    const cpSync = jest.spyOn(fileSystem, 'cpSync');

    await expect(restoreSessions(req, zipFile)).rejects.toThrow(
      'Could not stop sessions: broken'
    );

    expect(createReadStream).not.toHaveBeenCalled();
    expect(cpSync).not.toHaveBeenCalled();
  });

  it('does not extract anything when the token listing fails', async () => {
    getAllTokens.mockResolvedValue(undefined);
    const createReadStream = jest.spyOn(fileSystem, 'createReadStream');
    const cpSync = jest.spyOn(fileSystem, 'cpSync');

    await expect(restoreSessions(req, zipFile)).rejects.toThrow(
      'Could not list sessions to close'
    );

    expect(createReadStream).not.toHaveBeenCalled();
    expect(cpSync).not.toHaveBeenCalled();
  });
});
