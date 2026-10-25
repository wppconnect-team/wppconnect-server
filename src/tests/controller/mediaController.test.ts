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

import { randomBytes } from 'crypto';
import type { Request, RequestHandler, Response } from 'express';
import express from 'express';
import {
  link,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  unlink,
  writeFile,
} from 'fs/promises';
import os from 'os';
import path from 'path';

import uploads, { UPLOAD_DIRECTORY } from '../../config/upload';
import { createConversion, getJob } from '../../controller/mediaController';

function response() {
  const res = {
    status: jest.fn(),
    json: jest.fn(),
  } as unknown as Response;
  (res.status as jest.Mock).mockReturnValue(res);
  return res;
}

function request(overrides: Partial<Request> = {}) {
  return {
    body: {},
    headers: {},
    params: { jobId: 'job-1' },
    logger: { error: jest.fn() },
    serverOptions: {
      mediaApi: {
        baseUrl: 'https://media.example.test',
        apiKey: 'upstream-secret',
        timeoutMs: 5000,
      },
    },
    ...overrides,
  } as unknown as Request;
}

describe('media controller', () => {
  const originalFetch = global.fetch;
  const created: string[] = [];

  async function temporaryFile(directory: string, contents = 'private audio') {
    const filename = `wppConnect-${randomBytes(16).toString('hex')}.mp3`;
    const filePath = path.join(directory, filename);
    await writeFile(filePath, contents);
    created.push(filePath);
    return {
      filename,
      path: filePath,
      originalname: 'voice.mp3',
      mimetype: 'audio/mpeg',
    } as Express.Multer.File;
  }

  beforeAll(async () => {
    await mkdir(UPLOAD_DIRECTORY, { recursive: true });
  });

  afterEach(async () => {
    global.fetch = originalFetch;
    for (const filePath of created.splice(0))
      await rm(filePath, { force: true });
    jest.restoreAllMocks();
  });

  it('forwards job creation status and body', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ duplicate: false, data: { id: 'job-1' } }),
        {
          status: 202,
        }
      )
    );
    const req = request({
      body: { sourceUrl: 'https://cdn.example.test/voice.mp3' },
      headers: { 'idempotency-key': 'controller-smoke-1' },
    });
    const res = response();

    await createConversion(req, res);

    expect(res.status).toHaveBeenCalledWith(202);
    expect(res.json).toHaveBeenCalledWith({
      duplicate: false,
      data: { id: 'job-1' },
    });
  });

  it('returns a clear disabled response when the adapter is not configured', async () => {
    const req = request({
      serverOptions: {
        mediaApi: { baseUrl: null, apiKey: null, timeoutMs: 5000 },
      } as Request['serverOptions'],
    });
    const res = response();

    await getJob(req, res);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message:
        'Media API is not configured. Set MEDIA_API_URL and MEDIA_API_KEY.',
    });
  });

  it.each(['foreign path', 'traversal basename'])(
    'rejects %s without reading or deleting the foreign file',
    async (kind) => {
      const foreignDirectory = await mkdtemp(
        path.join(os.tmpdir(), 'wpp-media-foreign-')
      );
      const file = await temporaryFile(foreignDirectory, 'must remain private');
      if (kind === 'traversal basename') file.filename = `../${file.filename}`;
      global.fetch = jest.fn();
      const res = response();
      try {
        await createConversion(request({ file }), res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(global.fetch).not.toHaveBeenCalled();
        expect(await readFile(file.path, 'utf8')).toBe('must remain private');
      } finally {
        await rm(foreignDirectory, { recursive: true, force: true });
      }
    }
  );

  it('rejects a hardlink to a foreign file without reading or deleting either file', async () => {
    const foreignDirectory = await mkdtemp(
      path.join(os.tmpdir(), 'wpp-media-link-')
    );
    const foreign = await temporaryFile(foreignDirectory, 'foreign audio');
    const localPath = path.join(UPLOAD_DIRECTORY, foreign.filename);
    await link(foreign.path, localPath);
    created.push(localPath);
    global.fetch = jest.fn();
    const res = response();
    try {
      await createConversion(
        request({ file: { ...foreign, path: localPath } }),
        res
      );
      expect(res.status).toHaveBeenCalledWith(400);
      expect(global.fetch).not.toHaveBeenCalled();
      expect(await readFile(foreign.path, 'utf8')).toBe('foreign audio');
      expect(await readFile(localPath, 'utf8')).toBe('foreign audio');
    } finally {
      await rm(foreignDirectory, { recursive: true, force: true });
    }
  });

  it('rejects a symlink upload without reading or deleting its target', async () => {
    const foreignDirectory = await mkdtemp(
      path.join(os.tmpdir(), 'wpp-media-symlink-')
    );
    const foreign = await temporaryFile(foreignDirectory, 'foreign audio');
    const localPath = path.join(UPLOAD_DIRECTORY, foreign.filename);
    try {
      await symlink(foreign.path, localPath, 'file');
      created.push(localPath);
      global.fetch = jest.fn();
      const res = response();
      await createConversion(
        request({ file: { ...foreign, path: localPath } }),
        res
      );
      expect(res.status).toHaveBeenCalledWith(400);
      expect(global.fetch).not.toHaveBeenCalled();
      expect(await readFile(foreign.path, 'utf8')).toBe('foreign audio');
    } finally {
      await rm(foreignDirectory, { recursive: true, force: true });
    }
  });

  it('forwards a real multipart upload and cleans its generated temporary file', async () => {
    const app = express();
    let uploaded: Express.Multer.File | undefined;
    let finish!: () => void;
    const completed = new Promise<void>((resolve) => {
      finish = resolve;
    });
    app.post(
      '/upload',
      uploads.single('file') as unknown as RequestHandler,
      (req, res) => {
        uploaded = req.file;
        Object.assign(req, {
          serverOptions: request().serverOptions,
          logger: { error: jest.fn() },
        });
        void createConversion(req, res).finally(finish);
      }
    );
    const server = app.listen(0, '127.0.0.1');
    await new Promise<void>((resolve) => server.once('listening', resolve));
    global.fetch = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: { id: 'uploaded' } }), {
        status: 202,
      })
    );
    try {
      const form = new FormData();
      form.append(
        'file',
        new Blob(['actual audio bytes'], { type: 'audio/mpeg' }),
        'voice.mp3'
      );
      const address = server.address() as { port: number };
      const result = await originalFetch(
        `http://127.0.0.1:${address.port}/upload`,
        { method: 'POST', body: form }
      );
      await completed;
      expect(result.status).toBe(202);
      expect(uploaded?.filename).toMatch(/^wppConnect-[a-f0-9]{32}\.mp3$/);
      expect(uploaded?.originalname).toBe('voice.mp3');
      const upstream = (global.fetch as jest.Mock).mock.calls[0][1]
        .body as FormData;
      const media = upstream.get('file') as File;
      expect(await media.text()).toBe('actual audio bytes');
      expect(media.name).toBe('voice.mp3');
      const savedPath = path.join(
        UPLOAD_DIRECTORY,
        path.basename(uploaded!.filename)
      );
      await expect(readFile(savedPath)).rejects.toMatchObject({
        code: 'ENOENT',
      });
    } finally {
      if (uploaded) {
        const savedPath = path.join(
          UPLOAD_DIRECTORY,
          path.basename(uploaded.filename)
        );
        await unlink(savedPath).catch(() => undefined);
      }
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve()))
      );
    }
  });

  it('cleans an accepted upload when the Media API is disabled', async () => {
    const file = await temporaryFile(UPLOAD_DIRECTORY);
    const res = response();
    await createConversion(
      request({
        file,
        serverOptions: {
          mediaApi: { baseUrl: null, apiKey: null, timeoutMs: 5000 },
        } as Request['serverOptions'],
      }),
      res
    );
    expect(res.status).toHaveBeenCalledWith(503);
    await expect(readFile(file.path)).rejects.toMatchObject({ code: 'ENOENT' });
  });
});
