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

import config from '../config';
import { SessionResourceMonitor } from '../util/SessionResourceMonitor';

// Initialize the resource monitor with custom userDataDir from config
const resourceMonitor = new SessionResourceMonitor(
  config.customUserDataDir || './userDataDir/',
  5000 // 5 seconds cache
);

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
  try {
    const { session } = req.params;

    if (!session) {
      return res.status(400).json({
        success: false,
        error: 'Session name is required',
      });
    }

    const usage = await resourceMonitor.getSessionUsage(session);

    return res.json({
      success: true,
      data: usage,
    });
  } catch (error) {
    console.error('Error getting session resource usage:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get session resource usage',
      // message: error.message,
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
  const { secretkey } = req.params;
  const { authorization: token } = req.headers;

  let tokenDecrypt: any = '';

  if (secretkey === undefined) {
    tokenDecrypt = token?.split(' ')[0];
  } else {
    tokenDecrypt = secretkey;
  }

  if (tokenDecrypt !== req.serverOptions.secretKey) {
    res.status(400).json({
      response: false,
      message: 'The token is incorrect',
    });
  }

  try {
    const usage = await resourceMonitor.getAllSessionsUsage();

    return res.json({
      success: true,
      data: usage,
    });
  } catch (error) {
    console.error('Error getting all sessions resource usage:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get resource usage for all sessions',
      // message: error.message
    });
  }
}

/**
 * Clear resource monitor cache
 * POST /api/resource-usage/clear-cache
 */
export async function clearResourceCache(req: Request, res: Response) {
  try {
    const { session } = req.body;

    if (session) {
      resourceMonitor.clearSessionCache(session);
      return res.json({
        success: true,
        message: `Cache cleared for session: ${session}`,
      });
    } else {
      resourceMonitor.clearCache();
      return res.json({
        success: true,
        message: 'All cache cleared',
      });
    }
  } catch (error) {
    console.error('Error clearing resource cache:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to clear cache',
      // message: error.message
    });
  }
}
