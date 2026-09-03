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
import { readFile } from 'fs/promises';

import {
  MediaApiAdapterError,
  MediaApiClient,
  MediaApiResponse,
  MediaJobInput,
  MediaUpload,
} from '../core/media/MediaApiClient';
import { unlinkAsync } from '../util/functions';

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

async function upload(req: Request): Promise<MediaUpload | undefined> {
  if (!req.file) return undefined;
  return {
    bytes: new Uint8Array(await readFile(req.file.path)),
    filename: req.file.originalname,
    mimeType: req.file.mimetype,
  };
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
  try {
    const mediaClient = client(req);
    const mediaUpload = await upload(req);
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
    if (req.file?.path) await unlinkAsync(req.file.path).catch(() => undefined);
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
