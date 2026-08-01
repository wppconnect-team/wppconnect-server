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
