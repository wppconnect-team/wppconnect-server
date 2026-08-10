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

import { SessionResourceMonitor } from '../util/SessionResourceMonitor';

function getResourceMonitor(req: Request): SessionResourceMonitor {
  const customUserDataDir =
    req.serverOptions?.customUserDataDir || './userDataDir/';
  const cacheDuration =
    req.serverOptions?.resourceMonitor?.cacheDuration || 5000;
  return new SessionResourceMonitor(customUserDataDir, cacheDuration);
}

function isResourceMonitorEnabled(req: Request): boolean {
  return Boolean(req.serverOptions?.resourceMonitor?.enable);
}

/**
 * Get resource usage for a specific session
 * GET /api/:session/resource-usage
 */
export async function getSessionResourceUsage(req: Request, res: Response) {
  /**
   * #swagger.tags = ["Auth"]
   #swagger.operationId = 'SessionResourceUsage'
   #swagger.autoBody=false
   #swagger.security = [{
   "bearerAuth": []
   }]
   #swagger.parameters["session"] = {
   schema: 'NERDWHATS_AMERICA'
   }
   */
  if (!isResourceMonitorEnabled(req)) {
    return res.status(403).json({
      success: false,
      message: 'Resource monitoring is disabled in server configuration',
    });
  }

  try {
    const { session } = req.params;

    if (!session) {
      return res.status(400).json({
        success: false,
        error: 'Session name is required',
      });
    }

    const monitor = getResourceMonitor(req);
    const usage = await monitor.getSessionUsage(session);

    return res.json({
      success: true,
      data: usage,
    });
  } catch (error) {
    req.logger?.error(error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get session resource usage',
    });
  }
}

/**
 * Get resource usage for all sessions
 * GET /api/sessions/resource-usage
 */
export async function getAllSessionsResourceUsage(req: Request, res: Response) {
  /**
   * #swagger.tags = ["Auth"]
   #swagger.autoBody=false
   #swagger.operationId = 'AllSessionsResourceUsage'
   #swagger.autoQuery=false
   #swagger.autoHeaders=false
   #swagger.security = [{
   "bearerAuth": []
   }]
   #swagger.parameters["secretkey"] = {
   schema: 'THISISMYSECURETOKEN'
   }
   */
  if (!isResourceMonitorEnabled(req)) {
    return res.status(403).json({
      success: false,
      message: 'Resource monitoring is disabled in server configuration',
    });
  }

  const { secretkey } = req.params;
  const { authorization: token } = req.headers;

  let tokenDecrypt: any = '';

  if (secretkey === undefined) {
    tokenDecrypt = token?.split(' ')[0];
  } else {
    tokenDecrypt = secretkey;
  }

  if (tokenDecrypt !== req.serverOptions.secretKey) {
    return res.status(400).json({
      response: false,
      message: 'The token is incorrect',
    });
  }

  try {
    const monitor = getResourceMonitor(req);
    const usage = await monitor.getAllSessionsUsage();

    return res.json({
      success: true,
      data: usage,
    });
  } catch (error) {
    req.logger?.error(error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get resource usage for all sessions',
    });
  }
}

/**
 * Clear resource monitor cache
 * POST /api/resource-usage/clear-cache
 */
export async function clearResourceCache(req: Request, res: Response) {
  if (!isResourceMonitorEnabled(req)) {
    return res.status(403).json({
      success: false,
      message: 'Resource monitoring is disabled in server configuration',
    });
  }

  try {
    const { session } = req.body;
    const monitor = getResourceMonitor(req);

    if (session) {
      monitor.clearSessionCache(session);
      return res.json({
        success: true,
        message: `Cache cleared for session: ${session}`,
      });
    } else {
      monitor.clearCache();
      return res.json({
        success: true,
        message: 'All cache cleared',
      });
    }
  } catch (error) {
    req.logger?.error(error);
    return res.status(500).json({
      success: false,
      error: 'Failed to clear cache',
    });
  }
}
