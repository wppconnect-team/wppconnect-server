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

const register = new Prometheus.Registry();

export async function metrics(req: Request, res: Response) {
  /**
     #swagger.tags = ["Misc"]
     #swagger.autoBody=false
     #swagger.description = 'This endpoint can be used to check the status of API metrics. It returns a response with the collected metrics.'
     }
   */
  const register = new Prometheus.Registry();
  register.setDefaultLabels({
    app: 'wppconnect-server',
  });
  Prometheus.collectDefaultMetrics({ register });

  res.setHeader('Content-Type', register.contentType);
  register.metrics().then((data) => res.status(200).send(data));
}
export const prometheusRegister = register;
