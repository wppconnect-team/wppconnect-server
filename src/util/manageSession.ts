/*
 * Copyright 2023 WPPConnect Team
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
import { Request } from 'express';
import fileSystem from 'fs';
import os from 'os';
import path from 'path';
import { pipeline } from 'stream/promises';
import unzipper from 'unzipper';

import { logger } from '..';
import config from '../config';
import { startAllSessions } from './functions';
import getAllTokens from './getAllTokens';
import { acquireSessionMaintenance } from './sessionMaintenance';
import { cleanupSession, clientsArray } from './sessionUtil';

async function writeBackupArchive(directory: string): Promise<string> {
  const zipPath = path.join(directory, 'sessions.zip');
  const archive = archiver('zip', { zlib: { level: 9 } });
  const output = fileSystem.createWriteStream(zipPath);
  const writing = pipeline(archive, output);
  try {
    archive.directory(path.resolve(__dirname, '../../tokens'), 'tokens');
    const profiles = path.join(directory, 'profiles');
    fileSystem.cpSync(config.customUserDataDir, profiles, {
      force: true,
      recursive: true,
    });
    archive.directory(profiles, 'userDataDir');
    await Promise.all([archive.finalize(), writing]);
    return zipPath;
  } catch (error) {
    // A synchronous copy/finalize failure must also stop and drain the streams
    // before maintenance can release admission to the profile directories.
    archive.destroy();
    output.destroy();
    await writing.catch(() => undefined);
    throw error;
  }
}

export async function backupSessions(req: Request): Promise<void> {
  const release = await acquireSessionMaintenance();
  let directory: string | undefined;
  try {
    await closeAllSessions(req);
    directory = await fileSystem.promises.mkdtemp(
      path.join(os.tmpdir(), 'wppconnect-backup-')
    );
    const zipPath = await writeBackupArchive(directory);
    await pipeline(fileSystem.createReadStream(zipPath), req.res!);
  } finally {
    try {
      if (directory)
        await fileSystem.promises.rm(directory, {
          recursive: true,
          force: true,
        });
    } finally {
      release();
    }
  }
  logger.info('Sessions successfully backed up. Restarting sessions...');
  await startAllSessions(config, logger);
}

export async function restoreSessions(
  req: Request,
  file: Express.Multer.File
): Promise<{ success: true }> {
  if (!file?.mimetype?.includes('zip')) {
    throw new Error('Please, send zipped file');
  }
  const release = await acquireSessionMaintenance();
  let directory: string | undefined;
  try {
    logger.info('Starting restore sessions...');
    await closeAllSessions(req);
    directory = await fileSystem.promises.mkdtemp(
      path.join(os.tmpdir(), 'wppconnect-restore-')
    );
    const archive = await unzipper.Open.file(file.path);
    for (const entry of archive.files) {
      const target = path.resolve(directory, entry.path.replace(/\\/g, '/'));
      const relative = path.relative(directory, target);
      // Keep the extractor's zip-slip guard, including Windows path handling.
      if (!relative || relative.startsWith('..') || path.isAbsolute(relative))
        continue;
      if (entry.type === 'Directory') {
        await fileSystem.promises.mkdir(target, { recursive: true });
      } else {
        await fileSystem.promises.mkdir(path.dirname(target), {
          recursive: true,
        });
        // Own and await each writer so errors cannot escape an async stream
        // callback or leave writes running after admission is released.
        await pipeline(entry.stream(), fileSystem.createWriteStream(target));
      }
    }
    for (const [source, destination] of [
      ['tokens', 'tokens'],
      ['userDataDir', config.customUserDataDir],
    ]) {
      const sourcePath = path.join(directory, source);
      // A backup may omit one directory, but a real copy failure must abort.
      if (fileSystem.existsSync(sourcePath)) {
        fileSystem.cpSync(sourcePath, destination, {
          force: source === 'tokens',
          recursive: true,
        });
      }
    }
  } finally {
    try {
      if (directory)
        await fileSystem.promises.rm(directory, {
          recursive: true,
          force: true,
        });
    } finally {
      release();
    }
  }
  logger.info('Sessions successfully restored. Starting...');
  await startAllSessions(config, logger);
  return { success: true };
}

export async function closeAllSessions(req: Request) {
  // Close the union of stored tokens and live runtimes: a running browser
  // may not have a stored token (yet) and must never be skipped.
  const names = await getAllTokens(req);
  if (!names) {
    // The listing itself failed, so the full set of sessions is unknown.
    // Stop here instead of letting the caller archive or overwrite the
    // profile of a session that may still be running.
    throw new Error(
      'Could not list sessions to close; refusing to continue while a session may still be running'
    );
  }
  const sessions = [
    ...new Set([...(names as string[]), ...Object.keys(clientsArray)]),
  ];
  const failed: string[] = [];
  // Close one browser at a time and wait for each: Chromium profiles do not
  // release cleanly in parallel, and every caller touches the profile
  // directories as soon as this function resolves.
  for (const session of sessions) {
    try {
      await cleanupSession(session, async (client) => {
        if (client?.status) {
          logger.info('Stopping session: ' + session);
          await client.page.browser().close();
        }
      });
    } catch (error) {
      // cleanupSession keeps the runtime or an ERROR reservation behind, so
      // a session that is still alive is never silently dropped. Record it
      // and keep closing the rest, then report: the caller must not continue.
      logger.error('Not was possible stop session: ' + session);
      failed.push(session);
    }
  }
  if (failed.length > 0) {
    throw new Error(
      'Could not stop sessions: ' +
        failed.join(', ') +
        '; refusing to continue while a session may still be running'
    );
  }
}
