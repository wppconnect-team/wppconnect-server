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

import fs from 'fs';

import { ZapoAdapter } from '../../core/provider/zapo/ZapoAdapter';

function setup(fetchVersion?: jest.Mock) {
  const client = { on: jest.fn(), connect: jest.fn(), disconnect: jest.fn() };
  const WaClient = jest.fn(() => client);
  const adapter = new ZapoAdapter('version-test');
  jest
    .spyOn(adapter as any, 'loadModule')
    .mockResolvedValueOnce({
      createStore: jest.fn(() => ({})),
      WaClient,
      fetchLatestWaWebVersion: fetchVersion,
    })
    .mockResolvedValueOnce({ createSqliteStore: jest.fn(() => ({})) });
  return { adapter, WaClient, client };
}

describe('Zapo pairing version', () => {
  beforeEach(() => {
    jest.spyOn(fs, 'mkdirSync').mockReturnValue(undefined);
  });
  afterEach(() => jest.restoreAllMocks());

  it('uses the current web version with a bounded fetch', async () => {
    const fetchVersion = jest
      .fn()
      .mockResolvedValue({ version: '2.3000.1054821409' });
    const { adapter, WaClient, client } = setup(fetchVersion);
    await adapter.session.start();
    expect(fetchVersion).toHaveBeenCalledWith({ timeoutMs: 10_000 });
    expect(WaClient).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: 'version-test',
        version: '2.3000.1054821409',
      }),
      undefined
    );
    expect(client.connect).toHaveBeenCalledTimes(1);
  });

  it.each(['unavailable', 'unsupported'])(
    'keeps the bundled default when version fetching is %s',
    async (mode) => {
      const { adapter, WaClient, client } = setup(
        mode === 'unavailable'
          ? jest.fn().mockRejectedValue(new Error('timeout'))
          : undefined
      );
      await adapter.session.start();
      expect(WaClient).toHaveBeenCalledWith(
        expect.not.objectContaining({ version: expect.anything() }),
        undefined
      );
      expect(client.connect).toHaveBeenCalledTimes(1);
    }
  );

  it('does not create a client if closed while fetching the version', async () => {
    let resolve!: (value: { version: string }) => void;
    const fetchVersion = jest.fn(
      () =>
        new Promise((done) => {
          resolve = done;
        })
    );
    const { adapter, WaClient } = setup(fetchVersion);
    const starting = adapter.session.start();
    // Wait for the asynchronous module imports to reach the version fetch.
    while (!fetchVersion.mock.calls.length) await Promise.resolve();
    await adapter.session.close();
    resolve({ version: '2.3000.1054821409' });
    await starting;
    expect(WaClient).not.toHaveBeenCalled();
  });
});
