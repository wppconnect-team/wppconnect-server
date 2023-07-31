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

import { Readable } from 'stream';

// type AsyncBufferToStream

function bufferToReadableStream(buffer: Buffer): Readable {
  const readableInstanceStream = new Readable({
    read() {
      this.push(buffer);
      this.push(null);
    },
  });

  return readableInstanceStream;
}

async function AsyncBufferToStream(buffer: Buffer): Promise<Readable> {
  return new Promise((resolve, reject) => {
    const bufferStream = bufferToReadableStream(buffer);

    let data;
    bufferStream.on('data', (chunck) => {
      // data = chunck;
    });

    bufferStream.on('end', () => {
      resolve(bufferStream);
    });

    bufferStream.on('error', (error) => {
      reject(error);
    });
  });
}

export default { bufferToReadableStream, AsyncBufferToStream };
