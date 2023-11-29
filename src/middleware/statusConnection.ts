import { Message } from '@wppconnect-team/wppconnect';
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

import { contactToArray } from '../util/functions';

export default async function statusConnection(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const numbers: any = [];
    if (req.client && req.client.isConnected) {
      await req.client.isConnected();

      if (req.body.messages) {
        const arrErrors: any[] = [];
        const newMessages: any[] = [];
        for (const message of req.body.messages) {
          const localArr = contactToArray(message.phone, false);
          let index = 0;
          for (const contact of localArr) {
            if (req.body.isGroup) {
              localArr[index] = contact;
            } else if (numbers.indexOf(contact) < 0) {
              const profile: any = await req.client
                .checkNumberStatus(contact)
                .catch((error) => console.log(error));
              if (!profile?.numberExists) {
                const num = (contact as any).split('@')[0];
                arrErrors.push({
                  response: {
                    error: 'notExists',
                    phone: num,
                    nome: req.body.name,
                  },
                  status: 'Connected',
                  message: `O número ${num} não existe.`,
                });
              } else {
                if ((numbers as any).indexOf(profile.id._serialized) < 0) {
                  (numbers as any).push(profile.id._serialized);
                }
                (localArr as any)[index] = profile.id._serialized;
              }
            }
            index++;
          }
          newMessages.push({ ...message, phone: localArr });
        }
        if (arrErrors.length > 0) {
          return res.status(400).json(arrErrors);
        } else {
          req.body.messsages = newMessages;
        }
      } else {
        const localArr = contactToArray(req.body.phone || [], req.body.isGroup);
        let index = 0;
        for (const contact of localArr) {
          if (req.body.isGroup) {
            localArr[index] = contact;
          } else if (numbers.indexOf(contact) < 0) {
            const profile: any = await req.client
              .checkNumberStatus(contact)
              .catch((error) => console.log(error));
            if (!profile?.numberExists) {
              const num = (contact as any).split('@')[0];
              return res.status(400).json({
                response: {
                  error: 'notExists',
                  phone: num,
                  nome: req.body.name,
                },
                status: 'Connected',
                message: `O número ${num} não existe.`,
              });
            } else {
              if ((numbers as any).indexOf(profile.id._serialized) < 0) {
                (numbers as any).push(profile.id._serialized);
              }
              (localArr as any)[index] = profile.id._serialized;
            }
          }
          index++;
        }
        req.body.phone = localArr;
      }
    } else {
      return res.status(404).json({
        response: null,
        status: 'Disconnected',
        message: 'A sessão do WhatsApp não está ativa.',
      });
    }
    next();
  } catch (error) {
    req.logger.error(error);
    return res.status(404).json({
      response: null,
      status: 'Disconnected',
      message: 'A sessão do WhatsApp não está ativa.',
    });
  }
}
