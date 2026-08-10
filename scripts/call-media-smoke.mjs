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
import { createWriteStream, readFileSync } from 'node:fs';
import { io } from 'socket.io-client';

const baseUrl = process.env.WPP_URL?.replace(/\/$/, '');
const session = process.env.WPP_SESSION;
const token = process.env.WPP_TOKEN;
const action = process.env.CALL_MEDIA_ACTION || 'bridge';
const callId = process.env.WPP_CALL_ID;

if (!baseUrl || !session || !token) {
  throw new Error('WPP_URL, WPP_SESSION and WPP_TOKEN are required');
}

async function post(endpoint, body = {}) {
  const response = await fetch(`${baseUrl}/api/${session}/${endpoint}`, {
    body: JSON.stringify(body),
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(
      `${endpoint} failed (${response.status}): ${payload.message}`
    );
  }
  return payload;
}

if (action === 'prepare') {
  await post('enable-call-interface');
  console.log('Call interface and media instrumentation are ready.');
  process.exit(0);
}

if (!callId) throw new Error('WPP_CALL_ID is required for bridge mode');

await post('start-incoming-call-audio', {
  callId,
  timesliceMs: Number(process.env.CALL_MEDIA_TIMESLICE_MS || 250),
});
const ticketResponse = await post('call-media-ticket', { callId });
const ticket = ticketResponse.response.ticket;
const socket = io(`${baseUrl}/call-media`, {
  auth: { ticket },
  reconnection: false,
  transports: ['websocket'],
});

const output = process.env.INCOMING_PCM16_FILE
  ? createWriteStream(process.env.INCOMING_PCM16_FILE)
  : undefined;
let incomingBytes = 0;
let incomingChunks = 0;

socket.on('incoming-audio', (chunk) => {
  if (chunk.callId !== callId) return;
  const bytes = Buffer.from(chunk.data, 'base64');
  incomingBytes += bytes.length;
  incomingChunks++;
  output?.write(bytes);
  if (incomingChunks % 20 === 0) {
    console.log(
      `incoming callId=${callId} chunks=${incomingChunks} bytes=${incomingBytes} ${chunk.mimeType}`
    );
  }
});

socket.on('connect_error', (error) => {
  console.error(`Media connection failed: ${error.message}`);
  process.exitCode = 1;
});

socket.on('connect', () => {
  console.log(`Media connected for callId=${callId}`);
  const filename = process.env.OUTGOING_PCM16_FILE;
  if (!filename) return;

  const sampleRate = Number(process.env.OUTGOING_SAMPLE_RATE || 24_000);
  const audio = readFileSync(filename);
  const bytesPer20Ms = Math.round((sampleRate * 2) / 50);
  let offset = 0;
  const timer = setInterval(() => {
    if (!socket.connected || offset >= audio.length) {
      clearInterval(timer);
      return;
    }
    const data = audio.subarray(offset, offset + bytesPer20Ms);
    offset += data.length;
    socket.emit(
      'outgoing-audio',
      { data: data.toString('base64'), sampleRate },
      (acknowledgement) => {
        if (!acknowledgement?.attached) {
          console.error(
            `Outgoing audio was not attached: ${
              acknowledgement?.error || 'no active audio sender'
            }`
          );
        }
      }
    );
  }, 20);
});

async function shutdown() {
  socket.close();
  output?.end();
  try {
    await post('stop-call-media');
  } finally {
    console.log(
      `Media stopped callId=${callId} chunks=${incomingChunks} bytes=${incomingBytes}`
    );
  }
}

process.once('SIGINT', () => void shutdown().finally(() => process.exit()));
process.once('SIGTERM', () => void shutdown().finally(() => process.exit()));
