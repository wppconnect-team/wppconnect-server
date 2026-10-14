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
import unzipper from 'unzipper';

import { logger } from '..';
import config from '../config';
import { startAllSessions } from './functions';
import getAllTokens from './getAllTokens';
import { cleanupSession, clientsArray } from './sessionUtil';

export function backupSessions(req: Request): Promise<any> {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve, reject) => {
    try {
      await closeAllSessions(req);
    } catch (error) {
      // Teardown could not be confirmed, so no profile may be archived:
      // reject before any filesystem work instead of snapshotting live files.
      req.logger.error(error);
      reject(error);
      return;
    }
    const output = fileSystem.createWriteStream(
      __dirname + '/../backupSessions.zip'
    );
    const archive = archiver('zip', {
      zlib: { level: 9 }, // Sets the compression level.
    });
    archive.on('error', function (err) {
      reject(err);
      req.logger.error(err);
    });
    archive.pipe(output);
    archive.directory(__dirname + '/../../tokens', 'tokens');
    fileSystem.cpSync(
      config.customUserDataDir,
      __dirname + '/../../backupFolder',
      { force: true, recursive: true }
    );

    archive.directory(__dirname + '/../../backupFolder', 'userDataDir');
    archive.finalize();

    output.on('close', () => {
      fileSystem.rmSync(__dirname + '/../../backupFolder', { recursive: true });
      const myStream = fileSystem.createReadStream(
        __dirname + '/../backupSessions.zip'
      );
      myStream.pipe(req.res as any);
      myStream.on('end', () => {
        logger.info('Sessions successfully backuped. Restarting sessions...');
        startAllSessions(config, logger);
        req.res?.end();
      });
      myStream.on('error', function (err: any) {
        req.logger.error(err);
        reject(err);
      });
    });
  });
}

export async function restoreSessions(
  req: Request,
  file: Express.Multer.File
): Promise<any> {
  if (!file?.mimetype?.includes('zip')) {
    throw new Error('Please, send zipped file');
  }
  const path = file.path;
  logger.info('Starting restore sessions...');
  // A throw here aborts before any archive bytes are extracted or copied: a
  // running browser could otherwise write its own tokens back over the
  // restored ones.
  await closeAllSessions(req);

  const extract = fileSystem
    .createReadStream(path)
    .pipe(unzipper.Extract({ path: './restore' }));
  extract.on('close', () => {
    try {
      fileSystem.cpSync(__dirname + '/../../restore/tokens', 'tokens', {
        force: true,
        recursive: true,
      });
    } catch (error) {
      logger.info("Folder 'tokens' not found.");
    }
    try {
      fileSystem.cpSync(
        __dirname + '/../../restore/userDataDir',
        config.customUserDataDir,
        {
          force: false,
          recursive: true,
        }
      );
    } catch (error) {
      logger.info("Folder 'userDataDir' not found.");
    }
    logger.info('Sessions successfully restored. Starting...');
    startAllSessions(config, logger);
  });

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
