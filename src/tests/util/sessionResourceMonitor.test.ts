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

import path from 'path';
import pidusage from 'pidusage';

import {
  buildProcessTree,
  extractUserDataDir,
  isUserDataDirForSession,
  isValidSessionName,
  parsePsOutput,
  parseWmicCsvOutput,
  ProcessEntry,
  SessionResourceMonitor,
} from '../../util/SessionResourceMonitor';

jest.mock('pidusage');
const mockPidusage = pidusage as jest.MockedFunction<typeof pidusage>;

describe('SessionResourceMonitor and process discovery', () => {
  const customUserDataDir = '/tmp/testUserDataDir';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Hostile input validation (isValidSessionName)', () => {
    it('accepts safe alphanumeric and punctuated session names', () => {
      expect(isValidSessionName('session1')).toBe(true);
      expect(isValidSessionName('SESSION_2')).toBe(true);
      expect(isValidSessionName('my-session.3')).toBe(true);
      expect(isValidSessionName('customer:session_01')).toBe(true);
    });

    it('rejects command injection sequences with shell metacharacters', () => {
      expect(isValidSessionName('session1; rm -rf /')).toBe(false);
      expect(isValidSessionName('session1 && whoami')).toBe(false);
      expect(isValidSessionName('session1 | cat /etc/passwd')).toBe(false);
      expect(isValidSessionName('session1`calc.exe`')).toBe(false);
      expect(isValidSessionName('session1$(whoami)')).toBe(false);
      expect(isValidSessionName('session1 > out.txt')).toBe(false);
      expect(isValidSessionName('session1 < in.txt')).toBe(false);
      expect(isValidSessionName('session"1"')).toBe(false);
      expect(isValidSessionName("session'1'")).toBe(false);
      expect(isValidSessionName('session\nnewline')).toBe(false);
      expect(isValidSessionName('session\rreturn')).toBe(false);
      expect(isValidSessionName('session\0null')).toBe(false);
    });

    it('rejects path traversal attempts', () => {
      expect(isValidSessionName('../session1')).toBe(false);
      expect(isValidSessionName('../../etc/passwd')).toBe(false);
      expect(isValidSessionName('session1/subdir')).toBe(false);
      expect(isValidSessionName('session1\\subdir')).toBe(false);
      expect(isValidSessionName('..')).toBe(false);
      expect(isValidSessionName('.')).toBe(false);
    });

    it('rejects empty, null, or excessively long session names', () => {
      expect(isValidSessionName('')).toBe(false);
      expect(isValidSessionName('   ')).toBe(false);
      expect(isValidSessionName(null as any)).toBe(false);
      expect(isValidSessionName(undefined as any)).toBe(false);
      expect(isValidSessionName('a'.repeat(256))).toBe(false);
    });
  });

  describe('extractUserDataDir', () => {
    it('extracts unquoted user-data-dir paths', () => {
      const cmd =
        '/usr/bin/google-chrome --user-data-dir=/tmp/testUserDataDir/session1 --no-sandbox';
      expect(extractUserDataDir(cmd)).toBe('/tmp/testUserDataDir/session1');
    });

    it('extracts double-quoted user-data-dir paths with spaces', () => {
      const cmd =
        'chrome.exe --user-data-dir="C:\\Users\\User Data\\session1" --headless';
      expect(extractUserDataDir(cmd)).toBe('C:\\Users\\User Data\\session1');
    });

    it('extracts single-quoted user-data-dir paths', () => {
      const cmd =
        "chrome --user-data-dir='/tmp/User Data/session1' --disable-gpu";
      expect(extractUserDataDir(cmd)).toBe('/tmp/User Data/session1');
    });

    it('returns null if --user-data-dir is absent', () => {
      const cmd = '/usr/bin/google-chrome --type=renderer --no-sandbox';
      expect(extractUserDataDir(cmd)).toBeNull();
    });
  });

  describe('Name collision prevention (isUserDataDirForSession)', () => {
    it('matches the exact session directory', () => {
      const extracted = path.join(customUserDataDir, 'session1');
      expect(
        isUserDataDirForSession(extracted, customUserDataDir, 'session1')
      ).toBe(true);
    });

    it('rejects prefix/substring collisions (session1 vs session10)', () => {
      const extracted = path.join(customUserDataDir, 'session10');
      expect(
        isUserDataDirForSession(extracted, customUserDataDir, 'session1')
      ).toBe(false);
    });

    it('rejects suffix/substring collisions (session1 vs session1_backup)', () => {
      const extracted = path.join(customUserDataDir, 'session1_backup');
      expect(
        isUserDataDirForSession(extracted, customUserDataDir, 'session1')
      ).toBe(false);
    });

    it('rejects unrelated directories', () => {
      const extracted = path.join('/other/directory', 'session1');
      expect(
        isUserDataDirForSession(extracted, customUserDataDir, 'session1')
      ).toBe(false);
    });
  });

  describe('Child process tree aggregation (buildProcessTree)', () => {
    const processes: ProcessEntry[] = [
      { pid: 100, ppid: 1, command: 'chrome --user-data-dir=.../session1' },
      { pid: 101, ppid: 100, command: 'chrome --type=renderer' },
      { pid: 102, ppid: 100, command: 'chrome --type=gpu-process' },
      { pid: 103, ppid: 100, command: 'chrome --type=utility' },
      { pid: 104, ppid: 101, command: 'chrome --type=renderer (sub-worker)' },
      // Unrelated process from session 2
      { pid: 200, ppid: 1, command: 'chrome --user-data-dir=.../session2' },
      { pid: 201, ppid: 200, command: 'chrome --type=renderer' },
      // Unrelated system daemon
      { pid: 999, ppid: 1, command: '/usr/sbin/syslogd' },
    ];

    it('discovers all direct and transitive descendant processes for a root PID', () => {
      const pids = buildProcessTree([100], processes);
      expect(pids.sort((a, b) => a - b)).toEqual([100, 101, 102, 103, 104]);
    });

    it('does not include processes belonging to another session', () => {
      const pids = buildProcessTree([100], processes);
      expect(pids).not.toContain(200);
      expect(pids).not.toContain(201);
      expect(pids).not.toContain(999);
    });

    it('returns empty array when root PIDs are empty', () => {
      expect(buildProcessTree([], processes)).toEqual([]);
    });
  });

  describe('Process output parsers', () => {
    it('parses ps output correctly', () => {
      const psOutput = `
        1     0 /sbin/launchd
      100     1 /usr/bin/chrome --user-data-dir=/tmp/test/session1
      101   100 /usr/bin/chrome --type=renderer
      `;
      const parsed = parsePsOutput(psOutput);
      expect(parsed).toEqual([
        { pid: 1, ppid: 0, command: '/sbin/launchd' },
        {
          pid: 100,
          ppid: 1,
          command: '/usr/bin/chrome --user-data-dir=/tmp/test/session1',
        },
        { pid: 101, ppid: 100, command: '/usr/bin/chrome --type=renderer' },
      ]);
    });

    it('parses wmic CSV output correctly', () => {
      const wmicOutput = `Node,CommandLine,ParentProcessId,ProcessId\r\nHOST,"chrome.exe" --user-data-dir="C:\\test\\session1",1,100\r\nHOST,"chrome.exe" --type=renderer,100,101\r\n`;
      const parsed = parseWmicCsvOutput(wmicOutput);
      expect(parsed).toEqual([
        {
          pid: 100,
          ppid: 1,
          command: '"chrome.exe" --user-data-dir="C:\\test\\session1"',
        },
        { pid: 101, ppid: 100, command: '"chrome.exe" --type=renderer' },
      ]);
    });
  });

  describe('SessionResourceMonitor integration with mock process table', () => {
    const mockProcessList: ProcessEntry[] = [
      // Session 1 root + renderer + GPU
      {
        pid: 100,
        ppid: 1,
        command: `chrome --user-data-dir=${path.join(
          customUserDataDir,
          'session1'
        )}`,
      },
      { pid: 101, ppid: 100, command: 'chrome --type=renderer' },
      { pid: 102, ppid: 100, command: 'chrome --type=gpu-process' },

      // Session 10 (name collision probe: session1 vs session10)
      {
        pid: 200,
        ppid: 1,
        command: `chrome --user-data-dir=${path.join(
          customUserDataDir,
          'session10'
        )}`,
      },
      { pid: 201, ppid: 200, command: 'chrome --type=renderer' },
    ];

    it('rejects hostile session names without querying processes', async () => {
      const mockEnumerator = jest.fn().mockResolvedValue(mockProcessList);
      const monitor = new SessionResourceMonitor(
        customUserDataDir,
        5000,
        mockEnumerator
      );

      const usage = await monitor.getSessionUsage('session1; rm -rf /');
      expect(usage.status).toBe('not_running');
      expect(usage.message).toBe('Invalid session name');
      expect(mockEnumerator).not.toHaveBeenCalled();
    });

    it('isolates session1 and avoids name collision with session10', async () => {
      const mockEnumerator = jest.fn().mockResolvedValue(mockProcessList);
      const monitor = new SessionResourceMonitor(
        customUserDataDir,
        5000,
        mockEnumerator
      );

      mockPidusage.mockImplementation(async (pids: any) => {
        const stats: Record<number, any> = {};
        for (const pid of pids) {
          stats[pid] = { cpu: 5.0, memory: 50 * 1024 * 1024 };
        }
        return stats as any;
      });

      const usage = await monitor.getSessionUsage('session1');
      expect(usage.status).toBe('running');
      expect(usage.chromium?.pids.sort()).toEqual([100, 101, 102]);
      expect(usage.chromium?.processCount).toBe(3);
      // Ensure session10 PIDs are not included
      expect(usage.chromium?.pids).not.toContain(200);
      expect(usage.chromium?.pids).not.toContain(201);
    });

    it('aggregates complete process tree (renderer and GPU descendants)', async () => {
      const mockEnumerator = jest.fn().mockResolvedValue(mockProcessList);
      const monitor = new SessionResourceMonitor(
        customUserDataDir,
        5000,
        mockEnumerator
      );

      mockPidusage.mockImplementation(async (pids: any) => {
        const stats: Record<number, any> = {};
        for (const pid of pids) {
          stats[pid] = { cpu: 10.0, memory: 100 * 1024 * 1024 };
        }
        return stats as any;
      });

      const usage = await monitor.getSessionUsage('session1');
      expect(usage.chromium?.processCount).toBe(3);
      expect(usage.chromium?.cpu.raw).toBe(30.0);
      expect(usage.chromium?.memory.bytes).toBe(300 * 1024 * 1024);
    });

    it('falls back gracefully when stale/dead PIDs fail in batch pidusage', async () => {
      const mockEnumerator = jest.fn().mockResolvedValue(mockProcessList);
      const monitor = new SessionResourceMonitor(
        customUserDataDir,
        5000,
        mockEnumerator
      );

      // Batch call throws (e.g. process 102 exited right as we sampled)
      mockPidusage.mockRejectedValueOnce(new Error('No maching pid found'));
      // Single calls: 100 and 101 succeed, 102 fails
      mockPidusage.mockImplementation(async (pid: any) => {
        if (pid === 102) {
          throw new Error('No maching pid found');
        }
        return { cpu: 10.0, memory: 100 * 1024 * 1024 } as any;
      });

      const usage = await monitor.getSessionUsage('session1');
      expect(usage.status).toBe('running');
      expect(usage.chromium?.processCount).toBe(2);
      expect(usage.chromium?.pids.sort()).toEqual([100, 101]);
    });

    it('clears session cache and global cache correctly', async () => {
      const mockEnumerator = jest.fn().mockResolvedValue(mockProcessList);
      const monitor = new SessionResourceMonitor(
        customUserDataDir,
        60000,
        mockEnumerator
      );

      mockPidusage.mockResolvedValue({
        100: { cpu: 5.0, memory: 50 * 1024 * 1024 },
        101: { cpu: 5.0, memory: 50 * 1024 * 1024 },
        102: { cpu: 5.0, memory: 50 * 1024 * 1024 },
      } as any);

      await monitor.getSessionUsage('session1');
      expect(mockEnumerator).toHaveBeenCalledTimes(1);

      // Second call uses cache
      await monitor.getSessionUsage('session1');
      expect(mockEnumerator).toHaveBeenCalledTimes(1);

      // Clear session cache
      monitor.clearSessionCache('session1');
      await monitor.getSessionUsage('session1');
      expect(mockEnumerator).toHaveBeenCalledTimes(2);

      // Clear all cache
      monitor.clearCache();
      await monitor.getSessionUsage('session1');
      expect(mockEnumerator).toHaveBeenCalledTimes(3);
    });
  });
});
