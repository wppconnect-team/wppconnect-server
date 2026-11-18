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
    const client = {
      decryptFile: jest.fn().mockResolvedValue(file),
      downloadMedia: jest.fn(),
    };
    const req = {
      serverOptions: { webhook: { uploadS3: false, ...webhook } },
      logger: { error: jest.fn() },
    };
    return { client, req };
  }

  it('inlines media as base64 when no size limit is set', async () => {
    const { client, req } = setup();
    const message: any = {
      mimetype: 'video/mp4',
      size: 50_000_000,
      clientUrl: 'https://media.example.test/video',
    };

    await autoDownload(client, req, message);

    expect(client.decryptFile).toHaveBeenCalledWith(message);
    expect(client.downloadMedia).not.toHaveBeenCalled();
    expect(message.body).toBe(file.toString('base64'));
    expect(message.autoDownloadSkipped).toBeUndefined();
  });

  it('inlines media at or under autoDownloadMaxSize', async () => {
    const { client, req } = setup({ autoDownloadMaxSize: 1000 });
    const message: any = {
      mimetype: 'image/jpeg',
      size: 1000,
      deprecatedMms3Url: 'https://media.example.test/image',
    };

    await autoDownload(client, req, message);

    expect(message.body).toBe(file.toString('base64'));
  });

  it.each([false, true])(
    'downloads by message ID when media URLs are missing (fromMe=%s)',
    async (fromMe) => {
      const { client, req } = setup();
      const error = new Error(
        'message is missing critical data (`mediaUrl`) needed to download the file.'
      );
      client.decryptFile.mockRejectedValue(error);
      client.downloadMedia.mockResolvedValue(
        `data:image/jpeg;base64,${file.toString('base64')}`
      );
      const message: any = {
        id: 'media-message-id',
        type: 'image',
        mimetype: 'image/jpeg',
        fromMe,
        body: 'thumbnail',
      };

      await autoDownload(client, req, message);

      expect(req.logger.error).not.toHaveBeenCalled();
      expect(client.decryptFile).not.toHaveBeenCalled();
      expect(client.downloadMedia).toHaveBeenCalledWith(message.id);
      expect(message.body).toBe(file.toString('base64'));
    }
  );

  it('preserves the event when the WhatsApp session cannot download the media', async () => {
    const { client, req } = setup();
    const error = new Error('Media is no longer available');
    client.downloadMedia.mockRejectedValue(error);
    const message = {
      id: 'media-message-id',
      type: 'document',
      mimetype: 'application/pdf',
      body: 'original body',
    };

    await autoDownload(client, req, message);

    expect(req.logger.error).toHaveBeenCalledWith(error);
    expect(message.body).toBe('original body');
  });

  it('preserves the event when no media URL or message ID is present', async () => {
    const { client, req } = setup();
    const message = { mimetype: 'image/png', body: 'thumbnail' };

    await autoDownload(client, req, message);

    expect(client.decryptFile).not.toHaveBeenCalled();
    expect(client.downloadMedia).not.toHaveBeenCalled();
    expect(req.logger.error).toHaveBeenCalledWith(
      new Error('Cannot download media without a URL or message ID.')
    );
    expect(message.body).toBe('thumbnail');
  });

  it('preserves the event when the browser returns empty media', async () => {
    const { client, req } = setup();
    client.downloadMedia.mockResolvedValue('data:image/png;base64,');
    const message = {
      id: 'media-message-id',
      mimetype: 'image/png',
      body: 'thumbnail',
    };

    await autoDownload(client, req, message);

    expect(req.logger.error).toHaveBeenCalledWith(
      new Error('The WhatsApp session returned no media data.')
    );
    expect(message.body).toBe('thumbnail');
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
    expect(client.downloadMedia).not.toHaveBeenCalled();
    expect(message.body).toBe('thumbnail');
    expect(message.autoDownloadSkipped).toBe(true);
  });
});
