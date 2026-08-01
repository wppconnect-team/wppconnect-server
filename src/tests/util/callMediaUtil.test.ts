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
  consumeMediaTicket,
  createMediaTicket,
  resetCallMediaForTests,
} from '../../util/callMediaUtil';

describe('Call media authorization', () => {
  afterEach(resetCallMediaForTests);

  it('creates a session-bound, single-use ticket', () => {
    const result = createMediaTicket('session-a');

    expect(consumeMediaTicket(result.ticket)?.session).toBe('session-a');
    expect(consumeMediaTicket(result.ticket)).toBeUndefined();
  });

  it('rejects expired and invalid ticket lifetimes', () => {
    const now = jest.spyOn(Date, 'now').mockReturnValue(1_000);
    const result = createMediaTicket('session-a', 1_000);
    now.mockReturnValue(2_001);

    expect(consumeMediaTicket(result.ticket)).toBeUndefined();
    expect(() => createMediaTicket('session-a', Number.NaN)).toThrow(
      'ttlMs must be a number'
    );
    now.mockRestore();
  });
});
