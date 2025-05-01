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
import { NextFunction, Request, Response } from 'express';

import { clientsArray } from '../util/sessionUtil';

function formatSession(session: string) {
  return session.split(':')[0];
}

const verifyToken = (req: Request, res: Response, next: NextFunction): any => {
  const secureToken = req.serverOptions.secretKey;

  const { session } = req.params;
  const { authorization: token } = req.headers;
  if (!session)
    return res.status(401).send({ message: 'Session not informed' });

  try {
    let tokenDecrypt = '';
    let sessionDecrypt = '';

    try {
      sessionDecrypt = session.split(':')[0];
      tokenDecrypt = session
        .split(':')[1]
        .replace(/_/g, '/')
        .replace(/-/g, '+');
    } catch (error) {
      try {
        if (token && token !== '' && token.split(' ').length > 0) {
          const token_value = token.split(' ')[1];
          if (token_value)
            tokenDecrypt = token_value.replace(/_/g, '/').replace(/-/g, '+');
          else
            return res.status(401).json({
              message: 'Token is not present. Check your header and try again',
            });
        } else {
          return res.status(401).json({
            message: 'Token is not present. Check your header and try again',
          });
        }
      } catch (e) {
        req.logger.error(e);
        return res.status(401).json({
          error: 'Check that a Session and Token are correct',
          message: error,
        });
      }
    }

    bcrypt.compare(
      sessionDecrypt + secureToken,
      tokenDecrypt,
      function (err, result) {
        if (result) {
          req.session = formatSession(req.params.session);
          req.token = tokenDecrypt;
          req.client = clientsArray[req.session];
          next();
        } else {
          return res
            .status(401)
            .json({ error: 'Check that the Session and Token are correct' });
        }
      }
    );
  } catch (error) {
    req.logger.error(error);
    return res.status(401).json({
      error: 'Check that the Session and Token are correct.',
      message: error,
    });
  }
};

export default verifyToken;
