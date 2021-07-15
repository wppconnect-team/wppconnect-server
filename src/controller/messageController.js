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
import { contactToArray, strToBool, unlinkAsync } from '../util/functions';

function returnError(req, res, session, error) {
  req.logger.error(error);
  res.status(400).json({
    status: 'Error',
    response: {
      message: 'Message was not sent.',
      session: session,
      log: error,
    },
  });
}

function returnSucess(res, session, phone, data) {
  res.status(201).json({
    status: 'Success',
    response: {
      message: 'Message sent successfully',
      contact: phone,
      session: session,
      data: data,
    },
  });
}

export async function sendMessage(req, res) {
  const session = req.session;
  const { phone, message, isGroup = false } = req.body;

  try {
    let result;

    for (const contato of contactToArray(phone, isGroup)) {
      result = await req.client.sendText(contato, message);
    }

    if (!result) return returnError(req, res, session, 'Error sending message');

    req.io.emit('mensagem-enviada', { message: message, to: phone });

    returnSucess(res, session, phone, result);
  } catch (error) {
    returnError(req, res, session, error);
  }
}

export async function sendImage(req, res) {
  const session = req.session;
  const { phone, filename = 'image-api.jpg', caption, path, isGroup = false } = req.body;

  if (!phone) return res.status(401).send({ message: 'Telefone não informado.' });

  if (!path && !req.file)
    return res.status(401).send({
      message: 'Sending the file is mandatory',
    });

  const pathFile = path || req.file.path;

  try {
    let result;

    for (const contato of contactToArray(phone, isGroup)) {
      result = await req.client.sendImage(contato, pathFile, filename, caption);
    }

    if (!result) return returnError(req, res, session, 'Error sending message');

    returnSucess(res, session, phone, result);
  } catch (error) {
    returnError(req, res, session, error);
  }
}

export async function sendFile(req, res) {
  const session = req.session;
  const { phone, filename = 'file', message, isGroup = false } = req.body;

  if (!req.file) return res.status(400).json({ status: 'Error', message: 'Sending the file is mandatory' });

  const { path: pathFile } = req.file;

  try {
    let result;

    for (const contato of contactToArray(phone, strToBool(isGroup))) {
      result = await req.client.sendFile(`${contato}`, pathFile, filename, message);
    }

    if (!result) return returnError(req, res, session, 'Error sending message');

    await unlinkAsync(pathFile);
    returnSucess(res, session, phone, result);
  } catch (error) {
    returnError(req, res, session, error);
  }
}

export async function sendFile64(req, res) {
  const session = req.session;
  const { base64, phone, filename = 'file', message, isGroup = false } = req.body;

  if (!base64) return res.status(401).send({ message: 'The base64 of the file was not informed' });

  try {
    let result;

    for (const contato of contactToArray(phone, isGroup)) {
      result = await req.client.sendFileFromBase64(`${contato}`, base64, filename, message);
    }

    if (!result) return returnError(req, res, session, 'Error sending message');

    returnSucess(res, session, phone, result);
  } catch (error) {
    returnError(req, res, session, error);
  }
}

export async function sendVoice(req, res) {
  const session = req.session;
  const { phone, url: base64Ptt, isGroup = false } = req.body;

  try {
    let result;

    for (const contato of contactToArray(phone, isGroup)) {
      result = await req.client.sendPttFromBase64(`${contato}`, base64Ptt, 'Voice Audio');
    }

    if (!result) return returnError(req, res, session, 'Error sending message');

    returnSucess(res, session, phone, result);
  } catch (error) {
    returnError(req, res, session, error);
  }
}

export async function sendLinkPreview(req, res) {
  const session = req.session;
  const { phone, url, caption, isGroup = false } = req.body;

  try {
    let result;

    for (const contato of contactToArray(phone, isGroup)) {
      result = await req.client.sendLinkPreview(`${contato}`, url, caption);
    }

    if (!result) return returnError(req, res, session, 'Error sending message');

    returnSucess(res, session, phone, result);
  } catch (error) {
    returnError(req, res, session, error);
  }
}

export async function sendLocation(req, res) {
  const session = req.session;
  const { phone, lat, lng, title, isGroup = false } = req.body;

  try {
    let result;

    for (const contact of contactToArray(phone, isGroup)) {
      result = await req.client.sendLocation(`${contact}`, lat, lng, title);
    }

    if (!result) return returnError(req, res, session, 'Error sending message');

    returnSucess(res, session, phone, result);
  } catch (error) {
    returnError(req, res, session, error);
  }
}

export async function sendStatusText(req, res) {
  const { message } = req.body;

  try {
    await req.client.sendText('status@broadcast', message);
    return res.status(200).json({ status: 'Success', message: 'Location sent.' });
  } catch (error) {
    req.logger.error(error);
    return res.status(400).json({ status: 'Error on send location' });
  }
}

export async function replyMessage(req, res) {
  const session = req.session;
  const { phone, message, messageId, isGroup = false } = req.body;

  try {
    let result;
    for (const contato of contactToArray(phone, isGroup)) {
      result = await req.client.reply(`${contato}`, message, messageId);
    }

    if (!result) return res.status(400).json('Error sending message');

    req.io.emit('mensagem-enviada', { message: message, to: phone });
    returnSucess(res, session, phone, result);
  } catch (error) {
    returnError(req, res, session, error);
  }
}
