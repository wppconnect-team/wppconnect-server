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
import express, { Express } from 'express';
import rateLimit from 'express-rate-limit';
import { existsSync } from 'fs';
import path from 'path';

export function installManagerStatic(
  app: Express,
  directory = process.env.MANAGER_DIST || path.resolve('manager')
) {
  if (
    process.env.MANAGER_ENABLED === 'false' ||
    !existsSync(path.join(directory, 'index.html'))
  )
    return;
  app.use(
    '/manager',
    rateLimit({
      windowMs: 60_000,
      limit: 300,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      handler: (_req, res) =>
        res
          .status(429)
          .json({ message: 'Too many requests. Try again later.' }),
    })
  );
  app.get('/manager', (req, res, next) =>
    req.path.endsWith('/') ? next() : res.redirect('/manager/')
  );
  app.use('/manager', express.static(directory, { index: 'index.html' }));
  app.get('/manager/*', (req, res, next) => {
    if (path.extname(req.path)) return next();
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(path.resolve(directory, 'index.html'));
  });
}
