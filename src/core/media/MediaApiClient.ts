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

export type MediaApiSettings = {
  baseUrl: string | null;
  apiKey: string | null;
  timeoutMs: number;
};

export type MediaJobInput = {
  sourceUrl?: string;
  filename?: string;
  mimeType?: string;
  language?: string;
  webhookUrl?: string;
};

export type MediaUpload = {
  bytes: Uint8Array;
  filename: string;
  mimeType?: string;
};

export type MediaApiResponse = {
  status: number;
  body: unknown;
};

export class MediaApiAdapterError extends Error {
  constructor(message: string, public readonly httpStatus: number) {
    super(message);
    this.name = 'MediaApiAdapterError';
  }
}

function normalizedBaseUrl(value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new MediaApiAdapterError('MEDIA_API_URL is invalid', 503);
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new MediaApiAdapterError('MEDIA_API_URL must use HTTP or HTTPS', 503);
  }
  return url.toString().replace(/\/$/, '');
}

async function responseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { error: text };
  }
}

export class MediaApiClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeoutMs: number;

  constructor(
    settings: MediaApiSettings,
    private readonly fetcher: typeof fetch = fetch
  ) {
    if (!settings.baseUrl || !settings.apiKey) {
      throw new MediaApiAdapterError(
        'Media API is not configured. Set MEDIA_API_URL and MEDIA_API_KEY.',
        503
      );
    }
    this.baseUrl = normalizedBaseUrl(settings.baseUrl);
    this.apiKey = settings.apiKey;
    this.timeoutMs =
      Number.isFinite(settings.timeoutMs) && settings.timeoutMs > 0
        ? settings.timeoutMs
        : 30000;
  }

  createConversion(
    input: MediaJobInput,
    idempotencyKey: string,
    upload?: MediaUpload
  ): Promise<MediaApiResponse> {
    return this.createJob(
      '/v1/audio/conversions',
      input,
      idempotencyKey,
      upload
    );
  }

  createTranscription(
    input: MediaJobInput,
    idempotencyKey: string,
    upload?: MediaUpload
  ): Promise<MediaApiResponse> {
    return this.createJob(
      '/v1/audio/transcriptions',
      input,
      idempotencyKey,
      upload
    );
  }

  getJob(jobId: string): Promise<MediaApiResponse> {
    return this.request(`/v1/jobs/${encodeURIComponent(jobId)}`, {
      method: 'GET',
    });
  }

  private createJob(
    path: string,
    input: MediaJobInput,
    idempotencyKey: string,
    upload?: MediaUpload
  ): Promise<MediaApiResponse> {
    const headers = new Headers({ 'idempotency-key': idempotencyKey });
    let body: BodyInit;
    if (upload) {
      const form = new FormData();
      const bytes = new ArrayBuffer(upload.bytes.byteLength);
      new Uint8Array(bytes).set(upload.bytes);
      form.append(
        'file',
        new Blob([bytes], {
          type: upload.mimeType || 'application/octet-stream',
        }),
        upload.filename
      );
      if (input.language) form.append('language', input.language);
      if (input.webhookUrl) form.append('webhookUrl', input.webhookUrl);
      body = form;
    } else {
      headers.set('content-type', 'application/json');
      body = JSON.stringify(input);
    }
    return this.request(path, { method: 'POST', headers, body });
  }

  private async request(
    path: string,
    init: RequestInit
  ): Promise<MediaApiResponse> {
    const headers = new Headers(init.headers);
    headers.set('authorization', `Bearer ${this.apiKey}`);
    try {
      const response = await this.fetcher(`${this.baseUrl}${path}`, {
        ...init,
        headers,
        signal: AbortSignal.timeout(this.timeoutMs),
      });
      return { status: response.status, body: await responseBody(response) };
    } catch (error) {
      if (error instanceof Error && error.name === 'TimeoutError') {
        throw new MediaApiAdapterError('Media API request timed out', 504);
      }
      throw new MediaApiAdapterError('Media API is unavailable', 502);
    }
  }
}
