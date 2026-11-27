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

import expressPlugin from '@fastify/express';
import express from 'express';
import Fastify, { FastifyInstance } from 'fastify';

import { queryBoolean } from '../../middleware/queryBoolean';

// Real HTTP middleware stack; handlers echo the query so these regressions do
// not require a connected WhatsApp account or exercise provider startup.
describe('query parameters through the Fastify/Express bridge', () => {
  let app: FastifyInstance;
  let address: string;
  const handler = jest.fn((req, res) => {
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ query: req.query, params: req.params }));
  });

  beforeAll(async () => {
    app = Fastify();
    await app.register(expressPlugin);
    app.use(queryBoolean);
    const routes = express.Router();
    routes.get('/api/:session/all-messages-in-chat/:phone', handler);
    routes.get('/api/:session/get-messages/:phone', handler);
    app.use(routes);
    address = await app.listen({ port: 0, host: '127.0.0.1' });
  });

  afterAll(async () => {
    await app.close();
  });
  beforeEach(() => handler.mockClear());

  it.each([
    ['/api/test/all-messages-in-chat/5511999999999', {}],
    [
      '/api/test/all-messages-in-chat/5511999999999?includeMe=true&includeNotifications=false&isGroup=false',
      { includeMe: true, includeNotifications: false, isGroup: false },
    ],
    [
      '/api/test/get-messages/5511999999999@c.us?count=20&direction=before&id=message-id',
      { count: '20', direction: 'before', id: 'message-id' },
    ],
    [
      '/api/test/get-messages/5511999999999@c.us?flag=true&flag=false&empty=&text=TRUE',
      { flag: [true, false], empty: '', text: 'TRUE' },
    ],
    [
      '/api/test/get-messages/5511999999999@c.us?hasOwnProperty=false&constructor=true&__proto__=false',
      JSON.parse(
        '{"hasOwnProperty":false,"constructor":true,"__proto__":false}'
      ),
    ],
  ])('passes %s to the route handler', async (url, query) => {
    const response = await fetch(`${address}${url}`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      query,
      params: {
        session: 'test',
        phone: (url as string).includes('@c.us')
          ? '5511999999999@c.us'
          : '5511999999999',
      },
    });
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
