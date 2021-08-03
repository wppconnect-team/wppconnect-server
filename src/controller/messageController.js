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
import { unlinkAsync } from '../util/functions';

async function returnError(req, res, error, message = 'Error sending message.') {
  req.logger.error(error);
  res.status(400).json({
    status: 'error',
    response: {
      message: message,
      log: error,
    },
  });
}

async function returnSucess(res, session, phone, data, message = 'Message sent successfully') {
  res.status(201).json({
    status: 'success',
    response: {
      message: message,
      contact: phone,
      session: session,
      data: data,
    },
    mapper: 'return',
  });
}

export async function sendMessage(req, res) {
  const session = req.session;
  const { phone, message } = req.body;

  try {
    let result;

    for (const contact of phone) {
      result = await req.client.sendText(contact, message);
    }

    if (!result) return returnError(req, res, session, 'Error sending message');

    req.io.emit('mensagem-enviada', { message: message, to: phone });

    returnSucess(res, session, phone, result);
  } catch (error) {
    returnError(req, res, error);
  }
}

export async function sendImage(req, res) {
  const session = req.session;
  const { phone, filename = 'image-api.jpg', caption, path } = req.body;

  if (!path && !req.file)
    return res.status(401).send({
      message: 'Sending the file is mandatory',
    });

  const pathFile = path || req.file.path;

  try {
    let result;

    for (const contact of phone) {
      result = await req.client.sendImage(contact, pathFile, filename, caption);
    }

    if (!result) return returnError(req, res, session, 'Error sending message');

    returnSucess(res, session, phone, result);
  } catch (error) {
    returnError(req, res, error);
  }
}

export async function sendFile(req, res) {
  const session = req.session;
  const { phone, file, filename = 'file', message } = req.body;

  if (!file && !req.file)
    return res.status(401).send({
      message: 'Sending the file is mandatory',
    });

  const pathFile = file || req.file.path;

  try {
    let results = [];

    for (const contact of phone) {
      results.push(await req.client.sendFile(contact, pathFile, filename, message));
    }

    if (results.length === 0) return returnError(req, res, session, 'Error sending message');

    if (!req.serverOptions.webhook.uploadS3) await unlinkAsync(pathFile);

    returnSucess(res, session, phone, results);
  } catch (error) {
    returnError(req, res, error);
  }
}

export async function sendFile64(req, res) {
  const session = req.session;
  const { base64, phone, filename = 'file', message } = req.body;

  if (!base64) return returnError(req, res, 'The base64 of the file was not informed');

  try {
    let results = [];

    for (const contact of phone) {
      results.push(await req.client.sendFileFromBase64(contact, base64, filename, message));
    }

    if (results.length === 0) return returnError(req, res, session, 'Error sending message');

    returnSucess(res, session, phone, results);
  } catch (error) {
    returnError(req, res, error);
  }
}

export async function sendVoice(req, res) {
  const session = req.session;
  const { phone, url: base64Ptt } = req.body;

  try {
    let results = [];

    for (const contact of phone) {
      results.push(await req.client.sendPttFromBase64(contact, base64Ptt, 'Voice Audio'));
    }

    if (results.length === 0) return returnError(req, res, session, 'Error sending message');

    returnSucess(res, session, phone, results);
  } catch (error) {
    returnError(req, res, session, error);
  }
}

export async function sendLinkPreview(req, res) {
  const session = req.session;
  const { phone, url, caption } = req.body;

  try {
    let results = [];

    for (const contact of phone) {
      results.push(await req.client.sendLinkPreview(`${contact}`, url, caption));
    }

    if (results.length === 0) return returnError(req, res, session, 'Error sending message');

    returnSucess(res, session, phone, results);
  } catch (error) {
    returnError(req, res, session, error);
  }
}

export async function sendLocation(req, res) {
  const session = req.session;
  const { phone, lat, lng, title } = req.body;

  try {
    let results = [];

    for (const contact of phone) {
      results.push(await req.client.sendLocation(contact, lat, lng, title));
    }

    if (results.length === 0) return returnError(req, res, session, 'Error sending message');

    returnSucess(res, session, phone, results);
  } catch (error) {
    returnError(req, res, session, error);
  }
}
export async function sendContactVcard(req, res) {
  const session = req.session;
  const { phone, contactsId, name = null } = req.body;

  try {
    let results = [];

    for (const contact of phone) {
      results.push(await req.client.sendContactVcard(contact, contactsId, name));
    }

    if (results.length === 0) return returnError(req, res, session, 'Error sending message');

    returnSucess(res, session, phone, results);
  } catch (error) {
    returnError(req, res, session, error);
  }
}

export async function sendStatusText(req, res) {
  const session = req.session;
  const { message } = req.body;

  try {
    let results = [];

    results.push(await req.client.sendText('status@broadcast', message));

    if (results.length === 0) return returnError(req, res, session, 'Error sending message');

    returnSucess(res, session, '', results);
  } catch (error) {
    returnError(req, res, session, error);
  }
}

export async function replyMessage(req, res) {
  const session = req.session;
  const { phone, message, messageId } = req.body;

  try {
    let results = [];

    for (const contact of phone) {
      results.push(await req.client.reply(contact, message, messageId));
    }

    if (results.length === 0) return returnError(req, res, session, 'Error sending message');

    req.io.emit('mensagem-enviada', { message: message, to: phone });

    returnSucess(res, session, phone, results);
  } catch (error) {
    returnError(req, res, session, error);
  }
}

export async function sendMentioned(req, res) {
  const session = req.session;
  const { phone, message, mentioned } = req.body;

  try {
    let results = [];

    for (const contact of phone) {
      results.push(await req.client.sendMentioned(contact, message, mentioned));
    }

    if (results.length === 0) return returnError(req, res, session, 'Error sending message');

    returnSucess(res, session, phone, results);
  } catch (error) {
    returnError(req, res, session, error);
  }
}
