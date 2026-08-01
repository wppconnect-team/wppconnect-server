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
      scope.__wppconnectCallAudioRecorders = new Set<MediaRecorder>();
      let sequence = 0;

      const captureTrack = (track: MediaStreamTrack) => {
        if (track.kind !== 'audio' || typeof MediaRecorder === 'undefined') {
          return;
        }

        const stream = new MediaStream([track]);
        const recorder = new MediaRecorder(stream);
        scope.__wppconnectCallAudioRecorders.add(recorder);

        recorder.addEventListener('dataavailable', async (event) => {
          if (!event.data.size) return;
          const bytes = new Uint8Array(await event.data.arrayBuffer());
          let binary = '';
          for (const byte of bytes) binary += String.fromCharCode(byte);
          await scope[callbackName]({
            mimeType: recorder.mimeType || event.data.type,
            data: btoa(binary),
            sequence: sequence++,
            timestamp: Date.now(),
          });
        });
        recorder.addEventListener('stop', () => {
          scope.__wppconnectCallAudioRecorders.delete(recorder);
        });
        track.addEventListener('ended', () => recorder.stop(), { once: true });
        recorder.start(timesliceMs);
      };

      const originalAddTrack = RTCPeerConnection.prototype.addEventListener;
      const instrument = (connection: RTCPeerConnection) => {
        if ((connection as any).__wppconnectAudioCaptureAttached) return;
        (connection as any).__wppconnectAudioCaptureAttached = true;
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
    const recorders = scope.__wppconnectCallAudioRecorders as
      | Set<MediaRecorder>
      | undefined;
    recorders?.forEach((recorder) => {
      if (recorder.state !== 'inactive') recorder.stop();
    });
  });
}
