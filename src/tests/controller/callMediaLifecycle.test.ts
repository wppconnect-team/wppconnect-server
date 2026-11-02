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
import type { Request, Response } from 'express';

import { endCall, stopCallMedia } from '../../controller/deviceController';
import {
  activateCallMedia,
  consumeMediaTicket,
  createMediaTicket,
  isCallMediaActive,
  resetCallMediaForTests,
} from '../../util/callMediaUtil';

jest.mock('../../core/provider/useProvider', () => ({ getClient: jest.fn() }));
jest.mock('../../util/functions', () => ({}));
jest.mock('../../util/sessionUtil', () => ({ clientsArray: {} }));

describe('Call media termination after browser loss', () => {
  afterEach(resetCallMediaForTests);

  it.each([endCall, stopCallMedia])(
    '%p revokes the current call even when the page is closed',
    async (handler) => {
      activateCallMedia('session-a', 'current-call');
      activateCallMedia('session-b', 'other-call');
      const pending = createMediaTicket('session-a', 'current-call');
      const other = createMediaTicket('session-b', 'other-call');
      const page = {
        evaluate: jest.fn().mockRejectedValue(new Error('Target closed')),
      };
      const req = {
        session: 'session-a',
        body: { callId: 'stale-call' },
        client: { page },
        logger: { error: jest.fn() },
      } as unknown as Request;
      const res = { status: jest.fn(), json: jest.fn() };
      res.status.mockReturnValue(res);

      await handler(req, res as unknown as Response);

      expect(page.evaluate).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(isCallMediaActive('session-a', 'current-call')).toBe(false);
      expect(consumeMediaTicket(pending.ticket)).toBeUndefined();
      expect(isCallMediaActive('session-b', 'other-call')).toBe(true);
      expect(consumeMediaTicket(other.ticket)?.callId).toBe('other-call');
    }
  );
});
