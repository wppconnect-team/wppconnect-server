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
import { createServer, Server } from 'http';
import { AddressInfo } from 'net';

import ChatWootClient from '../../util/chatWootClient';
import { eventEmitter } from '../../util/sessionUtil';

jest.mock('../..', () => ({ logger: { error: jest.fn() } }));

type Recorded = { method: string; url: URL; token: string; body: string };
const requests: Recorded[] = [];
let attackerHits = 0;
let trusted: Server;
let attacker: Server;
let baseURL: string;
let attackerURL: string;
async function listen(server: Server): Promise<string> {
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}
beforeAll(async () => {
  attacker = createServer((_req, res) => {
    attackerHits++;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ meta: { count: 0 }, payload: [] }));
  });
  attackerURL = await listen(attacker);
  trusted = createServer(async (req, res) => {
    let body = '';
    for await (const data of req) body += data.toString();
    const url = new URL(req.url!, baseURL);
    requests.push({
      method: req.method!,
      url,
      token: String(req.headers.api_access_token),
      body,
    });
    if (url.searchParams.get('q') === 'redirect') {
      res.writeHead(302, { Location: attackerURL });
      res.end();
      return;
    }
    const result = url.pathname.endsWith('/contacts/search/')
      ? { meta: { count: 0 }, payload: [] }
      : url.pathname.endsWith('/contacts')
      ? { payload: { contact: { id: 1 } } }
      : req.method === 'GET'
      ? { payload: [] }
      : { id: 2 };
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(result));
  });
  baseURL = await listen(trusted);
});
beforeEach(() => {
  requests.length = 0;
  attackerHits = 0;
  jest.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(() => {
  jest.restoreAllMocks();
  for (const event of [
    'qrcode-security-test',
    'status-security-test',
    'mensagem-security-test',
  ]) {
    eventEmitter.removeAllListeners(event);
  }
});
afterAll(async () => {
  for (const server of [trusted, attacker]) {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

function client(overrides = {}, allowedUrls = [baseURL]): ChatWootClient {
  return Reflect.construct(ChatWootClient, [
    {
      baseURL,
      token: 'fixture-token',
      account_id: '1',
      inbox_id: '2',
      ...overrides,
    },
    'security-test',
    allowedUrls,
  ]);
}

it('never connects to an unapproved destination chosen by session input', async () => {
  try {
    await client({ baseURL: attackerURL }).findContact('fixture');
  } catch {
    // Rejecting configuration before a request is the expected safe path.
  }
  expect(attackerHits).toBe(0);
});

it('supports an explicitly approved self-hosted destination and all six request paths', async () => {
  const instance = client();
  const message = {
    chatId: '5511999999999@c.us',
    body: 'hello',
    sender: { id: '5511999999999@c.us', pushname: 'Fixture' },
  };
  await instance.sendMessage({}, message);
  await instance.sendMessage(
    {},
    {
      ...message,
      type: 'image',
      mimetype: 'image/png',
      timestamp: 'fixture',
      qrCode: Buffer.from('fixture').toString('base64'),
    }
  );
  expect(
    requests.some(
      (req) =>
        req.method === 'GET' && req.url.pathname.endsWith('/contacts/search/')
    )
  ).toBe(true);
  expect(
    requests.some(
      (req) => req.method === 'POST' && req.url.pathname.endsWith('/contacts')
    )
  ).toBe(true);
  expect(
    requests.some(
      (req) =>
        req.method === 'GET' &&
        req.url.pathname.endsWith('/contacts/1/conversations')
    )
  ).toBe(true);
  expect(
    requests.some(
      (req) =>
        req.method === 'POST' && req.url.pathname.endsWith('/conversations')
    )
  ).toBe(true);
  const messages = requests.filter((req) =>
    req.url.pathname.endsWith('/messages')
  );
  expect(messages).toHaveLength(2);
  expect(messages.some((req) => req.body.includes('attachments[]'))).toBe(true);
  expect(
    requests.every(
      (req) => req.token === 'fixture-token' && req.url.origin === baseURL
    )
  ).toBe(true);
});

it('encodes the entire contact query as a single parameter', async () => {
  const query = '5511&injected=true#fragment';
  await client().findContact(query);
  expect(requests).toHaveLength(1);
  expect(requests[0].url.searchParams.get('q')).toBe(query);
  expect(requests[0].url.searchParams.has('injected')).toBe(false);
});

it('does not follow a redirect from an approved server', async () => {
  await client().findContact('redirect');
  expect(requests).toHaveLength(1);
  expect(attackerHits).toBe(0);
});

it.each(['../admin', '//other.invalid', '1?injected=true', '1#fragment'])(
  'rejects unsafe account identifiers before requests: %s',
  (account_id) => expect(() => client({ account_id })).toThrow()
);
