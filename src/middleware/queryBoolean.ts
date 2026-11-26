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

import { RequestHandler } from 'express';

function parseBooleans(value: unknown): unknown {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (Array.isArray(value)) return value.map(parseBooleans);
  if (value !== null && typeof value === 'object') {
    // Entries also work for null-prototype query objects. fromEntries creates
    // own data properties even for keys such as __proto__ and constructor.
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, parseBooleans(entry)])
    );
  }
  return value;
}

export const queryBoolean: RequestHandler = (req, _res, next) => {
  // Express 5 exposes query through a getter; assignment alone is ineffective.
  // Cache the converted value as an own property for all downstream handlers.
  Object.defineProperty(req, 'query', {
    value: parseBooleans(req.query),
    writable: true,
    enumerable: true,
    configurable: true,
  });
  next();
};
