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

import { Request, Response } from 'express';
import { constants } from 'fs';
import { lstat, open, unlink } from 'fs/promises';
import path from 'path';

import { UPLOAD_DIRECTORY } from '../config/upload';
import {
  MediaApiAdapterError,
  MediaApiClient,
  MediaApiResponse,
  MediaJobInput,
  MediaUpload,
} from '../core/media/MediaApiClient';

function idempotencyKey(req: Request): string {
  const value = req.headers['idempotency-key'];
  return Array.isArray(value) ? value[0] || '' : value || '';
}

function input(req: Request): MediaJobInput {
  const source = req.body || {};
  return {
    ...(typeof source.sourceUrl === 'string'
      ? { sourceUrl: source.sourceUrl }
      : {}),
    ...(typeof source.filename === 'string'
      ? { filename: source.filename }
      : {}),
    ...(typeof source.mimeType === 'string'
      ? { mimeType: source.mimeType }
      : {}),
    ...(typeof source.language === 'string'
      ? { language: source.language }
      : {}),
    ...(typeof source.webhookUrl === 'string'
      ? { webhookUrl: source.webhookUrl }
      : {}),
  };
}

type TemporaryUpload = { media: MediaUpload; cleanup: () => Promise<void> };

function invalidUpload(): MediaApiAdapterError {
  return new MediaApiAdapterError('Invalid temporary media upload', 400);
}

async function upload(req: Request): Promise<TemporaryUpload | undefined> {
  if (!req.file) return undefined;
  const file = req.file;
  if (typeof file.filename !== 'string' || typeof file.path !== 'string') {
    throw invalidUpload();
  }
  const basename = path.basename(file.filename);
  if (
    basename !== file.filename ||
    !/^wppConnect-[a-f0-9]{32}(?:\.[A-Za-z0-9]{1,10})?$/.test(basename)
  ) {
    throw invalidUpload();
  }
  // Reconstruct from trusted configuration and a basename, rather than using
  // request-derived paths for either the read or the later deletion.
  const temporaryPath = path.join(UPLOAD_DIRECTORY, path.basename(basename));
  if (path.resolve(file.path) !== temporaryPath) throw invalidUpload();
  const directory = await lstat(UPLOAD_DIRECTORY);
  const original = await lstat(temporaryPath);
  if (
    !directory.isDirectory() ||
    directory.isSymbolicLink() ||
    !original.isFile() ||
    original.isSymbolicLink() ||
    original.nlink !== 1
  ) {
    throw invalidUpload();
  }
  const cleanup = async () => {
    const currentDirectory = await lstat(UPLOAD_DIRECTORY);
    const current = await lstat(temporaryPath);
    if (
      currentDirectory.isDirectory() &&
      !currentDirectory.isSymbolicLink() &&
      currentDirectory.dev === directory.dev &&
      currentDirectory.ino === directory.ino &&
      current.isFile() &&
      !current.isSymbolicLink() &&
      current.dev === original.dev &&
      current.ino === original.ino
    ) {
      await unlink(temporaryPath);
    }
  };
  const handle = await open(
    temporaryPath,
    constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0)
  );
  try {
    const opened = await handle.stat();
    if (
      !opened.isFile() ||
      opened.dev !== original.dev ||
      opened.ino !== original.ino
    ) {
      throw invalidUpload();
    }
    return {
      media: {
        bytes: new Uint8Array(await handle.readFile()),
        filename: file.originalname,
        mimeType: file.mimetype,
      },
      cleanup,
    };
  } catch (error) {
    await handle.close();
    await cleanup().catch(() => undefined);
    throw error;
  } finally {
    await handle.close();
  }
}

function client(req: Request): MediaApiClient {
  return new MediaApiClient(req.serverOptions.mediaApi);
}

function reply(res: Response, result: MediaApiResponse) {
  return res.status(result.status).json(result.body);
}

function replyError(req: Request, res: Response, error: unknown) {
  if (error instanceof MediaApiAdapterError) {
    return res.status(error.httpStatus).json({
      status: 'error',
      message: error.message,
    });
  }
  req.logger.error(error);
  return res.status(500).json({
    status: 'error',
    message: 'Unexpected Media API adapter error',
  });
}

async function createJob(
  req: Request,
  res: Response,
  kind: 'conversion' | 'transcription'
) {
  let temporaryUpload: TemporaryUpload | undefined;
  try {
    temporaryUpload = await upload(req);
    const mediaClient = client(req);
    const mediaUpload = temporaryUpload?.media;
    const result =
      kind === 'conversion'
        ? await mediaClient.createConversion(
            input(req),
            idempotencyKey(req),
            mediaUpload
          )
        : await mediaClient.createTranscription(
            input(req),
            idempotencyKey(req),
            mediaUpload
          );
    return reply(res, result);
  } catch (error) {
    return replyError(req, res, error);
  } finally {
    await temporaryUpload?.cleanup().catch(() => undefined);
  }
}

export function createConversion(req: Request, res: Response) {
  return createJob(req, res, 'conversion');
}

export function createTranscription(req: Request, res: Response) {
  return createJob(req, res, 'transcription');
}

export async function getJob(req: Request, res: Response) {
  try {
    return reply(res, await client(req).getJob(req.params.jobId));
  } catch (error) {
    return replyError(req, res, error);
  }
}
