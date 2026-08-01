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

import {
  acceptCall,
  enableCallInterface,
  endCall,
  installIncomingAudioCapture,
  normalizeCallDestination,
  offerCall,
  stopIncomingAudioCapture,
} from '../../util/callUtil';

function mockPage(result: unknown = true) {
  return {
    evaluate: jest.fn().mockResolvedValue(result),
  } as unknown as Page;
}

describe('Call utilities', () => {
  it('normalizes a phone number as a WhatsApp user id', () => {
    expect(normalizeCallDestination('+55 (34) 99957-7020')).toBe(
      '5534999577020@c.us'
    );
    expect(normalizeCallDestination('123@lid.us')).toBe('123@lid.us');
  });

  it('rejects an empty destination', () => {
    expect(() => normalizeCallDestination('---')).toThrow(
      'Parameter phone must contain a WhatsApp number'
    );
  });

  it('delegates call controls to the browser page', async () => {
    const page = mockPage();

    await enableCallInterface(page);
    await acceptCall(page, 'call-1');
    await endCall(page, 'call-1');
    await offerCall(page, '5534999577020', { isVideo: true });

    expect(page.evaluate).toHaveBeenCalledTimes(4);
    expect(page.evaluate).toHaveBeenLastCalledWith(expect.any(Function), {
      to: '5534999577020@c.us',
      isVideo: true,
    });
  });

  it('installs and stops incoming audio capture in the browser', async () => {
    const page = {
      evaluate: jest.fn().mockResolvedValue(undefined),
      exposeFunction: jest.fn().mockResolvedValue(undefined),
    } as unknown as Page;
    const onChunk = jest.fn();

    await installIncomingAudioCapture(page, onChunk, { timesliceMs: 500 });
    await stopIncomingAudioCapture(page);

    expect(page.exposeFunction).toHaveBeenCalledWith(
      '__wppconnectIncomingCallAudioChunk',
      onChunk
    );
    expect(page.evaluate).toHaveBeenCalledTimes(2);
    expect(page.evaluate).toHaveBeenNthCalledWith(1, expect.any(Function), {
      callbackName: '__wppconnectIncomingCallAudioChunk',
      timesliceMs: 500,
    });
  });
});
