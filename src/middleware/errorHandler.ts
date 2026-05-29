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

import { NextFunction, Request, Response } from 'express';

import {
  NotSupportedError,
  SessionNotReadyError,
} from '../core/provider/capabilities';

/**
 * Central Express error handler for the provider layer. Translates the typed
 * provider errors into standardized HTTP responses:
 *
 * - {@link NotSupportedError}  -> 501, when a route exercises a capability the
 *   active provider does not support (e.g. catalog on Baileys).
 * - {@link SessionNotReadyError} -> 404, when the session has no live provider.
 *
 * Any other error is passed through unchanged, so the existing per-controller
 * `returnError` (HTTP 500) behavior is preserved for everything else. Registered
 * after the routes in `initServer`.
 */
export function providerErrorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof NotSupportedError) {
    req.logger?.warn(err.message);
    res.status(err.httpStatus).json({
      status: 'not_supported',
      provider: err.providerId,
      capability: err.capability,
      message: err.message,
    });
    return;
  }

  if (err instanceof SessionNotReadyError) {
    req.logger?.warn(err.message);
    res.status(err.httpStatus).json({
      status: 'disconnected',
      session: err.session,
      message: err.message,
    });
    return;
  }

  next(err);
}
