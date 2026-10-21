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
import { Server } from 'socket.io';

import { sessionAuthorized } from './auth';

export function installManagerSocket(io: Server, secret: string) {
  const namespace = io.of('/manager');
  namespace.use(async (socket, next) => {
    const { session, token } = socket.handshake.auth;
    if (!(await sessionAuthorized(session, token, secret)))
      return next(new Error('Unauthorized'));
    socket.data.session = session;
    next();
  });
  namespace.on('connection', (socket) => {
    // Session is fixed by the authenticated handshake. No client-controlled room joins.
    socket.join(`session:${socket.data.session}`);
  });
}

export function emitManager(
  io: Server,
  session: string,
  event: string,
  data: unknown
) {
  io.of('/manager').to(`session:${session}`).emit(event, { session, data });
}
