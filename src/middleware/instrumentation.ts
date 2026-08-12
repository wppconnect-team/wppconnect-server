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

import { Request, Response } from 'express';
import Prometheus from 'prom-client';

import { getResourceMonitor } from '../controller/resourceController';

const register = new Prometheus.Registry();
register.setDefaultLabels({
  app: 'wppconnect-server',
});

Prometheus.collectDefaultMetrics({ register });

export const prometheusRegister = register;

export const sessionCpuGauge = new Prometheus.Gauge({
  name: 'wppconnect_session_cpu_usage_percentage',
  help: 'CPU usage percentage for WhatsApp session Chromium processes',
  labelNames: ['session'],
  registers: [prometheusRegister],
});

export const sessionMemoryGauge = new Prometheus.Gauge({
  name: 'wppconnect_session_memory_bytes',
  help: 'Memory usage in bytes for WhatsApp session Chromium processes',
  labelNames: ['session'],
  registers: [prometheusRegister],
});

export const sessionProcessCountGauge = new Prometheus.Gauge({
  name: 'wppconnect_session_process_count',
  help: 'Chromium process count for WhatsApp session',
  labelNames: ['session'],
  registers: [prometheusRegister],
});

export async function metrics(req: Request, res: Response) {
  /**
     #swagger.tags = ["Misc"]
     #swagger.autoBody=false
     #swagger.description = 'This endpoint can be used to check the status of API metrics. It returns a response with the collected metrics.'
   */
  if (req.serverOptions?.resourceMonitor?.enable) {
    try {
      const monitor = getResourceMonitor(req);
      const usage = await monitor.getAllSessionsUsage();
      for (const session of usage.sessions) {
        if (session.chromium) {
          sessionCpuGauge.set(
            { session: session.sessionName },
            session.chromium.cpu.raw
          );
          sessionMemoryGauge.set(
            { session: session.sessionName },
            session.chromium.memory.bytes
          );
          sessionProcessCountGauge.set(
            { session: session.sessionName },
            session.chromium.processCount
          );
        }
      }
    } catch (error) {
      req.logger?.error(error);
    }
  }

  res.setHeader('Content-Type', prometheusRegister.contentType);
  const data = await prometheusRegister.metrics();
  res.status(200).send(data);
}
