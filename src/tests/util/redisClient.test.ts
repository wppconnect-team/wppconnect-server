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
let capturedOptions: any;
const onCalls: string[] = [];

jest.mock('../../config', () => ({
  __esModule: true,
  default: {
    tokenStoreType: 'redis',
    db: {
      redisHost: 'redis.internal.example',
      redisPort: 6380,
      redisPassword: 's3cret',
      redisDb: 4,
      redisPrefix: 'docker',
    },
  },
}));

jest.mock('redis', () => ({
  createClient: jest.fn((options: any) => {
    capturedOptions = options;
    const client = {
      on: jest.fn((event: string, handler: (err?: any) => void) => {
        onCalls.push(event);
        // Emulate a failed reconnect. Without a listener this is an
        // unhandled 'error' event and the process would terminate.
        if (event === 'error') {
          setImmediate(() => handler(new Error('ECONNREFUSED')));
        }
        return client;
      }),
    };
    return client;
  }),
}));

const loadDb = () => {
  // db.ts creates the client at import time, so the module cache must be
  // cleared for each test to observe a fresh createClient call.
  jest.resetModules();
  return require('../../util/db/redis/db');
};

describe('redis client configuration', () => {
  beforeEach(() => {
    capturedOptions = undefined;
    onCalls.length = 0;
  });

  it('passes the configured connection settings to the client', () => {
    loadDb();

    expect(capturedOptions).toBeDefined();
    expect(capturedOptions.socket.port).toBe(6380);
    expect(capturedOptions.socket.host).toBe('redis.internal.example');
    expect(capturedOptions.password).toBe('s3cret');
    expect(capturedOptions.database).toBe(4);
  });

  it('does not use the redis v3 positional signature', () => {
    loadDb();

    // v3 was createClient(port, host, options). v4 takes one options object;
    // the extra positional arguments were spread off a number and dropped.
    expect(Array.isArray(capturedOptions)).toBe(false);
    expect(typeof capturedOptions).toBe('object');
    expect(capturedOptions.socket).toBeDefined();
  });

  it('registers an error listener so reconnects cannot kill the process', async () => {
    const client = loadDb().default;

    expect(client).not.toBeNull();
    expect(onCalls).toContain('error');
    // Let the emulated error fire. An unhandled 'error' would throw here.
    await new Promise((resolve) => setTimeout(resolve, 10));
  });

  it('does not fall back to localhost defaults', () => {
    loadDb();

    expect(capturedOptions.socket.host).not.toBe('localhost');
    expect(capturedOptions.socket.port).not.toBe(6379);
  });
});
