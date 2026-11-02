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

import { execFile } from 'child_process';
import fs from 'fs';
import path from 'path';
import pidusage from 'pidusage';
import { promisify } from 'util';

const execFilePromise = promisify(execFile);

export interface ProcessEntry {
  pid: number;
  ppid: number;
  command: string;
}

export type ProcessEnumerator = () => Promise<ProcessEntry[]>;

export interface ProcessUsage {
  cpu: number;
  memory: number;
  count: number;
  processes: number[];
}

export interface SessionUsageResult {
  sessionName: string;
  status: 'running' | 'not_running';
  message?: string;
  chromium?: {
    processCount: number;
    pids: number[];
    cpu: {
      percentage: string;
      raw: number;
    };
    memory: {
      mb: string;
      gb: string;
      bytes: number;
    };
  };
  timestamp: string;
}

export interface AllSessionsUsageResult {
  sessions: SessionUsageResult[];
  summary: {
    totalSessions: number;
    runningSessions: number;
    totalCpu: string;
    totalMemory: string;
  };
}

interface CacheEntry {
  pids: number[];
  timestamp: number;
}

/**
 * Validate that a session name is safe and does not contain hostile characters,
 * path traversal sequences, or shell metacharacters.
 */
export function isValidSessionName(sessionName: string): boolean {
  if (!sessionName || typeof sessionName !== 'string') {
    return false;
  }
  const trimmed = sessionName.trim();
  if (trimmed.length === 0 || trimmed.length > 255) {
    return false;
  }
  // Disallow path traversal or directory separators
  if (
    trimmed === '.' ||
    trimmed === '..' ||
    trimmed.includes('..') ||
    trimmed.includes('/') ||
    trimmed.includes('\\')
  ) {
    return false;
  }
  // Disallow null bytes and shell metacharacters
  if (trimmed.includes('\0') || /[\r\n;&|`$><"'\\]/.test(trimmed)) {
    return false;
  }
  // Allow alphanumeric, underscores, hyphens, periods, colons
  return /^[a-zA-Z0-9_\-.:]+$/.test(trimmed);
}

/**
 * Extract --user-data-dir path value from a process command line.
 */
export function extractUserDataDir(command: string): string | null {
  if (!command || !command.includes('--user-data-dir')) {
    return null;
  }
  const match = command.match(/--user-data-dir=(?:"([^"]+)"|'([^']+)'|(\S+))/);
  if (!match) return null;
  return match[1] ?? match[2] ?? match[3] ?? null;
}

/**
 * Verify whether an extracted user-data-dir matches the expected session path exactly,
 * preventing prefix/substring collisions (e.g. session1 vs session10).
 */
export function isUserDataDirForSession(
  extractedDir: string,
  customUserDataDir: string,
  sessionName: string
): boolean {
  if (!extractedDir || !sessionName) return false;
  const resolvedTarget = path.resolve(customUserDataDir, sessionName);
  const resolvedExtracted = path.resolve(extractedDir);

  if (process.platform === 'win32') {
    return resolvedExtracted.toLowerCase() === resolvedTarget.toLowerCase();
  }
  return resolvedExtracted === resolvedTarget;
}

/**
 * Given root browser PIDs, transitively discover all child processes (renderers, GPU, utilities).
 */
export function buildProcessTree(
  rootPids: number[],
  allProcesses: ProcessEntry[]
): number[] {
  if (rootPids.length === 0) return [];

  const childrenMap = new Map<number, number[]>();
  for (const proc of allProcesses) {
    if (!childrenMap.has(proc.ppid)) {
      childrenMap.set(proc.ppid, []);
    }
    childrenMap.get(proc.ppid)!.push(proc.pid);
  }

  const collected = new Set<number>();
  const queue = [...rootPids];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (collected.has(current)) continue;
    collected.add(current);

    const children = childrenMap.get(current);
    if (children) {
      for (const child of children) {
        if (!collected.has(child)) {
          queue.push(child);
        }
      }
    }
  }

  return Array.from(collected);
}

/**
 * Parse standard POSIX `ps -ax -o pid=,ppid=,args=` output without invoking a shell.
 */
export function parsePsOutput(stdout: string): ProcessEntry[] {
  const lines = stdout.split('\n');
  const entries: ProcessEntry[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const match = line.match(/^(\d+)\s+(\d+)\s+(.*)$/);
    if (!match) continue;

    const pid = parseInt(match[1], 10);
    const ppid = parseInt(match[2], 10);
    const command = match[3] || '';

    if (!isNaN(pid) && !isNaN(ppid)) {
      entries.push({ pid, ppid, command });
    }
  }

  return entries;
}

/**
 * Parse Windows WMIC CSV output safely.
 */
export function parseWmicCsvOutput(stdout: string): ProcessEntry[] {
  const lines = stdout.split(/\r?\n/);
  const entries: ProcessEntry[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('Node,')) continue;

    const lastComma = line.lastIndexOf(',');
    if (lastComma === -1) continue;
    const pidStr = line.slice(lastComma + 1).trim();
    const rest = line.slice(0, lastComma);

    const secondLastComma = rest.lastIndexOf(',');
    if (secondLastComma === -1) continue;
    const ppidStr = rest.slice(secondLastComma + 1).trim();
    const commandWithNode = rest.slice(0, secondLastComma);

    const firstComma = commandWithNode.indexOf(',');
    const command =
      firstComma !== -1
        ? commandWithNode.slice(firstComma + 1).trim()
        : commandWithNode;

    const pid = parseInt(pidStr, 10);
    const ppid = parseInt(ppidStr, 10);
    if (!isNaN(pid) && !isNaN(ppid)) {
      entries.push({ pid, ppid, command });
    }
  }
  return entries;
}

/**
 * Parse Windows PowerShell output formatted as `PID|PPID|CommandLine`.
 */
export function parsePowershellOutput(stdout: string): ProcessEntry[] {
  const lines = stdout.split(/\r?\n/);
  const entries: ProcessEntry[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    const parts = line.split('|');
    if (parts.length >= 3) {
      const pid = parseInt(parts[0].trim(), 10);
      const ppid = parseInt(parts[1].trim(), 10);
      const command = parts.slice(2).join('|').trim();
      if (!isNaN(pid) && !isNaN(ppid)) {
        entries.push({ pid, ppid, command });
      }
    }
  }
  return entries;
}

/**
 * Default process enumerator using argument-based execFile (no shell interpolation).
 */
export async function defaultProcessEnumerator(): Promise<ProcessEntry[]> {
  const isWindows = process.platform === 'win32';

  if (isWindows) {
    try {
      const { stdout } = await execFilePromise(
        'wmic',
        [
          'process',
          'get',
          'CommandLine,ParentProcessId,ProcessId',
          '/format:csv',
        ],
        { maxBuffer: 20 * 1024 * 1024, windowsHide: true }
      );
      return parseWmicCsvOutput(stdout);
    } catch {
      try {
        const { stdout } = await execFilePromise(
          'powershell.exe',
          [
            '-NoProfile',
            '-NonInteractive',
            '-Command',
            'Get-CimInstance Win32_Process | ForEach-Object { "$($_.ProcessId)|$($_.ParentProcessId)|$($_.CommandLine)" }',
          ],
          { maxBuffer: 20 * 1024 * 1024, windowsHide: true }
        );
        return parsePowershellOutput(stdout);
      } catch {
        return [];
      }
    }
  } else {
    try {
      const { stdout } = await execFilePromise(
        'ps',
        ['-ax', '-o', 'pid=,ppid=,args='],
        { maxBuffer: 20 * 1024 * 1024 }
      );
      return parsePsOutput(stdout);
    } catch {
      return [];
    }
  }
}

/**
 * SessionResourceMonitor - Monitors resource usage of Chromium processes for each session.
 *
 * Tracks CPU and memory usage of individual WhatsApp sessions by discovering their
 * root browser processes via exact user-data-dir matching and recursively aggregating
 * all child processes (renderers, GPU, utilities).
 */
export class SessionResourceMonitor {
  private cache: Map<string, CacheEntry>;
  private cacheDuration: number;
  private customUserDataDir: string;
  private processEnumerator: ProcessEnumerator;

  constructor(
    customUserDataDir: string = './userDataDir/',
    cacheDuration: number = 5000,
    processEnumerator: ProcessEnumerator = defaultProcessEnumerator
  ) {
    this.cache = new Map();
    this.cacheDuration = cacheDuration;
    this.customUserDataDir = customUserDataDir;
    this.processEnumerator = processEnumerator;
  }

  /**
   * Find all Chromium process PIDs associated with a session, including renderer and GPU descendants.
   * @param sessionName - The name of the session
   * @returns Array of process IDs
   */
  private async findSessionProcesses(sessionName: string): Promise<number[]> {
    if (!isValidSessionName(sessionName)) {
      return [];
    }

    try {
      const allProcesses = await this.processEnumerator();
      if (!allProcesses || allProcesses.length === 0) {
        return [];
      }

      // 1. Locate root Chromium processes matching the exact userDataDir
      const rootPids: number[] = [];
      for (const proc of allProcesses) {
        const extracted = extractUserDataDir(proc.command);
        if (
          extracted &&
          isUserDataDirForSession(
            extracted,
            this.customUserDataDir,
            sessionName
          )
        ) {
          rootPids.push(proc.pid);
        }
      }

      if (rootPids.length === 0) {
        return [];
      }

      // 2. Discover all descendant processes (renderers, GPU, utility)
      return buildProcessTree(rootPids, allProcesses);
    } catch {
      return [];
    }
  }

  /**
   * Find session processes with caching to reduce system calls.
   * @param sessionName - The name of the session
   * @returns Array of process IDs
   */
  private async findSessionProcessesCached(
    sessionName: string
  ): Promise<number[]> {
    const cached = this.cache.get(sessionName);
    const now = Date.now();

    if (cached && now - cached.timestamp < this.cacheDuration) {
      return cached.pids;
    }

    const pids = await this.findSessionProcesses(sessionName);
    this.cache.set(sessionName, { pids, timestamp: now });

    return pids;
  }

  /**
   * Get resource usage for multiple PIDs.
   * @param pids - Array of process IDs
   * @returns Aggregated CPU and memory usage
   */
  private async getProcessesUsage(pids: number[]): Promise<ProcessUsage> {
    if (!pids || pids.length === 0) {
      return { cpu: 0, memory: 0, count: 0, processes: [] };
    }

    try {
      const stats = await pidusage(pids);

      let totalCpu = 0;
      let totalMemory = 0;
      const validPids: number[] = [];

      for (const pid of pids) {
        if (stats && stats[pid]) {
          totalCpu += stats[pid].cpu || 0;
          totalMemory += stats[pid].memory || 0;
          validPids.push(pid);
        }
      }

      return {
        cpu: totalCpu,
        memory: totalMemory,
        count: validPids.length,
        processes: validPids,
      };
    } catch (error) {
      // Fallback for stale/exited PIDs: query each PID individually and filter out dead ones
      let totalCpu = 0;
      let totalMemory = 0;
      const validPids: number[] = [];

      for (const pid of pids) {
        try {
          const stat = await pidusage(pid);
          if (stat) {
            totalCpu += stat.cpu || 0;
            totalMemory += stat.memory || 0;
            validPids.push(pid);
          }
        } catch {
          // Ignore dead process
        }
      }

      return {
        cpu: totalCpu,
        memory: totalMemory,
        count: validPids.length,
        processes: validPids,
      };
    }
  }

  /**
   * Get resource usage for a specific session.
   * @param sessionName - The name of the session
   * @returns Session usage information
   */
  public async getSessionUsage(
    sessionName: string
  ): Promise<SessionUsageResult> {
    if (!isValidSessionName(sessionName)) {
      return {
        sessionName,
        status: 'not_running',
        message: 'Invalid session name',
        timestamp: new Date().toISOString(),
      };
    }

    const pids = await this.findSessionProcessesCached(sessionName);

    if (pids.length === 0) {
      return {
        sessionName,
        status: 'not_running',
        message: 'No Chromium processes found for this session',
        timestamp: new Date().toISOString(),
      };
    }

    const usage = await this.getProcessesUsage(pids);

    if (usage.count === 0) {
      return {
        sessionName,
        status: 'not_running',
        message: 'No Chromium processes found for this session',
        timestamp: new Date().toISOString(),
      };
    }

    return {
      sessionName,
      status: 'running',
      chromium: {
        processCount: usage.count,
        pids: usage.processes,
        cpu: {
          percentage: `${usage.cpu.toFixed(2)}%`,
          raw: usage.cpu,
        },
        memory: {
          mb: `${(usage.memory / 1024 / 1024).toFixed(2)} MB`,
          gb: `${(usage.memory / 1024 / 1024 / 1024).toFixed(3)} GB`,
          bytes: usage.memory,
        },
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get resource usage for all sessions.
   * @returns Usage information for all sessions with summary
   */
  public async getAllSessionsUsage(): Promise<AllSessionsUsageResult> {
    const sessionNames = await this.getSessionNames();

    const results: SessionUsageResult[] = [];
    let totalCpu = 0;
    let totalMemory = 0;

    for (const sessionName of sessionNames) {
      const usage = await this.getSessionUsage(sessionName);
      if (usage.status === 'running' && usage.chromium) {
        results.push(usage);
        totalCpu += usage.chromium.cpu.raw;
        totalMemory += usage.chromium.memory.bytes;
      }
    }

    return {
      sessions: results,
      summary: {
        totalSessions: sessionNames.length,
        runningSessions: results.length,
        totalCpu: `${totalCpu.toFixed(2)}%`,
        totalMemory: `${(totalMemory / 1024 / 1024).toFixed(2)} MB`,
      },
    };
  }

  /**
   * Get all session names from userDataDir.
   * @returns Array of session names
   */
  private async getSessionNames(): Promise<string[]> {
    try {
      if (!fs.existsSync(this.customUserDataDir)) {
        return [];
      }

      const files = fs.readdirSync(this.customUserDataDir);

      return files.filter((file) => {
        if (!isValidSessionName(file)) return false;
        const fullPath = path.join(this.customUserDataDir, file);
        return fs.statSync(fullPath).isDirectory();
      });
    } catch (error) {
      console.error('Error reading session directories:', error);
      return [];
    }
  }

  /**
   * Clear the PIDs cache.
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Clear cache for a specific session.
   * @param sessionName - The name of the session
   */
  public clearSessionCache(sessionName: string): void {
    this.cache.delete(sessionName);
  }
}
