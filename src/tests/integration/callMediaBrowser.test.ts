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
import { existsSync } from 'fs';
import puppeteer from 'puppeteer';

import {
  IncomingCallAudioChunk,
  installIncomingAudioCapture,
  pushOutgoingPcm16,
} from '../../util/callUtil';

const chromePath = puppeteer.executablePath();
const browserTest = existsSync(chromePath) ? it : it.skip;

describe('Call media browser bridge', () => {
  browserTest(
    'captures a remote track and replaces an outgoing audio sender',
    async () => {
      const browser = await puppeteer.launch({
        executablePath: chromePath,
        headless: true,
        args: ['--autoplay-policy=no-user-gesture-required', '--no-sandbox'],
      });

      try {
        const page = await browser.newPage();
        const chunks: IncomingCallAudioChunk[] = [];
        await installIncomingAudioCapture(page, (chunk) => {
          chunks.push(chunk);
        });

        await page.evaluate(async () => {
          const caller = new RTCPeerConnection();
          const receiver = new RTCPeerConnection();
          const callerContext = new AudioContext();
          await callerContext.resume();
          const callerTone = callerContext.createOscillator();
          const callerDestination =
            callerContext.createMediaStreamDestination();
          callerTone.connect(callerDestination);
          const callerSink = callerContext.createGain();
          callerSink.gain.value = 0;
          callerTone.connect(callerSink).connect(callerContext.destination);
          callerTone.start();
          caller.addTrack(callerDestination.stream.getAudioTracks()[0]);

          const receiverContext = new AudioContext();
          await receiverContext.resume();
          const receiverTone = receiverContext.createOscillator();
          const receiverDestination =
            receiverContext.createMediaStreamDestination();
          receiverTone.connect(receiverDestination);
          const receiverSink = receiverContext.createGain();
          receiverSink.gain.value = 0;
          receiverTone
            .connect(receiverSink)
            .connect(receiverContext.destination);
          receiverTone.start();
          receiver.addTrack(receiverDestination.stream.getAudioTracks()[0]);

          caller.onicecandidate = ({ candidate }) => {
            if (candidate) void receiver.addIceCandidate(candidate);
          };
          receiver.onicecandidate = ({ candidate }) => {
            if (candidate) void caller.addIceCandidate(candidate);
          };

          await caller.setLocalDescription(await caller.createOffer());
          await receiver.setRemoteDescription(caller.localDescription!);
          await receiver.setLocalDescription(await receiver.createAnswer());
          await caller.setRemoteDescription(receiver.localDescription!);

          (globalThis as any).__callMediaTest = {
            caller,
            callerContext,
            callerTone,
            receiver,
            receiverContext,
            receiverTone,
          };
        });

        const baseline = await page.evaluate(async () => {
          const test = (globalThis as any).__callMediaTest;
          test.receiverTone.stop();
          await new Promise((resolve) => setTimeout(resolve, 200));
          const report = await test.caller.getReceivers()[0].getStats();
          const inbound = [...report.values()].find(
            (entry: any) =>
              entry.type === 'inbound-rtp' && entry.kind === 'audio'
          );
          return {
            bytesReceived: inbound?.bytesReceived || 0,
          };
        });
        const sampleRate = 16_000;
        const tone = Buffer.alloc(sampleRate * 2);
        for (let index = 0; index < sampleRate; index++) {
          tone.writeInt16LE(
            Math.round(
              Math.sin((2 * Math.PI * 440 * index) / sampleRate) * 12_000
            ),
            index * 2
          );
        }
        await expect(
          pushOutgoingPcm16(page, tone.toString('base64'), sampleRate)
        ).resolves.toBe(true);
        await new Promise((resolve) => setTimeout(resolve, 800));
        const afterInjection = await page.evaluate(async () => {
          const test = (globalThis as any).__callMediaTest;
          const report = await test.caller.getReceivers()[0].getStats();
          const inbound = [...report.values()].find(
            (entry: any) =>
              entry.type === 'inbound-rtp' && entry.kind === 'audio'
          );
          return {
            bytesReceived: inbound?.bytesReceived || 0,
            framesWritten: (globalThis as any).__wppconnectOutgoingAudio
              ?.framesWritten,
            lastPeak:
              (globalThis as any).__wppconnectOutgoingAudio?.lastPeak || 0,
          };
        });
        expect(afterInjection.bytesReceived).toBeGreaterThan(
          baseline.bytesReceived
        );
        expect(afterInjection.framesWritten).toBe(sampleRate);
        expect(afterInjection.lastPeak).toBeGreaterThan(0);

        const deadline = Date.now() + 10_000;
        while (!chunks.length && Date.now() < deadline) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
        if (!chunks.length) {
          const diagnostics = await page.evaluate(() => {
            const scope = globalThis as any;
            return {
              capture:
                scope.__wppconnectCallAudioCaptureDiagnostics || undefined,
              connections: [
                ...(scope.__wppconnectCallPeerConnections || []),
              ].map((connection: RTCPeerConnection) => ({
                connectionState: connection.connectionState,
                receivers: connection.getReceivers().map((receiver) => ({
                  kind: receiver.track.kind,
                  muted: receiver.track.muted,
                  readyState: receiver.track.readyState,
                })),
              })),
              captures: [...(scope.__wppconnectCallAudioCaptures || [])].map(
                (context: AudioContext) => ({
                  sampleRate: context.sampleRate,
                  state: context.state,
                })
              ),
            };
          });
          throw new Error(
            `No audio chunks produced: ${JSON.stringify(diagnostics)}`
          );
        }
        expect(chunks.length).toBeGreaterThan(0);
        expect(chunks[0].data.length).toBeGreaterThan(0);
        expect(chunks[0].mimeType).toContain('audio');
      } finally {
        await browser.close();
      }
    },
    30_000
  );
});
