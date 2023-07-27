import { Readable } from 'stream';

export function bufferToReadableStream(buffer: Buffer): Readable {
  const readableInstanceStream = new Readable({
    read() {
      this.push(buffer);
      this.push(null);
    },
  });

  return readableInstanceStream;
}

export async function AsyncBufferToStream(buffer: Buffer): Promise<Readable> {
  return new Promise((resolve, reject) => {
    const bufferStream = bufferToReadableStream(buffer);

    resolve(bufferStream);

    bufferStream.on('error', (error) => {
      reject(error);
    });
  });
}
