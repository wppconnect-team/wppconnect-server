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
import { autoDownload } from '../../util/functions';

describe('autoDownload', function () {
  const file = Buffer.from('media-bytes');

  function setup(webhook: Record<string, unknown> = {}) {
    const client = { decryptFile: jest.fn().mockResolvedValue(file) };
    const req = {
      serverOptions: { webhook: { uploadS3: false, ...webhook } },
      logger: { error: jest.fn() },
    };
    return { client, req };
  }

  it('inlines media as base64 when no size limit is set', async () => {
    const { client, req } = setup();
    const message: any = { mimetype: 'video/mp4', size: 50_000_000 };

    await autoDownload(client, req, message);

    expect(client.decryptFile).toHaveBeenCalledWith(message);
    expect(message.body).toBe(file.toString('base64'));
    expect(message.autoDownloadSkipped).toBeUndefined();
  });

  it('inlines media at or under autoDownloadMaxSize', async () => {
    const { client, req } = setup({ autoDownloadMaxSize: 1000 });
    const message: any = { mimetype: 'image/jpeg', size: 1000 };

    await autoDownload(client, req, message);

    expect(message.body).toBe(file.toString('base64'));
  });

  it('skips media over autoDownloadMaxSize without decrypting it', async () => {
    const { client, req } = setup({ autoDownloadMaxSize: 1000 });
    const message: any = {
      mimetype: 'video/mp4',
      size: 1001,
      body: 'thumbnail',
    };

    await autoDownload(client, req, message);

    expect(client.decryptFile).not.toHaveBeenCalled();
    expect(message.body).toBe('thumbnail');
    expect(message.autoDownloadSkipped).toBe(true);
  });
});
