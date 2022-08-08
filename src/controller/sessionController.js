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
import { version } from '../../package.json';

const SessionUtil = new CreateSessionUtil();

async function downloadFileFunction(message, client, logger) {
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

export async function download(message, client, logger) {
  try {
    const path = await downloadFileFunction(message, client, logger);
    return path.replace('./', '');
  } catch (e) {
    logger.error(e);
  }
}

export async function startAllSessions(req, res) {
  const { secretkey } = req.params;
  const { authorization: token } = req.headers;

  let tokenDecrypt = '';

  if (secretkey === undefined) {
    tokenDecrypt = token.split(' ')[0];
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

  allSessions.map(async (session) => {
    const util = new CreateSessionUtil();
    await util.opendata(req, session);
  });

  return await res.status(201).json({ status: 'success', message: 'Starting all sessions' });
}

export async function showAllSessions(req, res) {
  const { secretkey } = req.params;
  const { authorization: token } = req.headers;

  let tokenDecrypt = '';

  if (secretkey === undefined) {
    tokenDecrypt = token.split(' ')[0];
  } else {
    tokenDecrypt = secretkey;
  }

  const arr = [];

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

export async function startSession(req, res) {
  const session = req.session;
  const { waitQrCode = false } = req.body;

  await getSessionState(req, res);
  await SessionUtil.opendata(req, session, waitQrCode ? res : null);
}

export async function closeSession(req, res) {
  const session = req.session;
  try {
    if (clientsArray[session].status === null) {
      return await res.status(200).json({ status: true, message: 'Session successfully closed' });
    } else {
      clientsArray[session] = { status: null };
      await req.client.close();

      req.io.emit('whatsapp-status', false);
      callWebHook(req.client, req, 'closesession', {
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

export async function logOutSession(req, res) {
  try {
    const session = req.session;
    await req.client.logout();

    req.io.emit('whatsapp-status', false);
    callWebHook(req.client, req, 'logoutsession', {
      message: `Session: ${session} logged out`,
      connected: false,
    });

    return await res.status(200).json({ status: true, message: 'Session successfully closed' });
  } catch (error) {
    req.logger.error(error);
    return await res.status(500).json({ status: false, message: 'Error closing session', error });
  }
}

export async function checkConnectionSession(req, res) {
  try {
    await req.client.isConnected();

    return res.status(200).json({ status: true, message: 'Connected' });
  } catch (error) {
    return res.status(200).json({ status: false, message: 'Disconnected' });
  }
}

export async function downloadMediaByMessage(req, res) {
  const client = req.client;
  const { messageId } = req.body;

  let message;

  try {
    if (!messageId.isMedia || !messageId.type) {
      message = await client.getMessageById(messageId);
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

    const buffer = await client.decryptFile(message);

    return res.status(200).json({ base64: buffer.toString('base64'), mimetype: message.mimetype });
  } catch (e) {
    req.logger.error(e);
    return res.status(400).json({
      status: 'error',
      message: 'Decrypt file error',
    });
  }
}

export async function getMediaByMessage(req, res) {
  const client = req.client;
  const { messageId } = req.params;

  try {
    const message = await client.getMessageById(messageId);

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

    const buffer = await client.decryptFile(message);

    return res.status(200).json({ base64: buffer.toString('base64'), mimetype: message.mimetype });
  } catch (ex) {
    req.logger.error(ex);
    return res.status(500).json({ status: 'error', message: 'The session is not active' });
  }
}

export async function getSessionState(req, res) {
  try {
    const { waitQrCode = false } = req.body;
    const client = req.client;

    if ((client == null || client.status == null) && !waitQrCode)
      return res.status(200).json({ status: 'CLOSED', qrcode: null });
    else if (client != null)
      return res.status(200).json({
        status: client.status,
        qrcode: client.qrcode,
        urlcode: client.urlcode,
        version: version,
      });
  } catch (ex) {
    req.logger.error(ex);
    return res.status(500).json({ status: 'error', message: 'The session is not active' });
  }
}

export async function getQrCode(req, res) {
  try {
    const img = Buffer.from(req.client.qrcode.replace(/^data:image\/(png|jpeg|jpg);base64,/, ''), 'base64');

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

export async function killServiceWorker(req, res) {
  try {
    return res.status(200).json({ status: 'success', response: req.client.killServiceWorker() });
  } catch (ex) {
    req.logger.error(ex);
    return res.status(500).json({ status: 'error', message: 'The session is not active' });
  }
}

export async function restartService(req, res) {
  try {
    return res.status(200).json({ status: 'success', response: req.client.restartService() });
  } catch (ex) {
    req.logger.error(ex);
    return res.status(500).json({ status: 'error', response: { message: 'The session is not active' } });
  }
}

export async function subscribePresence(req, res) {
  try {
    const { phone, isGroup = false, all = false } = req.body;

    if (all) {
      let contacts;
      if (isGroup) {
        const groups = await req.client.getAllGroups(false);
        contacts = groups.map((p) => p.id._serialized);
      } else {
        const chats = await req.client.getAllContacts();
        contacts = chats.map((c) => c.id._serialized);
      }
      await req.client.subscribePresence(contacts);
    } else
      for (const contato of contactToArray(phone, isGroup)) {
        await req.client.subscribePresence(contato);
      }

    return await res.status(200).json({ status: 'success', response: { message: 'Subscribe presence executed' } });
  } catch (error) {
    return await res.status(500).json({ status: 'error', message: 'Error on subscribe presence', error });
  }
}
