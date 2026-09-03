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

import type { Request, Response } from 'express';

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

  afterEach(() => {
    global.fetch = originalFetch;
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
});
