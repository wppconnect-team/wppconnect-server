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
import { Response } from 'express';
import { Request } from '../types/request-types';

const saltRounds = 10;

export async function encryptSession(req: Request, res: Response) {
  /* 
    #swagger.tags = ['Auth'] 
    #swagger.parameters = [
      {
        "name": "session",
        "default": "NERDWHATS_AMERICA",
        "in": "path",
        "description": "Nome da sessão",
        "required": true,
      },
      {
        "name": "secretkey",
        "default": "THISISMYSECURETOKEN",
        "in": "path",
        "description": "(Required) chave do admin",
        "required": true,
      }
    ]
  */
  const { session, secretkey } = req.params;
  const { authorization: token } = req.headers;
  const secureTokenEnv = req.serverOptions.secretKey;

  let tokenDecrypt: string = '';

  if (secretkey === undefined) {
    tokenDecrypt = token?.split(' ')[0] as string;
  } else {
    tokenDecrypt = secretkey;
  }

  if (tokenDecrypt !== secureTokenEnv) {
    return res.status(400).json({
      response: false,
      message: 'The SECRET_KEY is incorrect',
    });
  }

  bcrypt.hash(session + secureTokenEnv, saltRounds, function (err, hash) {
    if (err) return res.status(500).json(err);

    const hashFormat = hash.replace(/\//g, '_').replace(/\+/g, '-');
    return res.status(201).json({
      status: 'success',
      session: session,
      token: hashFormat,
      full: `${session}:${hashFormat}`,
    });
  });
}
