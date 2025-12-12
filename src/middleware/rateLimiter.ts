/*
 * Copyright 2024 WPPConnect Team
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

import { NextFunction, Request, Response } from 'express';
import { rateLimit } from 'express-rate-limit';

// Store for rate limiters by endpoint
const endpointLimiters: { [endpoint: string]: any } = {};

/**
 * Creates a rate limiter for a specific endpoint
 */
const createEndpointLimiter = (
  endpoint: string,
  windowMs: number,
  maxRequests: number
) => {
  return rateLimit({
    windowMs,
    max: maxRequests,
    standardHeaders: true,
    legacyHeaders: false,

    // Custom key generator to use session instead of IP
    keyGenerator: (req: Request) => req.params.session || 'default',

    // Custom handler for when rate limit is exceeded
    handler: (req: Request, res: Response) => {
      req.logger.warn(
        `Rate limit exceeded for session ${req.params.session} on endpoint ${endpoint}`
      );
      return res.status(429).json({
        status: 'error',
        message: 'Too many requests, please try again later.',
        session: req.params.session,
        endpoint,
        limitResetTime: new Date(Date.now() + windowMs).toISOString(),
      });
    },
  });
};

/**
 * Initialize rate limiters for all possible endpoints
 */
export const initializeRateLimiters = (config: {
  windowMs: number;
  defaultMax: number;
  endpoints: { [key: string]: number };
}) => {
  // Create rate limiters for all possible endpoints
  const allEndpoints = Object.keys(config.endpoints);

  allEndpoints.forEach((endpoint) => {
    const maxRequests = config.endpoints[endpoint] || config.defaultMax;
    endpointLimiters[endpoint] = createEndpointLimiter(
      endpoint,
      config.windowMs,
      maxRequests
    );
  });

  // Create a default limiter as fallback for any endpoint not explicitly configured
  endpointLimiters['default'] = createEndpointLimiter(
    'default',
    config.windowMs,
    config.defaultMax
  );
};

/**
 * Returns a rate limiter middleware that limits by WhatsApp session/token
 * instead of by IP address
 */
export const createSessionRateLimiter = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Skip if rate limiting is disabled
  if (!req.serverOptions.rateLimiting?.enabled) {
    return next();
  }

  const { session } = req.params;

  if (!session) {
    return next();
  }

  // Get the endpoint from the path
  const path = req.path;
  const endpoint = path.split('/').filter(Boolean).pop() || '';

  // Use the endpoint-specific limiter if it exists, otherwise use the default
  const limiter = endpointLimiters[endpoint] || endpointLimiters['default'];

  // Apply the rate limiter
  limiter(req, res, next);
};

export default createSessionRateLimiter;
