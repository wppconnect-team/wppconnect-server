/*
 * Copyright 2026 WPPConnect Team
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
  clearResourceCache,
  getAllSessionsResourceUsage,
  getSessionResourceUsage,
  resetResourceMonitorInstance,
} from '../../controller/resourceController';

function createResponse() {
  const res: any = {
    statusCode: 200,
    headersSent: false,
    body: null,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(body: any) {
      res.headersSent = true;
      res.body = body;
      return res;
    },
    send(body: any) {
      res.headersSent = true;
      res.body = body;
      return res;
    },
  };
  return res;
}

describe('ResourceController endpoints', () => {
  const defaultSecret = 'THISISMYSECURETOKEN';

  beforeEach(() => {
    resetResourceMonitorInstance();
  });

  describe('getSessionResourceUsage', () => {
    it('returns 403 when resource monitoring is disabled in config', async () => {
      const req: any = {
        params: { session: 'session1' },
        serverOptions: {
          secretKey: defaultSecret,
          resourceMonitor: { enable: false, cacheDuration: 5000 },
        },
      };
      const res = createResponse();

      await getSessionResourceUsage(req, res);
      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Resource monitoring is disabled');
    });

    it('returns 400 when session name is missing or hostile', async () => {
      const req: any = {
        params: { session: 'session1; rm -rf /' },
        serverOptions: {
          secretKey: defaultSecret,
          resourceMonitor: { enable: true, cacheDuration: 5000 },
        },
      };
      const res = createResponse();

      await getSessionResourceUsage(req, res);
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Invalid session name');
    });

    it('returns 200 with usage result for valid session name', async () => {
      const req: any = {
        params: { session: 'session1' },
        serverOptions: {
          secretKey: defaultSecret,
          customUserDataDir: '/tmp/nonexistentUserDataDir',
          resourceMonitor: { enable: true, cacheDuration: 5000 },
        },
      };
      const res = createResponse();

      await getSessionResourceUsage(req, res);
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.sessionName).toBe('session1');
    });
  });

  describe('getAllSessionsResourceUsage', () => {
    it('does not accept the administrator secret from GET parameters or query values', async () => {
      const req: any = {
        params: { secretkey: defaultSecret },
        query: { secretkey: defaultSecret },
        headers: {},
        serverOptions: {
          secretKey: defaultSecret,
          resourceMonitor: { enable: true, cacheDuration: 5000 },
        },
      };
      const res = createResponse();
      await getAllSessionsResourceUsage(req, res);
      expect(res.statusCode).toBe(401);
    });
    it('returns 403 when disabled in config', async () => {
      const req: any = {
        params: { secretkey: defaultSecret },
        headers: {},
        serverOptions: {
          secretKey: defaultSecret,
          resourceMonitor: { enable: false, cacheDuration: 5000 },
        },
      };
      const res = createResponse();

      await getAllSessionsResourceUsage(req, res);
      expect(res.statusCode).toBe(403);
    });

    it('returns 401 when an administrator bearer token is absent', async () => {
      const req: any = {
        params: { secretkey: 'WRONG_SECRET' },
        headers: {},
        serverOptions: {
          secretKey: defaultSecret,
          resourceMonitor: { enable: true, cacheDuration: 5000 },
        },
      };
      const res = createResponse();

      await getAllSessionsResourceUsage(req, res);
      expect(res.statusCode).toBe(401);
      expect(res.body.message).toBe('The token is incorrect');
    });

    it('returns 200 with all sessions when an administrator bearer token is valid', async () => {
      const req: any = {
        params: { secretkey: defaultSecret },
        headers: { authorization: `Bearer ${defaultSecret}` },
        serverOptions: {
          secretKey: defaultSecret,
          customUserDataDir: '/tmp/nonexistentUserDataDir',
          resourceMonitor: { enable: true, cacheDuration: 5000 },
        },
      };
      const res = createResponse();

      await getAllSessionsResourceUsage(req, res);
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.sessions).toEqual([]);
      expect(res.body.data.summary.totalSessions).toBe(0);
    });
  });

  describe('clearResourceCache', () => {
    it('returns 403 when resource monitoring is disabled', async () => {
      const req: any = {
        params: { secretkey: defaultSecret },
        headers: {},
        body: {},
        serverOptions: {
          secretKey: defaultSecret,
          resourceMonitor: { enable: false, cacheDuration: 5000 },
        },
      };
      const res = createResponse();

      await clearResourceCache(req, res);
      expect(res.statusCode).toBe(403);
    });

    it('returns 400 when secret key is incorrect', async () => {
      const req: any = {
        params: { secretkey: 'WRONG' },
        headers: {},
        body: {},
        serverOptions: {
          secretKey: defaultSecret,
          resourceMonitor: { enable: true, cacheDuration: 5000 },
        },
      };
      const res = createResponse();

      await clearResourceCache(req, res);
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('The token is incorrect');
    });

    it('returns 400 when hostile session name is passed in body', async () => {
      const req: any = {
        params: { secretkey: defaultSecret },
        headers: {},
        body: { session: '../../etc/passwd' },
        serverOptions: {
          secretKey: defaultSecret,
          resourceMonitor: { enable: true, cacheDuration: 5000 },
        },
      };
      const res = createResponse();

      await clearResourceCache(req, res);
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Invalid session name');
    });

    it('clears all cache when no session is specified', async () => {
      const req: any = {
        params: { secretkey: defaultSecret },
        headers: {},
        body: {},
        serverOptions: {
          secretKey: defaultSecret,
          resourceMonitor: { enable: true, cacheDuration: 5000 },
        },
      };
      const res = createResponse();

      await clearResourceCache(req, res);
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('All cache cleared');
    });

    it('clears session cache when specific session is specified', async () => {
      const req: any = {
        params: { secretkey: defaultSecret },
        headers: {},
        body: { session: 'session1' },
        serverOptions: {
          secretKey: defaultSecret,
          resourceMonitor: { enable: true, cacheDuration: 5000 },
        },
      };
      const res = createResponse();

      await clearResourceCache(req, res);
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Cache cleared for session: session1');
    });
  });
});
