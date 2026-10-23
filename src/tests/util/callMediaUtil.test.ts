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
import {
  activateCallMedia,
  callMediaRoom,
  consumeMediaTicket,
  createMediaTicket,
  deactivateCallMedia,
  resetCallMediaForTests,
} from '../../util/callMediaUtil';

describe('Call media authorization', () => {
  afterEach(resetCallMediaForTests);

  it('creates a session-bound, single-use ticket', () => {
    activateCallMedia('session-a', 'call-1');
    const result = createMediaTicket('session-a', 'call-1');

    expect(consumeMediaTicket(result.ticket)?.session).toBe('session-a');
    expect(consumeMediaTicket(result.ticket)).toBeUndefined();
    expect(callMediaRoom('session-a', 'call-1')).toBe('session-a:call-1');
  });

  it('rejects tickets for an inactive call', () => {
    expect(() => createMediaTicket('session-a', 'call-1')).toThrow(
      'Call media is not active for this session and callId'
    );
    activateCallMedia('session-a', 'call-2');
    expect(() => createMediaTicket('session-a', 'call-1')).toThrow(
      'Call media is not active for this session and callId'
    );
  });

  it('invalidates issued tickets when the active call changes or ends', () => {
    activateCallMedia('session-a', 'call-1');
    const replaced = createMediaTicket('session-a', 'call-1');
    activateCallMedia('session-a', 'call-2');
    expect(consumeMediaTicket(replaced.ticket)).toBeUndefined();

    const ended = createMediaTicket('session-a', 'call-2');
    deactivateCallMedia('session-a', 'call-2');
    expect(consumeMediaTicket(ended.ticket)).toBeUndefined();
  });

  it('rejects expired and invalid ticket lifetimes', () => {
    const now = jest.spyOn(Date, 'now').mockReturnValue(1_000);
    activateCallMedia('session-a', 'call-1');
    const result = createMediaTicket('session-a', 'call-1', 1_000);
    now.mockReturnValue(2_001);

    expect(consumeMediaTicket(result.ticket)).toBeUndefined();
    expect(() => createMediaTicket('session-a', 'call-1', Number.NaN)).toThrow(
      'ttlMs must be a number'
    );
    now.mockRestore();
  });
});
