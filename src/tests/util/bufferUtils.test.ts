import { Readable } from 'stream';

import bufferUtils from '../../util/bufferutils';

function generateRandomData(length: number): string {
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let randomData = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomData += characters.charAt(randomIndex);
  }
  return randomData;
}

describe('Utils Functions', function () {
  describe('Buffer to Stream', function () {
    const bodyToBuffer = generateRandomData(100);
    const buffer = Buffer.from(bodyToBuffer, 'utf-8');

    it('Should transform the Buffer in a Readable Stream', function () {
      const bufferStream = bufferUtils.bufferToReadableStream(buffer);

      // Assert that the bufferStream is a Readable stream
      expect(bufferStream).toBeInstanceOf(Readable);
    });

    it('Should, on data end, checks if the Stream are correct', function () {
      const bufferStream = bufferUtils.bufferToReadableStream(buffer);

      let data = '';

      bufferStream.on('data', (chunck) => {
        data += chunck.toString('utf-8');
      });

      bufferStream.on('end', () => {
        expect(data).toStrictEqual(bodyToBuffer);
      });
    });
  });

  describe('Async Buffer to Stream', function () {
    const bodyToBuffer = generateRandomData(10000000);
    const buffer = Buffer.from(bodyToBuffer, 'utf-8');

    it('Should await the Buffer convertion and return a instance of readable', async function () {
      const bufferStream = await bufferUtils.AsyncBufferToStream(buffer);

      expect(bufferStream).toBeInstanceOf(Readable);
    });
  });
});
