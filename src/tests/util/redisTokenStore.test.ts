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
import RedisTokenStore from '../../util/tokenStore/redisTokenStory';

// A minimal in-memory stand-in for the node-redis v4 client, which is
// promises-only: extra arguments (such as a callback) are folded into the
// command arguments and never invoked.
const store = new Map<string, string>();
const key = (...parts: string[]) => parts.join('');

jest.mock('../../config', () => ({
  __esModule: true,
  default: {
    tokenStoreType: 'redis',
    db: { redisPrefix: 'wpp', redisPort: 6379, redisHost: 'localhost' },
  },
}));

jest.mock('../../util/db/redis/db', () => ({
  __esModule: true,
  default: {
    get: jest.fn(async (k: string) => store.get(k) ?? null),
    set: jest.fn(async (k: string, value: string) => {
      store.set(k, value);
      return 'OK';
    }),
    del: jest.fn(async (k: string) => (store.delete(k) ? 1 : 0)),
    keys: jest.fn(async (pattern: string) => {
      const star = pattern.indexOf('*');
      const head = pattern.slice(0, star);
      const tail = pattern.slice(star + 1);
      return [...store.keys()].filter(
        (k) => k.startsWith(head) && k.endsWith(tail)
      );
    }),
  },
}));

jest.mock('../../util/functions', () => ({
  getIPAddress: () => '10.0.0.7',
}));

const redisClient = jest.requireMock('../../util/db/redis/db').default;

describe('RedisTokenStore key prefix', () => {
  beforeEach(() => {
    store.clear();
    jest.clearAllMocks();
  });

  function build(client: any = { config: {} }) {
    return new RedisTokenStore(client).tokenStore;
  }

  it('writes the session under the configured prefix', async () => {
    const tokens = build();

    await tokens.setToken('customer-1', { token: 'abc' });

    expect(redisClient.set).toHaveBeenCalledWith(
      key('wpp', 'customer-1'),
      expect.any(String)
    );
  });

  it('reads the session back under the same key', async () => {
    const store = build();
    await store.setToken('customer-1', { token: 'abc' });

    const loaded = await store.getToken('customer-1');

    expect(redisClient.get).toHaveBeenCalledWith('wppcustomer-1');
    expect(loaded).toMatchObject({ token: 'abc', sessionName: 'customer-1' });
  });

  it('does not write keys that begin with the text "undefined"', async () => {
    const tokens = build();

    await tokens.setToken('customer-1', { token: 'abc' });

    expect([...store.keys()].some((k) => k.startsWith('undefined'))).toBe(
      false
    );
  });

  it('scopes keys to the store prefix so two deployments cannot collide', async () => {
    const first = build();
    await first.setToken('customer-1', { token: 'first' });

    // A second store on another host resolves a different prefix.
    const second = build();
    await second.setToken('customer-2', { token: 'second' });

    expect([...store.keys()].sort()).toEqual([
      key('wpp', 'customer-1'),
      key('wpp', 'customer-2'),
    ]);
  });

  it('lists session names with the prefix stripped', async () => {
    const store = build();
    await store.setToken('customer-1', { token: 'abc' });
    await store.setToken('customer-2', { token: 'def' });

    const listed = await store.listTokens();

    expect(listed).toEqual(['customer-1', 'customer-2']);
  });

  it('removes only the requested session', async () => {
    const store = build();
    await store.setToken('customer-1', { token: 'abc' });
    await store.setToken('customer-2', { token: 'def' });

    await store.removeToken('customer-1');

    expect(redisClient.del).toHaveBeenCalledWith('wppcustomer-1');
    expect(await store.listTokens()).toEqual(['customer-2']);
  });

  it('never passes a callback to the promises-only client', async () => {
    const tokens = build();
    await tokens.setToken('customer-1', { token: 'abc' });
    await tokens.getToken('customer-1');
    await tokens.listTokens();
    await tokens.removeToken('customer-1');

    // node-redis v4 folds extra arguments into the command itself, so a
    // callback would corrupt the command and never fire, hanging the call.
    for (const method of ['get', 'set', 'del', 'keys'] as const) {
      for (const call of redisClient[method].mock.calls as any[][]) {
        expect(call.some((arg) => typeof arg === 'function')).toBe(false);
      }
    }
  });

  it('reports failures instead of hanging when a command rejects', async () => {
    const tokens = build();
    redisClient.get.mockRejectedValueOnce(new Error('connection lost'));
    redisClient.set.mockRejectedValueOnce(new Error('connection lost'));
    redisClient.del.mockRejectedValueOnce(new Error('connection lost'));
    redisClient.keys.mockRejectedValueOnce(new Error('connection lost'));

    await expect(tokens.getToken('customer-1')).rejects.toThrow(
      'connection lost'
    );
    await expect(tokens.setToken('customer-1', { token: 'abc' })).resolves.toBe(
      false
    );
    await expect(tokens.removeToken('customer-1')).resolves.toBe(false);
    await expect(tokens.listTokens()).resolves.toEqual([]);
  });
});
