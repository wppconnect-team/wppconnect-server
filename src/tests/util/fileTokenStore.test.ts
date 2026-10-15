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
import { promises as fsp } from 'fs';
import os from 'os';
import path from 'path';

import { FileTokenStore } from '../../util/tokenStore/FileTokenStore/FileTokenStore';

jest.mock('../..', () => ({ logger: { debug: jest.fn(), error: jest.fn() } }));

let dir: string;
let store: FileTokenStore;

function tokenFile(session: string) {
  return path.join(dir, `${session}.data.json`);
}

beforeEach(async () => {
  dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'wpp-tokens-'));
  store = new FileTokenStore({ path: dir });
});

afterEach(async () => {
  await fsp.rm(dir, { recursive: true, force: true });
});

describe('FileTokenStore', () => {
  it('round-trips a session', async () => {
    await store.setToken('customer-1', { token: 'abc' } as any);

    await expect(store.getToken('customer-1')).resolves.toMatchObject({
      token: 'abc',
    });
  });

  it('replaces an existing session token', async () => {
    await store.setToken('customer-1', { token: 'first' } as any);
    await store.setToken('customer-1', { token: 'second' } as any);

    await expect(store.getToken('customer-1')).resolves.toMatchObject({
      token: 'second',
    });
  });

  it('leaves no temporary file behind after a successful save', async () => {
    await store.setToken('customer-1', { token: 'abc' } as any);

    const files = await fsp.readdir(dir);
    expect(files).toEqual(['customer-1.data.json']);
  });

  it('never writes the token through the final path', async () => {
    const open = jest.spyOn(fsp, 'open');

    await store.setToken('customer-1', { token: 'abc' } as any);

    const targets = open.mock.calls.map((call) => call[0] as string);
    expect(targets).toHaveLength(1);
    expect(targets[0]).not.toBe(tokenFile('customer-1'));
    expect(targets[0]).toContain('customer-1.data.json');
    open.mockRestore();
  });

  it('keeps the previous token readable when the save fails mid-write', async () => {
    await store.setToken('customer-1', { token: 'first' } as any);

    // Model a crash after the file has been opened and truncated but before
    // the bytes land - a full disk, an OOM kill or a container restart.
    const writeFile = jest
      .spyOn(fsp, 'writeFile')
      .mockImplementationOnce(async (target: any) => {
        await fsp.writeFile(target, '{"token":"sec');
        throw new Error('ENOSPC: no space left on device');
      });

    await expect(
      store.setToken('customer-1', { token: 'second' } as any)
    ).resolves.toBe(false);

    writeFile.mockRestore();
    // The interrupted save must not have destroyed the working session.
    await expect(store.getToken('customer-1')).resolves.toMatchObject({
      token: 'first',
    });
  });

  it('keeps the previous token readable when the rename fails', async () => {
    await store.setToken('customer-1', { token: 'first' } as any);

    const rename = jest
      .spyOn(fsp, 'rename')
      .mockRejectedValueOnce(new Error('EPERM'));

    await expect(
      store.setToken('customer-1', { token: 'second' } as any)
    ).resolves.toBe(false);

    rename.mockRestore();
    await expect(store.getToken('customer-1')).resolves.toMatchObject({
      token: 'first',
    });
  });

  it('cleans up the temporary file after a failed save', async () => {
    const writeFile = jest
      .spyOn(fsp, 'writeFile')
      .mockRejectedValueOnce(new Error('ENOSPC'));

    await store.setToken('customer-1', { token: 'abc' } as any);

    writeFile.mockRestore();
    expect(await fsp.readdir(dir)).toEqual([]);
  });

  it('does not create a file when there is no token', async () => {
    await expect(store.setToken('customer-1', null)).resolves.toBe(false);

    expect(await fsp.readdir(dir)).toEqual([]);
  });

  it('stages every save to its own exclusively-created file', async () => {
    const open = jest.spyOn(fsp, 'open');

    await store.setToken('customer-1', { token: 'first' } as any);
    await store.setToken('customer-1', { token: 'second' } as any);

    const calls = open.mock.calls as any[][];
    expect(calls).toHaveLength(2);
    // A staging path shared with a concurrent save would let one operation
    // rewrite the other's file, so each save must stage elsewhere.
    expect(calls[0][0]).not.toBe(calls[1][0]);
    for (const call of calls) {
      expect(call[0]).toContain('customer-1.data.json');
      expect(call[1]).toBe('wx');
    }
    open.mockRestore();
  });

  it('leaves one complete token when two saves overlap', async () => {
    const payloadA = { token: `a${'A'.repeat(64)}` } as any;
    const payloadB = { token: `b${'B'.repeat(64)}` } as any;
    const textA = JSON.stringify(payloadA);

    let releaseA!: () => void;
    const gate = new Promise<void>((resolve) => {
      releaseA = resolve;
    });
    let aEntered!: () => void;
    const entered = new Promise<void>((resolve) => {
      aEntered = resolve;
    });

    const writeFile = jest.spyOn(fsp, 'writeFile');
    writeFile.mockImplementationOnce(async (target: any, data: any) => {
      // Hold the staging file open with only the first bytes landed,
      // modelling a slow write that a second save for the same session
      // overtakes.
      const handle = target;
      await handle.write(String(data).slice(0, 8));
      aEntered();
      await gate;
      await handle.write(String(data).slice(8));
    });

    const saveA = store.setToken('customer-1', payloadA);
    await entered;
    // The second save runs to completion while the first one still holds
    // its staging file open.
    await expect(store.setToken('customer-1', payloadB)).resolves.toBe(true);
    releaseA();
    await expect(saveA).resolves.toBe(true);
    writeFile.mockRestore();

    // The winner must be byte-identical to its submitted payload. With a
    // staging file shared by both saves, the bytes still in flight would
    // have landed inside the already committed token instead.
    await expect(fsp.readFile(tokenFile('customer-1'), 'utf8')).resolves.toBe(
      textA
    );
    await expect(store.getToken('customer-1')).resolves.toMatchObject({
      token: payloadA.token,
    });
    expect(await fsp.readdir(dir)).toEqual(['customer-1.data.json']);
  });

  it('does not let a failed overlapping save touch the committed token', async () => {
    const payloadA = { token: `a${'A'.repeat(64)}` } as any;
    const payloadB = { token: `b${'B'.repeat(64)}` } as any;

    let releaseA!: () => void;
    const gate = new Promise<void>((resolve) => {
      releaseA = resolve;
    });
    let aEntered!: () => void;
    const entered = new Promise<void>((resolve) => {
      aEntered = resolve;
    });

    const writeFile = jest.spyOn(fsp, 'writeFile');
    writeFile.mockImplementationOnce(async (target: any, data: any) => {
      const handle = target;
      await handle.write(String(data).slice(0, 8));
      aEntered();
      await gate;
      await handle.write(String(data).slice(8));
    });
    const rename = jest.spyOn(fsp, 'rename');

    const saveA = store.setToken('customer-1', payloadA);
    await entered;
    await expect(store.setToken('customer-1', payloadB)).resolves.toBe(true);
    // Fail only the first save's rename, after the second save committed.
    rename.mockRejectedValueOnce(new Error('EPERM'));
    releaseA();
    await expect(saveA).resolves.toBe(false);

    writeFile.mockRestore();
    rename.mockRestore();

    // The committed token is intact and the failed save removed only its
    // own staging file.
    await expect(store.getToken('customer-1')).resolves.toMatchObject({
      token: payloadB.token,
    });
    expect(await fsp.readdir(dir)).toEqual(['customer-1.data.json']);
  });

  it('does not remove a staging file owned by another save', async () => {
    const open = jest.spyOn(fsp, 'open');
    open.mockRejectedValueOnce(
      Object.assign(new Error('EEXIST: file already exists'), {
        code: 'EEXIST',
      })
    );
    const unlink = jest.spyOn(fsp, 'unlink');

    await expect(
      store.setToken('customer-1', { token: 'abc' } as any)
    ).resolves.toBe(false);

    // Exclusive creation reported that the path belongs to another save,
    // so cleanup must leave it alone.
    expect(unlink).not.toHaveBeenCalled();
    open.mockRestore();
    unlink.mockRestore();
    expect(await fsp.readdir(dir)).toEqual([]);
  });

  it('does not clean up any path when encoding fails before creation', async () => {
    // Discover the next staging name without depending on the module counter.
    const open = jest.spyOn(fsp, 'open');
    await store.setToken('customer-1', { token: 'previous' } as any);
    const previous = String(open.mock.calls[0][0]);
    open.mockRestore();
    const next = previous.replace(
      /\.(\d+)\.tmp$/,
      (_, counter) => `.${Number(counter) + 1}.tmp`
    );
    await fsp.writeFile(next, 'owned by a previous process');
    store = new FileTokenStore({
      path: dir,
      encodeFunction: () => {
        throw new Error('encoder failed');
      },
    });
    const unlink = jest.spyOn(fsp, 'unlink');

    await expect(
      store.setToken('customer-1', { token: 'next' } as any)
    ).resolves.toBe(false);

    expect(unlink).not.toHaveBeenCalled();
    unlink.mockRestore();
    await expect(fsp.readFile(next, 'utf8')).resolves.toBe(
      'owned by a previous process'
    );
    await expect(store.getToken('customer-1')).resolves.toMatchObject({
      token: 'previous',
    });
  });
});
