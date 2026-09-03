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

import {
  MediaApiAdapterError,
  MediaApiClient,
} from '../../core/media/MediaApiClient';

const settings = {
  baseUrl: 'https://media.example.test/',
  apiKey: 'media-secret',
  timeoutMs: 5000,
};

describe('MediaApiClient', () => {
  it('requires an explicitly configured service and key', () => {
    expect(
      () => new MediaApiClient({ baseUrl: null, apiKey: null, timeoutMs: 5000 })
    ).toThrow(
      new MediaApiAdapterError(
        'Media API is not configured. Set MEDIA_API_URL and MEDIA_API_KEY.',
        503
      )
    );
  });

  it('forwards JSON conversion jobs with isolated upstream credentials', async () => {
    const fetcher = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: { id: 'job-1' } }), {
        status: 202,
        headers: { 'content-type': 'application/json' },
      })
    );
    const client = new MediaApiClient(settings, fetcher);

    const result = await client.createConversion(
      { sourceUrl: 'https://cdn.example.test/audio.mp3' },
      'conversion-1234'
    );

    expect(result).toEqual({ status: 202, body: { data: { id: 'job-1' } } });
    expect(fetcher).toHaveBeenCalledTimes(1);
    const [url, init] = fetcher.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://media.example.test/v1/audio/conversions');
    expect(new Headers(init.headers).get('authorization')).toBe(
      'Bearer media-secret'
    );
    expect(new Headers(init.headers).get('idempotency-key')).toBe(
      'conversion-1234'
    );
    expect(init.body).toBe(
      JSON.stringify({ sourceUrl: 'https://cdn.example.test/audio.mp3' })
    );
  });

  it('forwards multipart transcription uploads without setting the boundary', async () => {
    const fetcher = jest
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ data: { id: 'job-2' } }), { status: 202 })
      );
    const client = new MediaApiClient(settings, fetcher);

    await client.createTranscription(
      { language: 'pt', webhookUrl: 'https://hooks.example.test/media' },
      'transcription-1234',
      {
        bytes: new Uint8Array([1, 2, 3]),
        filename: 'voice.ogg',
        mimeType: 'audio/ogg',
      }
    );

    const init = fetcher.mock.calls[0][1] as RequestInit;
    const headers = new Headers(init.headers);
    expect(headers.has('content-type')).toBe(false);
    expect(init.body).toBeInstanceOf(FormData);
    const form = init.body as FormData;
    expect(form.get('language')).toBe('pt');
    expect(form.get('webhookUrl')).toBe('https://hooks.example.test/media');
    const file = form.get('file') as File;
    expect(file.name).toBe('voice.ogg');
    expect(file.type).toBe('audio/ogg');
    expect(file.size).toBe(3);
  });

  it('encodes job ids and preserves upstream errors', async () => {
    const fetcher = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: 'Job not found' }), {
        status: 404,
      })
    );
    const client = new MediaApiClient(settings, fetcher);

    const result = await client.getJob('job/unsafe');

    expect(fetcher.mock.calls[0][0]).toBe(
      'https://media.example.test/v1/jobs/job%2Funsafe'
    );
    expect(result).toEqual({ status: 404, body: { error: 'Job not found' } });
  });

  it('maps transport failures to a safe gateway error', async () => {
    const client = new MediaApiClient(
      settings,
      jest.fn().mockRejectedValue(new Error('socket details'))
    );

    await expect(client.getJob('job-1')).rejects.toEqual(
      new MediaApiAdapterError('Media API is unavailable', 502)
    );
  });

  it('distinguishes upstream timeouts from other transport failures', async () => {
    const timeout = new Error('deadline exceeded');
    timeout.name = 'TimeoutError';
    const client = new MediaApiClient(
      settings,
      jest.fn().mockRejectedValue(timeout)
    );

    await expect(client.getJob('job-1')).rejects.toEqual(
      new MediaApiAdapterError('Media API request timed out', 504)
    );
  });
});
