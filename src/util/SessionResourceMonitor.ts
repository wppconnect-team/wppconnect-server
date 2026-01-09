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

import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import pidusage from 'pidusage';
import { promisify } from 'util';

const execPromise = promisify(exec);

interface ProcessUsage {
  cpu: number;
  memory: number;
  count: number;
  processes: number[];
}

interface SessionUsageResult {
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

interface AllSessionsUsageResult {
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
 * SessionResourceMonitor - Monitors resource usage of Chromium processes for each session
 *
 * This class provides functionality to track CPU and memory usage of individual
 * WhatsApp sessions by monitoring their associated Chromium browser processes.
 */
export class SessionResourceMonitor {
  private cache: Map<string, CacheEntry>;
  private cacheDuration: number;
  private customUserDataDir: string;

  constructor(
    customUserDataDir: string = './userDataDir/',
    cacheDuration: number = 5000
  ) {
    this.cache = new Map();
    this.cacheDuration = cacheDuration; // 5 seconds default
    this.customUserDataDir = customUserDataDir;
  }

  /**
   * Find all Chromium process PIDs associated with a session
   * @param sessionName - The name of the session
   * @returns Array of process IDs
   */
  private async findSessionProcesses(sessionName: string): Promise<number[]> {
    try {
      // Determine platform
      const isWindows = process.platform === 'win32';

      if (isWindows) {
        // Windows command to find Chrome processes by userDataDir
        const { stdout } = await execPromise(
          `wmic process where "commandline like '%${sessionName}%' and name='chrome.exe'" get processid`
        );

        const pids = stdout
          .split('\n')
          .slice(1) // Skip header
          .map((line) => parseInt(line.trim()))
          .filter((pid) => !isNaN(pid));

        return pids;
      } else {
        // Linux/Mac command
        const { stdout } = await execPromise(
          `ps aux | grep "user-data-dir.*${sessionName}" | grep -v grep || true`
        );

        if (!stdout.trim()) {
          return [];
        }

        const lines = stdout
          .trim()
          .split('\n')
          .filter((l) => l);
        const pids = lines
          .map((line) => {
            const parts = line.trim().split(/\s+/);
            return parseInt(parts[1]); // PID is second column
          })
          .filter((pid) => !isNaN(pid));

        return pids;
      }
    } catch (error) {
      // Session not running or error occurred
      return [];
    }
  }

  /**
   * Find session processes with caching to reduce system calls
   * @param sessionName - The name of the session
   * @returns Array of process IDs
   */
  private async findSessionProcessesCached(
    sessionName: string
  ): Promise<number[]> {
    const cached = this.cache.get(sessionName);
    const now = Date.now();

    // Use cache if still valid
    if (cached && now - cached.timestamp < this.cacheDuration) {
      return cached.pids;
    }

    // Cache expired or doesn't exist, fetch new data
    const pids = await this.findSessionProcesses(sessionName);
    this.cache.set(sessionName, { pids, timestamp: now });

    return pids;
  }

  /**
   * Get resource usage for multiple PIDs
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

      // Chromium creates multiple processes (main + renderers + GPU)
      for (const pid of pids) {
        if (stats[pid]) {
          totalCpu += stats[pid].cpu;
          totalMemory += stats[pid].memory;
        }
      }

      return {
        cpu: totalCpu,
        memory: totalMemory,
        count: pids.length,
        processes: pids,
      };
    } catch (error) {
      console.error('Error getting process usage:', error);
      return { cpu: 0, memory: 0, count: 0, processes: [] };
    }
  }

  /**
   * Get resource usage for a specific session
   * @param sessionName - The name of the session
   * @returns Session usage information
   */
  public async getSessionUsage(
    sessionName: string
  ): Promise<SessionUsageResult> {
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
   * Get resource usage for all sessions
   * @returns Usage information for all sessions with summary
   */
  public async getAllSessionsUsage(): Promise<AllSessionsUsageResult> {
    try {
      // Get all session directories
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
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all session names from userDataDir
   * @returns Array of session names
   */
  private async getSessionNames(): Promise<string[]> {
    try {
      if (!fs.existsSync(this.customUserDataDir)) {
        return [];
      }

      const files = fs.readdirSync(this.customUserDataDir);

      // Filter only directories (sessions)
      return files.filter((file) => {
        const fullPath = path.join(this.customUserDataDir, file);
        return fs.statSync(fullPath).isDirectory();
      });
    } catch (error) {
      console.error('Error reading session directories:', error);
      return [];
    }
  }

  /**
   * Clear the PIDs cache
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Clear cache for a specific session
   * @param sessionName - The name of the session
   */
  public clearSessionCache(sessionName: string): void {
    this.cache.delete(sessionName);
  }
}
