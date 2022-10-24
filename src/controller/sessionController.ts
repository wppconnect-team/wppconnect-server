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
import { clientsArray } from '../util/sessionUtil';
import { callWebHook, contactToArray } from '../util/functions';
import CreateSessionUtil from '../util/createSessionUtil';
import getAllTokens from '../util/getAllTokens';
import fs from 'fs';
import mime from 'mime-types';
//import { version } from '../../package.json';
import QRCode from 'qrcode';

import { Response } from 'express';
import { Request } from '../types/request-types';
import { Message } from '@wppconnect-team/wppconnect';
import { ClientWhatsAppTypes } from '../types/client-types';
import { Logger } from 'winston';

const SessionUtil = new CreateSessionUtil();

async function downloadFileFunction(message: Message, client: ClientWhatsAppTypes, logger: Logger) {
  try {
    const buffer = await client.decryptFile(message);

    let filename = `./WhatsAppImages/file${message.t}`;
    if (!fs.existsSync(filename)) {
      let result = '';
      if (message.type === 'ptt') {
        result = `${filename}.oga`;
      } else {
        result = `${filename}.${mime.extension(message.mimetype)}`;
      }

      await fs.writeFile(result, buffer, (err) => {
        if (err) {
          logger.error(err);
        }
      });

      return result;
    } else {
      return `${filename}.${mime.extension(message.mimetype)}`;
    }
  } catch (e) {
    logger.error(e);
    logger.warn('Erro ao descriptografar a midia, tentando fazer o download direto...');
    try {
      const buffer = await client.downloadMedia(message);
      const filename = `./WhatsAppImages/file${message.t}`;
      if (!fs.existsSync(filename)) {
        let result = '';
        if (message.type === 'ptt') {
          result = `${filename}.oga`;
        } else {
          result = `${filename}.${mime.extension(message.mimetype)}`;
        }

        await fs.writeFile(result, buffer, (err) => {
          if (err) {
            logger.error(err);
          }
        });

        return result;
      } else {
        return `${filename}.${mime.extension(message.mimetype)}`;
      }
    } catch (e) {
      logger.error(e);
      logger.warn('Não foi possível baixar a mídia...');
    }
  }
}

export async function download(message: Message, client: ClientWhatsAppTypes, logger: Logger) {
  try {
    const path: any = await downloadFileFunction(message, client, logger);
    return path.replace('./', '');
  } catch (e) {
    logger.error(e);
  }
}

export async function startAllSessions(req: Request, res: Response) {
  /* 
    #swagger.tags = ['Auth'] 
    #swagger.parameters = [
      {
        "name": "secretkey",
        "default": "THISISMYSECURETOKEN",
        "in": "path",
        "description": "(Required) chave do admin",
        "required": true,
      }
    ]
  */
  const { secretkey } = req.params;
  const { authorization: token } = req.headers;
  const Token: any = token;

  let tokenDecrypt: any = '';

  if (secretkey === undefined) {
    tokenDecrypt = Token.split(' ')[0];
  } else {
    tokenDecrypt = secretkey;
  }

  const allSessions = await getAllTokens(req);

  if (tokenDecrypt !== req.serverOptions.secretKey) {
    return res.status(400).json({
      response: 'error',
      message: 'The token is incorrect',
    });
  }

  allSessions.map(async (session: string) => {
    const util = new CreateSessionUtil();
    await util.opendata(req, session);
  });

  return res.status(201).json({ status: 'success', message: 'Starting all sessions' });
}

export async function showAllSessions(req: Request, res: Response) {
  /* 
    #swagger.tags = ['Auth'] 
    #swagger.parameters = [
      {
        "name": "secretkey",
        "default": "THISISMYSECURETOKEN",
        "in": "path",
        "description": "(Required) chave do admin",
        "required": true,
      }
    ]
  */
  const { secretkey } = req.params;
  const { authorization: token } = req.headers;
  const Token: any = token;

  let tokenDecrypt = '';

  if (secretkey === undefined) {
    tokenDecrypt = Token.split(' ')[0];
  } else {
    tokenDecrypt = secretkey;
  }

  const arr: any = [];

  if (tokenDecrypt !== req.serverOptions.secretKey) {
    return res.status(400).json({
      response: false,
      message: 'The token is incorrect',
    });
  }

  Object.keys(clientsArray).forEach((item) => {
    arr.push({ session: item });
  });

  return res.status(200).json({ response: arr });
}

export async function startSession(req: Request, res: Response) {
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
    ]
  */
  const session = req.session;
  const { waitQrCode = false } = req.body;

  await getSessionState(req, res);
  await SessionUtil.opendata(req, session, waitQrCode ? res : null);
}

export async function closeSession(req: Request, res: Response) {
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
    ]
  */
  const session: any = req.session;
  try {
    if (clientsArray[session].status === null) {
      return await res.status(200).json({ status: true, message: 'Session successfully closed' });
    } else {
      clientsArray[session] = { status: null };
      await req.client?.close();

      req.io.emit('whatsapp-status', false);
      callWebHook(req.client as ClientWhatsAppTypes, req, 'closesession', {
        message: `Session: ${session} disconnected`,
        connected: false,
      });

      return await res.status(200).json({ status: true, message: 'Session successfully closed' });
    }
  } catch (error) {
    req.logger.error(error);
    return await res.status(500).json({ status: false, message: 'Error closing session', error });
  }
}

export async function logOutSession(req: Request, res: Response) {
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
    ]
  */
  try {
    const session = req.session;
    await req.client?.logout();

    req.io.emit('whatsapp-status', false);
    callWebHook(req.client as ClientWhatsAppTypes, req, 'logoutsession', {
      message: `Session: ${session} logged out`,
      connected: false,
    });

    return await res.status(200).json({ status: true, message: 'Session successfully closed' });
  } catch (error) {
    req.logger.error(error);
    return await res.status(500).json({ status: false, message: 'Error closing session', error });
  }
}

export async function checkConnectionSession(req: Request, res: Response) {
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
    ]
  */
  try {
    await req.client?.isConnected();

    return res.status(200).json({ status: true, message: 'Connected' });
  } catch (error) {
    return res.status(200).json({ status: false, message: 'Disconnected' });
  }
}

export async function downloadMediaByMessage(req: Request, res: Response) {
  /* 
    #swagger.tags = ['Chat'] 
    #swagger.parameters = [
      {
        "name": "session",
        "default": "NERDWHATS_AMERICA",
        "in": "path",
        "description": "Nome da sessão",
        "required": true,
      },
    ]
  */
  const client = req.client;
  const { messageId } = req.body;

  let message;

  try {
    if (!messageId.isMedia || !messageId.type) {
      message = (await client?.getMessageById(messageId)) as Message;
    } else {
      message = messageId;
    }

    if (!message)
      return res.status(400).json({
        status: 'error',
        message: 'Message not found',
      });

    if (!(message['mimetype'] || message.isMedia || message.isMMS))
      return res.status(400).json({
        status: 'error',
        message: 'Message does not contain media',
      });

    const buffer = (await client?.decryptFile(message)) as Buffer;

    return res.status(200).json({ base64: buffer.toString('base64'), mimetype: message.mimetype });
  } catch (e) {
    req.logger.error(e);
    return res.status(400).json({
      status: 'error',
      message: 'Decrypt file error',
    });
  }
}

export async function getMediaByMessage(req: Request, res: Response) {
  /* 
    #swagger.tags = ['Chat'] 
    #swagger.parameters = [
      {
        "name": "session",
        "default": "NERDWHATS_AMERICA",
        "in": "path",
        "description": "Nome da sessão",
        "required": true,
      },
    ]
  */
  const client = req.client;
  const { messageId } = req.params;

  try {
    const message = (await client?.getMessageById(messageId)) as Message | undefined;

    if (!message)
      return res.status(400).json({
        status: 'error',
        message: 'Message not found',
      });

    if (!(message['mimetype'] || message.isMedia || message.isMMS))
      return res.status(400).json({
        status: 'error',
        message: 'Message does not contain media',
      });

    const buffer = (await client?.decryptFile(message)) as Buffer;

    return res.status(200).json({ base64: buffer.toString('base64'), mimetype: message.mimetype });
  } catch (ex) {
    req.logger.error(ex);
    return res.status(500).json({ status: 'error', message: 'The session is not active' });
  }
}

export async function getSessionState(req: Request, res: Response) {
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
    ]
  */
  try {
    const { waitQrCode = false } = req.body;
    const client = req.client;
    const qr = await QRCode.toDataURL(client?.urlcode as string);

    if ((client == null || client.status == null) && !waitQrCode)
      return res.status(200).json({ status: 'CLOSED', qrcode: null });
    else if (client != null)
      return res.status(200).json({
        status: client.status,
        qrcode: qr,
        urlcode: client.urlcode,
        //version: version,
      });
  } catch (ex) {
    req.logger.error(ex);
    return res.status(500).json({ status: 'error', message: 'The session is not active' });
  }
}

export async function getQrCode(req: Request, res: Response) {
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
    ]
  */
  try {
    const qr = await QRCode.toDataURL(req.client?.urlcode as string);
    const img = Buffer.from(qr.replace(/^data:image\/(png|jpeg|jpg);base64,/, ''), 'base64');

    res.writeHead(200, {
      'Content-Type': 'image/png',
      'Content-Length': img.length,
    });
    res.end(img);
  } catch (ex) {
    req.logger.error(ex);
    return res.status(500).json({ status: 'error', message: 'Error retrieving QRCode' });
  }
}

// not implemented on @wppconnect-team/wppconnect
export async function killServiceWorker(req: Request, res: Response) {
  /* 
    #swagger.tags = ['System'] 
    #swagger.parameters = [
      {
        "name": "session",
        "default": "NERDWHATS_AMERICA",
        "in": "path",
        "description": "Nome da sessão",
        "required": true,
      },
    ]
  */
  try {
    return res.status(200).json({ status: 'success', response: null });
  } catch (ex) {
    req.logger.error(ex);
    return res.status(500).json({ status: 'error', message: 'The session is not active' });
  }
}

// not implemented on @wppconnect-team/wppconnect
export async function restartService(req: Request, res: Response) {
  /* 
    #swagger.tags = ['System'] 
    #swagger.parameters = [
      {
        "name": "session",
        "default": "NERDWHATS_AMERICA",
        "in": "path",
        "description": "Nome da sessão",
        "required": true,
      },
    ]
  */
  try {
    return res.status(200).json({ status: 'success', response: null });
  } catch (ex) {
    req.logger.error(ex);
    return res.status(500).json({ status: 'error', response: { message: 'The session is not active' } });
  }
}

export async function subscribePresence(req: Request, res: Response) {
  /* 
    #swagger.tags = ['Contact'] 
    #swagger.parameters = [
      {
        "name": "session",
        "default": "NERDWHATS_AMERICA",
        "in": "path",
        "description": "Nome da sessão",
        "required": true,
      },
    ]
  */
  try {
    const { phone, isGroup = false, all = false } = req.body;

    if (all) {
      let contacts: any;
      if (isGroup) {
        const groups: any = await req.client?.getAllGroups(false);
        contacts = groups.map((p: any) => p.id._serialized);
      } else {
        const chats: any = await req.client?.getAllContacts();
        contacts = chats.map((c: any) => c.id._serialized);
      }
      await req.client?.subscribePresence(contacts);
    } else
      for (const contato of contactToArray(phone, isGroup)) {
        await req.client?.subscribePresence(contato);
      }

    return await res.status(200).json({ status: 'success', response: { message: 'Subscribe presence executed' } });
  } catch (error) {
    return await res.status(500).json({ status: 'error', message: 'Error on subscribe presence', error });
  }
}
