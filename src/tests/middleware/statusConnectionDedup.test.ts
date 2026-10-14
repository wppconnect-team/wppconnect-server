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
import statusConnection from '../../middleware/statusConnection';

jest.mock('../../util/functions', () => ({
  contactToArray: jest.fn(),
}));

const { contactToArray: mockContactToArray } = jest.requireMock(
  '../../util/functions'
) as { contactToArray: jest.Mock };

function createResponse() {
  const res: any = {
    statusCode: 0,
    body: undefined as any,
    status: jest.fn(),
    json: jest.fn(),
  };
  res.status.mockImplementation((code: number) => {
    res.statusCode = code;
    return res;
  });
  res.json.mockImplementation((body: any) => {
    res.body = body;
    return res;
  });
  return res;
}

/**
 * Builds a client whose checkNumberStatus counts calls and can canonicalise
 * the returned id the way WhatsApp does for numbers without a legacy @c.us.
 */
function buildClient(resolved: Record<string, string> = {}) {
  const calls: string[] = [];
  const client = {
    isConnected: jest.fn().mockResolvedValue(true),
    checkNumberStatus: jest.fn().mockImplementation(async (contact: string) => {
      calls.push(contact);
      const id = resolved[contact] ?? contact;
      return { numberExists: true, id: { _serialized: id } };
    }),
  };
  return { client, calls };
}

async function run(phone: string[], resolved: Record<string, string> = {}) {
  mockContactToArray.mockImplementation((input: any) => input);
  const { client, calls } = buildClient(resolved);
  const req = {
    body: { phone },
    client,
    logger: { error: jest.fn() },
  } as any;
  const res = createResponse();
  const next = jest.fn();
  await statusConnection(req, res, next);
  return { req, res, next, calls };
}

describe('statusConnection lookup de-duplication', () => {
  beforeEach(() => jest.clearAllMocks());

  it('looks up a unique recipient once', async () => {
    const { calls, next, req } = await run(['5511999999999@c.us']);

    expect(calls).toEqual(['5511999999999@c.us']);
    expect(req.body.phone).toEqual(['5511999999999@c.us']);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('reuses a resolved id for a repeated recipient', async () => {
    const { calls, req } = await run([
      '5511999999999@c.us',
      '5511999999999@c.us',
      '5511999999999@c.us',
    ]);

    expect(calls).toHaveLength(1);
    expect(req.body.phone).toEqual([
      '5511999999999@c.us',
      '5511999999999@c.us',
      '5511999999999@c.us',
    ]);
  });

  it('de-duplicates when WhatsApp canonicalises the id', async () => {
    // checkNumberStatus returns @s.whatsapp.net for this contact, which is
    // what made the old indexOf comparison never match.
    const { calls, req } = await run(
      ['5511999999999@c.us', '5511999999999@c.us'],
      { '5511999999999@c.us': '5511999999999@s.whatsapp.net' }
    );

    expect(calls).toHaveLength(1);
    expect(req.body.phone).toEqual([
      '5511999999999@s.whatsapp.net',
      '5511999999999@s.whatsapp.net',
    ]);
  });

  it('cuts round-trips for a bulk request with repeated recipients', async () => {
    const unique = Array.from(
      { length: 20 },
      (_, i) => `5511999999${String(i).padStart(3, '0')}@c.us`
    );
    const input = unique.flatMap((p) => [p, p, p, p]);

    const { calls, req } = await run(input);

    expect(input).toHaveLength(80);
    expect(calls).toHaveLength(20);
    expect(req.body.phone).toHaveLength(80);
  });

  it('keeps distinct recipients distinct', async () => {
    const { calls, req } = await run([
      '5511999999999@c.us',
      '5511999999998@c.us',
      '5511999999999@c.us',
    ]);

    expect(calls).toEqual(['5511999999999@c.us', '5511999999998@c.us']);
    expect(req.body.phone).toEqual([
      '5511999999999@c.us',
      '5511999999998@c.us',
      '5511999999999@c.us',
    ]);
  });

  it('still rejects an unknown number on the first lookup', async () => {
    mockContactToArray.mockImplementation((input: any) => input);
    const calls: string[] = [];
    const req = {
      body: { phone: ['5511999999999@c.us'] },
      client: {
        isConnected: jest.fn().mockResolvedValue(true),
        checkNumberStatus: jest.fn().mockImplementation(async (c: string) => {
          calls.push(c);
          return { numberExists: false };
        }),
      },
      logger: { error: jest.fn() },
    } as any;
    const res = createResponse();
    const next = jest.fn();

    await statusConnection(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('does not consult the browser for group or newsletter requests', async () => {
    mockContactToArray.mockImplementation((input: any) => input);
    const { client, calls } = buildClient();
    const req = {
      body: {
        phone: ['8865623215244578@g.us', '8865623215244578@g.us'],
        isGroup: true,
      },
      client,
      logger: { error: jest.fn() },
    } as any;
    const res = createResponse();
    const next = jest.fn();

    await statusConnection(req, res, next);

    expect(calls).toHaveLength(0);
    expect(req.body.phone).toEqual([
      '8865623215244578@g.us',
      '8865623215244578@g.us',
    ]);
    expect(next).toHaveBeenCalledTimes(1);
  });
});
