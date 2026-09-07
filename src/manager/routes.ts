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
import bcrypt from 'bcrypt';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { promises as fs } from 'fs';
import path from 'path';

import { version } from '../../package.json';
import { clientsArray } from '../util/sessionUtil';
import Factory from '../util/tokenStore/factory';
import { isAdmin, sessionAuthorized, validSession } from './auth';

export const managerRoutes = Router();
managerRoutes.use(
  rateLimit({
    windowMs: 60_000,
    limit: 60,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (_req, res) =>
      res.status(429).json({ message: 'Too many requests. Try again later.' }),
  })
);
managerRoutes.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});
managerRoutes.get('/info', (_req, res) => {
  res.json({
    protocol: 1,
    serverVersion: version,
    features: ['sessions', 'chat', 'contacts', 'groups', 'media'],
  });
});
managerRoutes.post('/verify', async (req, res) => {
  const token = req.headers.authorization?.replace(/^Bearer /, '');
  const authorized = await sessionAuthorized(
    req.body.session,
    token,
    req.serverOptions.secretKey
  );
  res.status(authorized ? 200 : 401).json({ authorized });
});
managerRoutes.use((req, res, next) => {
  const token = req.headers.authorization?.replace(/^Bearer /, '');
  if (!isAdmin(token, req.serverOptions.secretKey))
    return res.status(401).json({ message: 'Unauthorized' });
  next();
});
managerRoutes.get('/sessions', async (req, res) => {
  try {
    const store = new Factory().createTokenStory(null);
    const saved = await store.listTokens();
    const names = [
      ...new Set([...(saved || []), ...Object.keys(clientsArray)]),
    ];
    res.json({
      sessions: names.map((session) => ({
        session,
        status: (clientsArray[session] as any)?.status || 'CLOSED',
      })),
    });
  } catch {
    res.status(500).json({ message: 'Unable to list sessions' });
  }
});
managerRoutes.param('session', (req, res, next, session) => {
  if (!validSession(session))
    return res.status(400).json({ message: 'Invalid session name' });
  next();
});
managerRoutes.post('/sessions/:session/token', async (req, res) => {
  try {
    const token = await bcrypt.hash(
      req.params.session + req.serverOptions.secretKey,
      10
    );
    res.status(201).json({
      session: req.params.session,
      token: token.replace(/\//g, '_').replace(/\+/g, '-'),
    });
  } catch {
    res.status(500).json({ message: 'Unable to generate token' });
  }
});
managerRoutes.delete('/sessions/:session', async (req, res) => {
  const session = req.params.session;
  try {
    const client = clientsArray[session];
    if (client?.status && !['CLOSED', 'DISCONNECTED'].includes(client.status)) {
      return res
        .status(409)
        .json({ message: 'Close the session before clearing its data' });
    }
    const root = path.resolve(req.serverOptions.customUserDataDir);
    const leaf = path.basename(session);
    if (leaf !== session || leaf === '.' || leaf === '..')
      return res.status(400).json({ message: 'Invalid session path' });
    const target = path.resolve(root, leaf);
    if (path.dirname(target) !== root)
      return res.status(400).json({ message: 'Invalid session path' });
    // Do not follow a user-data symlink outside the configured directory.
    const stat = await fs.lstat(target).catch((error) => {
      if (error.code !== 'ENOENT') throw error;
      return null;
    });
    if (stat?.isSymbolicLink())
      return res
        .status(409)
        .json({ message: 'Symlink session directories cannot be cleared' });
    const store = new Factory().createTokenStory(null);
    const saved = await store.listTokens();
    if (saved.includes(session) && !(await store.removeToken(session))) {
      return res
        .status(500)
        .json({ message: 'Unable to remove session token' });
    }
    await fs.rm(target, { recursive: true, force: true });
    delete clientsArray[session];
    res.json({ success: true });
  } catch {
    res.status(500).json({ message: 'Unable to clear session data' });
  }
});
