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
import { Page } from 'puppeteer';

export interface CallOfferOptions {
  isVideo?: boolean;
}

export interface IncomingCallAudioChunk {
  mimeType: string;
  data: string;
  sequence: number;
  timestamp: number;
}

export interface IncomingAudioCaptureOptions {
  timesliceMs?: number;
}

const AUDIO_CHUNK_CALLBACK = '__wppconnectIncomingCallAudioChunk';

export function normalizeCallDestination(phone: string): string {
  const trimmed = phone.trim();

  if (/^\d+@(c|lid)\.us$/.test(trimmed)) {
    return trimmed;
  }

  const digits = trimmed.replace(/\D/g, '');
  if (!digits) {
    throw new Error('Parameter phone must contain a WhatsApp number');
  }

  return `${digits}@c.us`;
}

export async function enableCallInterface(page: Page): Promise<void> {
  await page.evaluate(() =>
    (
      globalThis as typeof globalThis & { WPP: any }
    ).WPP.call.enableCallInterface()
  );
}

export async function acceptCall(
  page: Page,
  callId?: string
): Promise<boolean> {
  return page.evaluate(
    ({ callId }) =>
      (globalThis as typeof globalThis & { WPP: any }).WPP.call.accept(callId),
    { callId }
  );
}

export async function endCall(page: Page, callId?: string): Promise<boolean> {
  return page.evaluate(
    ({ callId }) =>
      (globalThis as typeof globalThis & { WPP: any }).WPP.call.end(callId),
    { callId }
  );
}

/**
 * Sends WhatsApp's call signalling offer. WA-JS does not attach or transport
 * audio/video media tracks through this method.
 */
export async function offerCall(
  page: Page,
  phone: string,
  options: CallOfferOptions = {}
): Promise<unknown> {
  const to = normalizeCallDestination(phone);
  return page.evaluate(
    ({ to, isVideo }) =>
      (globalThis as typeof globalThis & { WPP: any }).WPP.call.offer(to, {
        isVideo,
      }),
    { to, isVideo: Boolean(options.isVideo) }
  );
}

/**
 * Experimental incoming WebRTC audio capture. It must be installed before the
 * call peer connection receives its remote track.
 */
export async function installIncomingAudioCapture(
  page: Page,
  onChunk: (chunk: IncomingCallAudioChunk) => void | Promise<void>,
  options: IncomingAudioCaptureOptions = {}
): Promise<void> {
  try {
    await page.exposeFunction(AUDIO_CHUNK_CALLBACK, onChunk);
  } catch (error) {
    if (
      !(error instanceof Error) ||
      !error.message.includes('already exists')
    ) {
      throw error;
    }
  }

  const timesliceMs = Math.max(100, options.timesliceMs ?? 250);
  await page.evaluate(
    ({ callbackName, timesliceMs }) => {
      const scope = globalThis as any;
      if (scope.__wppconnectCallAudioCaptureInstalled) return;

      scope.__wppconnectCallAudioCaptureInstalled = true;
      scope.__wppconnectCallAudioCaptures = new Set<AudioContext>();
      scope.__wppconnectCallPeerConnections = new Set<RTCPeerConnection>();
      scope.__wppconnectCallAudioCaptureDiagnostics = {
        callbackErrors: [],
        dataEvents: 0,
      };
      let sequence = 0;

      const captureTrack = (track: MediaStreamTrack) => {
        if (track.kind !== 'audio') return;

        const stream = new MediaStream([track]);
        const context = new AudioContext();
        const source = context.createMediaStreamSource(stream);
        const processor = context.createScriptProcessor(2048, 1, 1);
        const silentSink = context.createGain();
        silentSink.gain.value = 0;
        const samples: number[] = [];
        const targetSamples = Math.round(
          context.sampleRate * (timesliceMs / 1000)
        );
        scope.__wppconnectCallAudioCaptures.add(context);

        processor.onaudioprocess = async (event) => {
          scope.__wppconnectCallAudioCaptureDiagnostics.dataEvents++;
          const input = event.inputBuffer.getChannelData(0);
          for (const sample of input) samples.push(sample);
          if (samples.length < targetSamples) return;

          const chunk = samples.splice(0, targetSamples);
          const pcm = new Int16Array(chunk.length);
          for (let index = 0; index < pcm.length; index++) {
            const sample = Math.max(-1, Math.min(1, chunk[index]));
            pcm[index] = sample < 0 ? sample * 32768 : sample * 32767;
          }
          const bytes = new Uint8Array(pcm.buffer);
          let binary = '';
          for (const byte of bytes) binary += String.fromCharCode(byte);
          try {
            await scope[callbackName]({
              mimeType: `audio/pcm;rate=${context.sampleRate};encoding=signed-integer;bits=16`,
              data: btoa(binary),
              sequence: sequence++,
              timestamp: Date.now(),
            });
          } catch (error) {
            scope.__wppconnectCallAudioCaptureDiagnostics.callbackErrors.push(
              String(error)
            );
          }
        };
        source.connect(processor);
        processor.connect(silentSink).connect(context.destination);
        void context.resume();
        track.addEventListener(
          'ended',
          () => {
            processor.disconnect();
            source.disconnect();
            void context.close();
            scope.__wppconnectCallAudioCaptures.delete(context);
          },
          { once: true }
        );
      };

      const originalAddTrack = RTCPeerConnection.prototype.addEventListener;
      const instrument = (connection: RTCPeerConnection) => {
        if ((connection as any).__wppconnectAudioCaptureAttached) return;
        (connection as any).__wppconnectAudioCaptureAttached = true;
        scope.__wppconnectCallPeerConnections.add(connection);
        connection.addEventListener('connectionstatechange', () => {
          if (connection.connectionState === 'closed') {
            scope.__wppconnectCallPeerConnections.delete(connection);
          }
        });
        originalAddTrack.call(connection, 'track', (event: Event) => {
          captureTrack((event as RTCTrackEvent).track);
        });
      };

      const originalSetRemoteDescription =
        RTCPeerConnection.prototype.setRemoteDescription;
      RTCPeerConnection.prototype.setRemoteDescription = function (...args) {
        instrument(this);
        return originalSetRemoteDescription.apply(this, args as any);
      };
    },
    { callbackName: AUDIO_CHUNK_CALLBACK, timesliceMs }
  );
}

export async function stopIncomingAudioCapture(page: Page): Promise<void> {
  await page.evaluate(() => {
    const scope = globalThis as any;
    const captures = scope.__wppconnectCallAudioCaptures as
      | Set<AudioContext>
      | undefined;
    captures?.forEach((context) => {
      void context.close();
    });
    captures?.clear();
  });
}

export async function stopOutgoingAudio(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const scope = globalThis as any;
    const bridge = scope.__wppconnectOutgoingAudio;
    if (!bridge) return;
    bridge.queue.length = 0;
    await bridge.context.close();
    delete scope.__wppconnectOutgoingAudio;
  });
}

export async function pushOutgoingPcm16(
  page: Page,
  base64Data: string,
  sampleRate = 48_000
): Promise<boolean> {
  if (!base64Data) throw new Error('Audio data is required');
  if (base64Data.length > 350_000) {
    throw new Error('Audio chunk exceeds the 256 KiB limit');
  }
  if (
    !Number.isFinite(sampleRate) ||
    sampleRate < 8_000 ||
    sampleRate > 48_000
  ) {
    throw new Error('sampleRate must be between 8000 and 48000');
  }

  return page.evaluate(
    async ({ base64Data, sampleRate }) => {
      const scope = globalThis as any;
      const connections = scope.__wppconnectCallPeerConnections as
        | Set<RTCPeerConnection>
        | undefined;
      const connection = connections
        ? [...connections].find(
            (item) =>
              item.connectionState !== 'closed' &&
              item.getSenders().some((sender) => sender.track?.kind === 'audio')
          )
        : undefined;
      if (!connection) return false;

      if (!scope.__wppconnectOutgoingAudio) {
        const context = new AudioContext({ sampleRate });
        const source = context.createScriptProcessor(2048, 0, 1);
        const destination = context.createMediaStreamDestination();
        const queue: number[] = [];
        let offset = 0;
        source.onaudioprocess = (event) => {
          const output = event.outputBuffer.getChannelData(0);
          for (let index = 0; index < output.length; index++) {
            output[index] = queue[offset++] ?? 0;
          }
          if (offset > 8_192) {
            queue.splice(0, offset);
            offset = 0;
          }
        };
        source.connect(destination);
        await context.resume();
        scope.__wppconnectOutgoingAudio = {
          context,
          destination,
          get offset() {
            return offset;
          },
          queue,
        };
      }

      const bridge = scope.__wppconnectOutgoingAudio;
      const binary = atob(base64Data);
      for (let index = 0; index + 1 < binary.length; index += 2) {
        const value =
          binary.charCodeAt(index) | (binary.charCodeAt(index + 1) << 8);
        bridge.queue.push((value > 32767 ? value - 65536 : value) / 32768);
      }
      const bufferedSamples = bridge.queue.length - bridge.offset;
      if (bufferedSamples > sampleRate * 5) {
        bridge.queue.splice(bridge.offset, bufferedSamples - sampleRate * 5);
      }

      const track = bridge.destination.stream.getAudioTracks()[0];
      const sender = connection
        .getSenders()
        .find((item) => item.track?.kind === 'audio');
      if (!sender) return false;
      await sender.replaceTrack(track);
      return true;
    },
    { base64Data, sampleRate }
  );
}
