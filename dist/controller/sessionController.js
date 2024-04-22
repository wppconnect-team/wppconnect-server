"use strict";var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");Object.defineProperty(exports, "__esModule", { value: true });exports.checkConnectionSession = checkConnectionSession;exports.closeSession = closeSession;exports.download = download;exports.downloadMediaByMessage = downloadMediaByMessage;exports.editBusinessProfile = editBusinessProfile;exports.getMediaByMessage = getMediaByMessage;exports.getQrCode = getQrCode;exports.getSessionState = getSessionState;exports.killServiceWorker = killServiceWorker;exports.logOutSession = logOutSession;exports.restartService = restartService;exports.showAllSessions = showAllSessions;exports.startAllSessions = startAllSessions;exports.startSession = startSession;exports.subscribePresence = subscribePresence;
















var _fs = _interopRequireDefault(require("fs"));
var _mimeTypes = _interopRequireDefault(require("mime-types"));
var _qrcode = _interopRequireDefault(require("qrcode"));


var _package = require("../../package.json");
var _config = _interopRequireDefault(require("../config"));
var _createSessionUtil = _interopRequireDefault(require("../util/createSessionUtil"));
var _functions = require("../util/functions");
var _getAllTokens = _interopRequireDefault(require("../util/getAllTokens"));
var _sessionUtil = require("../util/sessionUtil"); /*
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
 * See the License for the specific language governing permclearSessionissions and
 * limitations under the License.
 */const SessionUtil = new _createSessionUtil.default();async function downloadFileFunction(message, client, logger) {try {const buffer = await client.decryptFile(message);const filename = `./WhatsAppImages/file${message.t}`;if (!_fs.default.existsSync(filename)) {let result = '';
      if (message.type === 'ptt') {
        result = `${filename}.oga`;
      } else {
        result = `${filename}.${_mimeTypes.default.extension(message.mimetype)}`;
      }

      await _fs.default.writeFile(result, buffer, (err) => {
        if (err) {
          logger.error(err);
        }
      });

      return result;
    } else {
      return `${filename}.${_mimeTypes.default.extension(message.mimetype)}`;
    }
  } catch (e) {
    logger.error(e);
    logger.warn(
      'Erro ao descriptografar a midia, tentando fazer o download direto...'
    );
    try {
      const buffer = await client.downloadMedia(message);
      const filename = `./WhatsAppImages/file${message.t}`;
      if (!_fs.default.existsSync(filename)) {
        let result = '';
        if (message.type === 'ptt') {
          result = `${filename}.oga`;
        } else {
          result = `${filename}.${_mimeTypes.default.extension(message.mimetype)}`;
        }

        await _fs.default.writeFile(result, buffer, (err) => {
          if (err) {
            logger.error(err);
          }
        });

        return result;
      } else {
        return `${filename}.${_mimeTypes.default.extension(message.mimetype)}`;
      }
    } catch (e) {
      logger.error(e);
      logger.warn('Não foi possível baixar a mídia...');
    }
  }
}

async function download(message, client, logger) {
  try {
    const path = await downloadFileFunction(message, client, logger);
    return path?.replace('./', '');
  } catch (e) {
    logger.error(e);
  }
}

async function startAllSessions(req, res) {
  /**
   * #swagger.tags = ["Auth"]
     #swagger.autoBody=false
     #swagger.operationId = 'startAllSessions'
     #swagger.security = [{
            "bearerAuth": []
     }]
     #swagger.parameters["session"] = {
      schema: 'NERDWHATS_AMERICA'
     }
     #swagger.parameters["secretkey"] = {
      schema: 'THISISMYSECURECODE'
     }
   */
  const { secretkey } = req.params;
  const { authorization: token } = req.headers;

  let tokenDecrypt = '';

  if (secretkey === undefined) {
    tokenDecrypt = token.split(' ')[0];
  } else {
    tokenDecrypt = secretkey;
  }

  const allSessions = await (0, _getAllTokens.default)(req);

  if (tokenDecrypt !== req.serverOptions.secretKey) {
    return res.status(400).json({
      response: 'error',
      message: 'The token is incorrect'
    });
  }

  allSessions.map(async (session) => {
    const util = new _createSessionUtil.default();
    await util.opendata(req, session);
  });

  return await res.
  status(201).
  json({ status: 'success', message: 'Starting all sessions' });
}

async function showAllSessions(req, res) {
  /**
   * #swagger.tags = ["Auth"]
     #swagger.autoBody=false
     #swagger.operationId = 'showAllSessions'
     #swagger.autoQuery=false
     #swagger.autoHeaders=false
     #swagger.security = [{
            "bearerAuth": []
     }]
     #swagger.parameters["secretkey"] = {
      schema: 'THISISMYSECURETOKEN'
     }
   */
  const { secretkey } = req.params;
  const { authorization: token } = req.headers;

  let tokenDecrypt = '';

  if (secretkey === undefined) {
    tokenDecrypt = token?.split(' ')[0];
  } else {
    tokenDecrypt = secretkey;
  }

  const arr = [];

  if (tokenDecrypt !== req.serverOptions.secretKey) {
    return res.status(400).json({
      response: false,
      message: 'The token is incorrect'
    });
  }

  Object.keys(_sessionUtil.clientsArray).forEach((item) => {
    arr.push({ session: item });
  });

  return res.status(200).json({ response: await (0, _getAllTokens.default)(req) });
}

async function startSession(req, res) {
  /**
   * #swagger.tags = ["Auth"]
     #swagger.autoBody=false
     #swagger.operationId = 'startSession'
     #swagger.security = [{
            "bearerAuth": []
     }]
     #swagger.parameters["session"] = {
      schema: 'NERDWHATS_AMERICA'
     }
     #swagger.requestBody = {
      required: true,
      "@content": {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              webhook: { type: "string" },
              waitQrCode: { type: "boolean" },
            }
          },
          example: {
            webhook: "",
            waitQrCode: false,
          }
        }
      }
     }
   */
  const session = req.session;
  const { waitQrCode = true } = req.body;

  await getSessionState(req, res);
  await SessionUtil.opendata(req, session, waitQrCode ? res : null);
}

async function closeSession(req, res) {
  /**
   * #swagger.tags = ["Auth"]
     #swagger.operationId = 'closeSession'
     #swagger.autoBody=true
     #swagger.security = [{
            "bearerAuth": []
     }]
     #swagger.parameters["session"] = {
      schema: 'NERDWHATS_AMERICA'
     }
   */
  const session = req.session;
  try {
    if (_sessionUtil.clientsArray[session].status === null) {
      return await res.
      status(200).
      json({ status: true, message: 'Session successfully closed' });
    } else {
      _sessionUtil.clientsArray[session] = { status: null };

      await req.client.close();
      req.io.emit('whatsapp-status', false);
      (0, _functions.callWebHook)(req.client, req, 'closesession', {
        message: `Session: ${session} disconnected`,
        connected: false
      });

      return await res.
      status(200).
      json({ status: true, message: 'Session successfully closed' });
    }
  } catch (error) {
    req.logger.error(error);
    return await res.
    status(500).
    json({ status: false, message: 'Error closing session', error });
  }
}

async function logOutSession(req, res) {
  /**
   * #swagger.tags = ["Auth"]
     #swagger.operationId = 'logoutSession'
   * #swagger.description = 'This route logout and delete session data'
     #swagger.autoBody=false
     #swagger.security = [{
            "bearerAuth": []
     }]
     #swagger.parameters["session"] = {
      schema: 'NERDWHATS_AMERICA'
     }
   */
  try {
    const session = req.session;
    await req.client.logout();
    (0, _sessionUtil.deleteSessionOnArray)(req.session);

    setTimeout(async () => {
      const pathUserData = _config.default.customUserDataDir + req.session;
      const pathTokens = __dirname + `../../../tokens/${req.session}.data.json`;

      if (_fs.default.existsSync(pathUserData)) {
        await _fs.default.promises.rm(pathUserData, {
          recursive: true,
          maxRetries: 5,
          force: true,
          retryDelay: 1000
        });
      }
      if (_fs.default.existsSync(pathTokens)) {
        await _fs.default.promises.rm(pathTokens, {
          recursive: true,
          maxRetries: 5,
          force: true,
          retryDelay: 1000
        });
      }

      req.io.emit('whatsapp-status', false);
      (0, _functions.callWebHook)(req.client, req, 'logoutsession', {
        message: `Session: ${session} logged out`,
        connected: false
      });

      return await res.
      status(200).
      json({ status: true, message: 'Session successfully closed' });
    }, 500);
    /*try {
      await req.client.close();
    } catch (error) {}*/
  } catch (error) {
    req.logger.error(error);
    return await res.
    status(500).
    json({ status: false, message: 'Error closing session', error });
  }
}

async function checkConnectionSession(req, res) {
  /**
   * #swagger.tags = ["Auth"]
     #swagger.operationId = 'CheckConnectionState'
     #swagger.autoBody=false
     #swagger.security = [{
            "bearerAuth": []
     }]
     #swagger.parameters["session"] = {
      schema: 'NERDWHATS_AMERICA'
     }
   */
  try {
    await req.client.isConnected();

    return res.status(200).json({ status: true, message: 'Connected' });
  } catch (error) {
    return res.status(200).json({ status: false, message: 'Disconnected' });
  }
}

async function downloadMediaByMessage(req, res) {
  /**
   * #swagger.tags = ["Messages"]
     #swagger.autoBody=false
     #swagger.operationId = 'downloadMediabyMessage'
     #swagger.security = [{
            "bearerAuth": []
     }]
     #swagger.parameters["session"] = {
      schema: 'NERDWHATS_AMERICA'
     }
     #swagger.requestBody = {
      required: true,
      "@content": {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              messageId: { type: "string" },
            }
          },
          example: {
            messageId: '<messageId>'
          }
        }
      }
     }
   */
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
      message: 'Message not found'
    });

    if (!(message['mimetype'] || message.isMedia || message.isMMS))
    return res.status(400).json({
      status: 'error',
      message: 'Message does not contain media'
    });

    const buffer = await client.decryptFile(message);

    return res.
    status(200).
    json({ base64: buffer.toString('base64'), mimetype: message.mimetype });
  } catch (e) {
    req.logger.error(e);
    return res.status(400).json({
      status: 'error',
      message: 'Decrypt file error',
      error: e
    });
  }
}

async function getMediaByMessage(req, res) {
  /**
   * #swagger.tags = ["Messages"]
     #swagger.autoBody=false
     #swagger.operationId = 'getMediaByMessage'
     #swagger.security = [{
            "bearerAuth": []
     }]
     #swagger.parameters["session"] = {
      schema: 'NERDWHATS_AMERICA'
     }
     #swagger.parameters["session"] = {
      schema: 'messageId'
     }
   */
  const client = req.client;
  const { messageId } = req.params;

  try {
    const message = await client.getMessageById(messageId);

    if (!message)
    return res.status(400).json({
      status: 'error',
      message: 'Message not found'
    });

    if (!(message['mimetype'] || message.isMedia || message.isMMS))
    return res.status(400).json({
      status: 'error',
      message: 'Message does not contain media'
    });

    const buffer = await client.decryptFile(message);

    return res.
    status(200).
    json({ base64: buffer.toString('base64'), mimetype: message.mimetype });
  } catch (ex) {
    req.logger.error(ex);
    return res.status(500).json({
      status: 'error',
      message: 'The session is not active',
      error: ex
    });
  }
}

async function getSessionState(req, res) {
  /**
     #swagger.tags = ["Auth"]
     #swagger.operationId = 'getSessionState'
     #swagger.summary = 'Retrieve status of a session'
     #swagger.autoBody = false
     #swagger.security = [{
            "bearerAuth": []
     }]
     #swagger.parameters["session"] = {
      schema: 'NERDWHATS_AMERICA'
     }
   */
  try {
    const { waitQrCode = false } = req.body;
    const client = req.client;
    const qr =
    client?.urlcode != null && client?.urlcode != '' ?
    await _qrcode.default.toDataURL(client.urlcode) :
    null;

    if ((client == null || client.status == null) && !waitQrCode)
    return res.status(200).json({ status: 'CLOSED', qrcode: null });else
    if (client != null)
    return res.status(200).json({
      status: client.status,
      qrcode: qr,
      urlcode: client.urlcode,
      version: _package.version
    });
  } catch (ex) {
    req.logger.error(ex);
    return res.status(500).json({
      status: 'error',
      message: 'The session is not active',
      error: ex
    });
  }
}

async function getQrCode(req, res) {
  /**
   * #swagger.tags = ["Auth"]
     #swagger.autoBody=false
     #swagger.operationId = 'getQrCode'
     #swagger.security = [{
            "bearerAuth": []
     }]
     #swagger.parameters["session"] = {
      schema: 'NERDWHATS_AMERICA'
     }
   */
  try {
    if (req?.client?.urlcode) {
      const qr = req.client.urlcode ?
      await _qrcode.default.toDataURL(req.client.urlcode) :
      null;
      const img = Buffer.from(
        qr.replace(/^data:image\/(png|jpeg|jpg);base64,/, ''),
        'base64'
      );

      res.writeHead(200, {
        'Content-Type': 'image/png',
        'Content-Length': img.length
      });
      res.end(img);
    } else if (typeof req.client === 'undefined') {
      return res.status(200).json({
        status: null,
        message:
        'Session not started. Please, use the /start-session route, for initialization your session'
      });
    } else {
      return res.status(200).json({
        status: req.client.status,
        message: 'QRCode is not available...'
      });
    }
  } catch (ex) {
    req.logger.error(ex);
    return res.
    status(500).
    json({ status: 'error', message: 'Error retrieving QRCode', error: ex });
  }
}

async function killServiceWorker(req, res) {
  /**
   * #swagger.ignore=true
   * #swagger.tags = ["Messages"]
     #swagger.operationId = 'killServiceWorkier'
     #swagger.autoBody=false
     #swagger.security = [{
            "bearerAuth": []
     }]
     #swagger.parameters["session"] = {
      schema: 'NERDWHATS_AMERICA'
     }
   */
  try {
    return res.
    status(200).
    json({ status: 'error', response: 'Not implemented yet' });
  } catch (ex) {
    req.logger.error(ex);
    return res.status(500).json({
      status: 'error',
      message: 'The session is not active',
      error: ex
    });
  }
}

async function restartService(req, res) {
  /**
   * #swagger.ignore=true
   * #swagger.tags = ["Messages"]
     #swagger.operationId = 'restartService'
     #swagger.autoBody=false
     #swagger.security = [{
            "bearerAuth": []
     }]
     #swagger.parameters["session"] = {
      schema: 'NERDWHATS_AMERICA'
     }
   */
  try {
    return res.
    status(200).
    json({ status: 'error', response: 'Not implemented yet' });
  } catch (ex) {
    req.logger.error(ex);
    return res.status(500).json({
      status: 'error',
      response: { message: 'The session is not active', error: ex }
    });
  }
}

async function subscribePresence(req, res) {
  /**
   * #swagger.tags = ["Misc"]
     #swagger.operationId = 'subscribePresence'
     #swagger.autoBody=false
     #swagger.security = [{
            "bearerAuth": []
     }]
     #swagger.parameters["session"] = {
      schema: 'NERDWHATS_AMERICA'
     }
     #swagger.requestBody = {
      required: true,
      "@content": {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              phone: { type: "string" },
              isGroup: { type: "boolean" },
              all: { type: "boolean" },
            }
          },
          example: {
            phone: '5521999999999',
            isGroup: false,
            all: false,
          }
        }
      }
     }
   */
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
    for (const contato of (0, _functions.contactToArray)(phone, isGroup)) {
      await req.client.subscribePresence(contato);
    }

    return await res.status(200).json({
      status: 'success',
      response: { message: 'Subscribe presence executed' }
    });
  } catch (error) {
    return await res.status(500).json({
      status: 'error',
      message: 'Error on subscribe presence',
      error: error
    });
  }
}

async function editBusinessProfile(req, res) {
  /**
   * #swagger.tags = ["Profile"]
     #swagger.operationId = 'editBusinessProfile'
   * #swagger.description = 'Edit your bussiness profile'
     #swagger.autoBody=false
     #swagger.security = [{
            "bearerAuth": []
     }]
     #swagger.parameters["session"] = {
      schema: 'NERDWHATS_AMERICA'
     }
     #swagger.parameters["obj"] = {
      in: 'body',
      schema: {
        $adress: 'Av. Nossa Senhora de Copacabana, 315',
        $email: 'test@test.com.br',
        $categories: {
          $id: "133436743388217",
          $localized_display_name: "Artes e entretenimento",
          $not_a_biz: false,
        },
        $website: [
          "https://www.wppconnect.io",
          "https://www.teste2.com.br",
        ],
      }
     }
     
     #swagger.requestBody = {
      required: true,
      "@content": {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              adress: { type: "string" },
              email: { type: "string" },
              categories: { type: "object" },
              websites: { type: "array" },
            }
          },
          example: {
            adress: 'Av. Nossa Senhora de Copacabana, 315',
            email: 'test@test.com.br',
            categories: {
              $id: "133436743388217",
              $localized_display_name: "Artes e entretenimento",
              $not_a_biz: false,
            },
            website: [
              "https://www.wppconnect.io",
              "https://www.teste2.com.br",
            ],
          }
        }
      }
     }
   */
  try {
    return res.status(200).json(await req.client.editBusinessProfile(req.body));
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Error on edit business profile',
      error: error
    });
  }
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfZnMiLCJfaW50ZXJvcFJlcXVpcmVEZWZhdWx0IiwicmVxdWlyZSIsIl9taW1lVHlwZXMiLCJfcXJjb2RlIiwiX3BhY2thZ2UiLCJfY29uZmlnIiwiX2NyZWF0ZVNlc3Npb25VdGlsIiwiX2Z1bmN0aW9ucyIsIl9nZXRBbGxUb2tlbnMiLCJfc2Vzc2lvblV0aWwiLCJTZXNzaW9uVXRpbCIsIkNyZWF0ZVNlc3Npb25VdGlsIiwiZG93bmxvYWRGaWxlRnVuY3Rpb24iLCJtZXNzYWdlIiwiY2xpZW50IiwibG9nZ2VyIiwiYnVmZmVyIiwiZGVjcnlwdEZpbGUiLCJmaWxlbmFtZSIsInQiLCJmcyIsImV4aXN0c1N5bmMiLCJyZXN1bHQiLCJ0eXBlIiwibWltZSIsImV4dGVuc2lvbiIsIm1pbWV0eXBlIiwid3JpdGVGaWxlIiwiZXJyIiwiZXJyb3IiLCJlIiwid2FybiIsImRvd25sb2FkTWVkaWEiLCJkb3dubG9hZCIsInBhdGgiLCJyZXBsYWNlIiwic3RhcnRBbGxTZXNzaW9ucyIsInJlcSIsInJlcyIsInNlY3JldGtleSIsInBhcmFtcyIsImF1dGhvcml6YXRpb24iLCJ0b2tlbiIsImhlYWRlcnMiLCJ0b2tlbkRlY3J5cHQiLCJ1bmRlZmluZWQiLCJzcGxpdCIsImFsbFNlc3Npb25zIiwiZ2V0QWxsVG9rZW5zIiwic2VydmVyT3B0aW9ucyIsInNlY3JldEtleSIsInN0YXR1cyIsImpzb24iLCJyZXNwb25zZSIsIm1hcCIsInNlc3Npb24iLCJ1dGlsIiwib3BlbmRhdGEiLCJzaG93QWxsU2Vzc2lvbnMiLCJhcnIiLCJPYmplY3QiLCJrZXlzIiwiY2xpZW50c0FycmF5IiwiZm9yRWFjaCIsIml0ZW0iLCJwdXNoIiwic3RhcnRTZXNzaW9uIiwid2FpdFFyQ29kZSIsImJvZHkiLCJnZXRTZXNzaW9uU3RhdGUiLCJjbG9zZVNlc3Npb24iLCJjbG9zZSIsImlvIiwiZW1pdCIsImNhbGxXZWJIb29rIiwiY29ubmVjdGVkIiwibG9nT3V0U2Vzc2lvbiIsImxvZ291dCIsImRlbGV0ZVNlc3Npb25PbkFycmF5Iiwic2V0VGltZW91dCIsInBhdGhVc2VyRGF0YSIsImNvbmZpZyIsImN1c3RvbVVzZXJEYXRhRGlyIiwicGF0aFRva2VucyIsIl9fZGlybmFtZSIsInByb21pc2VzIiwicm0iLCJyZWN1cnNpdmUiLCJtYXhSZXRyaWVzIiwiZm9yY2UiLCJyZXRyeURlbGF5IiwiY2hlY2tDb25uZWN0aW9uU2Vzc2lvbiIsImlzQ29ubmVjdGVkIiwiZG93bmxvYWRNZWRpYUJ5TWVzc2FnZSIsIm1lc3NhZ2VJZCIsImlzTWVkaWEiLCJnZXRNZXNzYWdlQnlJZCIsImlzTU1TIiwiYmFzZTY0IiwidG9TdHJpbmciLCJnZXRNZWRpYUJ5TWVzc2FnZSIsImV4IiwicXIiLCJ1cmxjb2RlIiwiUVJDb2RlIiwidG9EYXRhVVJMIiwicXJjb2RlIiwidmVyc2lvbiIsImdldFFyQ29kZSIsImltZyIsIkJ1ZmZlciIsImZyb20iLCJ3cml0ZUhlYWQiLCJsZW5ndGgiLCJlbmQiLCJraWxsU2VydmljZVdvcmtlciIsInJlc3RhcnRTZXJ2aWNlIiwic3Vic2NyaWJlUHJlc2VuY2UiLCJwaG9uZSIsImlzR3JvdXAiLCJhbGwiLCJjb250YWN0cyIsImdyb3VwcyIsImdldEFsbEdyb3VwcyIsInAiLCJpZCIsIl9zZXJpYWxpemVkIiwiY2hhdHMiLCJnZXRBbGxDb250YWN0cyIsImMiLCJjb250YXRvIiwiY29udGFjdFRvQXJyYXkiLCJlZGl0QnVzaW5lc3NQcm9maWxlIl0sInNvdXJjZXMiOlsiLi4vLi4vc3JjL2NvbnRyb2xsZXIvc2Vzc2lvbkNvbnRyb2xsZXIudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLypcclxuICogQ29weXJpZ2h0IDIwMjEgV1BQQ29ubmVjdCBUZWFtXHJcbiAqXHJcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XHJcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cclxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XHJcbiAqXHJcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcclxuICpcclxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxyXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXHJcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxyXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWNsZWFyU2Vzc2lvbmlzc2lvbnMgYW5kXHJcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxyXG4gKi9cclxuaW1wb3J0IHsgTWVzc2FnZSwgV2hhdHNhcHAgfSBmcm9tICdAd3BwY29ubmVjdC10ZWFtL3dwcGNvbm5lY3QnO1xyXG5pbXBvcnQgeyBSZXF1ZXN0LCBSZXNwb25zZSB9IGZyb20gJ2V4cHJlc3MnO1xyXG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xyXG5pbXBvcnQgbWltZSBmcm9tICdtaW1lLXR5cGVzJztcclxuaW1wb3J0IFFSQ29kZSBmcm9tICdxcmNvZGUnO1xyXG5pbXBvcnQgeyBMb2dnZXIgfSBmcm9tICd3aW5zdG9uJztcclxuXHJcbmltcG9ydCB7IHZlcnNpb24gfSBmcm9tICcuLi8uLi9wYWNrYWdlLmpzb24nO1xyXG5pbXBvcnQgY29uZmlnIGZyb20gJy4uL2NvbmZpZyc7XHJcbmltcG9ydCBDcmVhdGVTZXNzaW9uVXRpbCBmcm9tICcuLi91dGlsL2NyZWF0ZVNlc3Npb25VdGlsJztcclxuaW1wb3J0IHsgY2FsbFdlYkhvb2ssIGNvbnRhY3RUb0FycmF5IH0gZnJvbSAnLi4vdXRpbC9mdW5jdGlvbnMnO1xyXG5pbXBvcnQgZ2V0QWxsVG9rZW5zIGZyb20gJy4uL3V0aWwvZ2V0QWxsVG9rZW5zJztcclxuaW1wb3J0IHsgY2xpZW50c0FycmF5LCBkZWxldGVTZXNzaW9uT25BcnJheSB9IGZyb20gJy4uL3V0aWwvc2Vzc2lvblV0aWwnO1xyXG5cclxuY29uc3QgU2Vzc2lvblV0aWwgPSBuZXcgQ3JlYXRlU2Vzc2lvblV0aWwoKTtcclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGRvd25sb2FkRmlsZUZ1bmN0aW9uKFxyXG4gIG1lc3NhZ2U6IE1lc3NhZ2UsXHJcbiAgY2xpZW50OiBXaGF0c2FwcCxcclxuICBsb2dnZXI6IExvZ2dlclxyXG4pIHtcclxuICB0cnkge1xyXG4gICAgY29uc3QgYnVmZmVyID0gYXdhaXQgY2xpZW50LmRlY3J5cHRGaWxlKG1lc3NhZ2UpO1xyXG5cclxuICAgIGNvbnN0IGZpbGVuYW1lID0gYC4vV2hhdHNBcHBJbWFnZXMvZmlsZSR7bWVzc2FnZS50fWA7XHJcbiAgICBpZiAoIWZzLmV4aXN0c1N5bmMoZmlsZW5hbWUpKSB7XHJcbiAgICAgIGxldCByZXN1bHQgPSAnJztcclxuICAgICAgaWYgKG1lc3NhZ2UudHlwZSA9PT0gJ3B0dCcpIHtcclxuICAgICAgICByZXN1bHQgPSBgJHtmaWxlbmFtZX0ub2dhYDtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICByZXN1bHQgPSBgJHtmaWxlbmFtZX0uJHttaW1lLmV4dGVuc2lvbihtZXNzYWdlLm1pbWV0eXBlKX1gO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBhd2FpdCBmcy53cml0ZUZpbGUocmVzdWx0LCBidWZmZXIsIChlcnIpID0+IHtcclxuICAgICAgICBpZiAoZXJyKSB7XHJcbiAgICAgICAgICBsb2dnZXIuZXJyb3IoZXJyKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJldHVybiBgJHtmaWxlbmFtZX0uJHttaW1lLmV4dGVuc2lvbihtZXNzYWdlLm1pbWV0eXBlKX1gO1xyXG4gICAgfVxyXG4gIH0gY2F0Y2ggKGUpIHtcclxuICAgIGxvZ2dlci5lcnJvcihlKTtcclxuICAgIGxvZ2dlci53YXJuKFxyXG4gICAgICAnRXJybyBhbyBkZXNjcmlwdG9ncmFmYXIgYSBtaWRpYSwgdGVudGFuZG8gZmF6ZXIgbyBkb3dubG9hZCBkaXJldG8uLi4nXHJcbiAgICApO1xyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3QgYnVmZmVyID0gYXdhaXQgY2xpZW50LmRvd25sb2FkTWVkaWEobWVzc2FnZSk7XHJcbiAgICAgIGNvbnN0IGZpbGVuYW1lID0gYC4vV2hhdHNBcHBJbWFnZXMvZmlsZSR7bWVzc2FnZS50fWA7XHJcbiAgICAgIGlmICghZnMuZXhpc3RzU3luYyhmaWxlbmFtZSkpIHtcclxuICAgICAgICBsZXQgcmVzdWx0ID0gJyc7XHJcbiAgICAgICAgaWYgKG1lc3NhZ2UudHlwZSA9PT0gJ3B0dCcpIHtcclxuICAgICAgICAgIHJlc3VsdCA9IGAke2ZpbGVuYW1lfS5vZ2FgO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICByZXN1bHQgPSBgJHtmaWxlbmFtZX0uJHttaW1lLmV4dGVuc2lvbihtZXNzYWdlLm1pbWV0eXBlKX1gO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgYXdhaXQgZnMud3JpdGVGaWxlKHJlc3VsdCwgYnVmZmVyLCAoZXJyKSA9PiB7XHJcbiAgICAgICAgICBpZiAoZXJyKSB7XHJcbiAgICAgICAgICAgIGxvZ2dlci5lcnJvcihlcnIpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJldHVybiBgJHtmaWxlbmFtZX0uJHttaW1lLmV4dGVuc2lvbihtZXNzYWdlLm1pbWV0eXBlKX1gO1xyXG4gICAgICB9XHJcbiAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgIGxvZ2dlci5lcnJvcihlKTtcclxuICAgICAgbG9nZ2VyLndhcm4oJ07Do28gZm9pIHBvc3PDrXZlbCBiYWl4YXIgYSBtw61kaWEuLi4nKTtcclxuICAgIH1cclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBkb3dubG9hZChtZXNzYWdlOiBhbnksIGNsaWVudDogYW55LCBsb2dnZXI6IGFueSkge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBwYXRoID0gYXdhaXQgZG93bmxvYWRGaWxlRnVuY3Rpb24obWVzc2FnZSwgY2xpZW50LCBsb2dnZXIpO1xyXG4gICAgcmV0dXJuIHBhdGg/LnJlcGxhY2UoJy4vJywgJycpO1xyXG4gIH0gY2F0Y2ggKGUpIHtcclxuICAgIGxvZ2dlci5lcnJvcihlKTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzdGFydEFsbFNlc3Npb25zKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSkge1xyXG4gIC8qKlxyXG4gICAqICNzd2FnZ2VyLnRhZ3MgPSBbXCJBdXRoXCJdXHJcbiAgICAgI3N3YWdnZXIuYXV0b0JvZHk9ZmFsc2VcclxuICAgICAjc3dhZ2dlci5vcGVyYXRpb25JZCA9ICdzdGFydEFsbFNlc3Npb25zJ1xyXG4gICAgICNzd2FnZ2VyLnNlY3VyaXR5ID0gW3tcclxuICAgICAgICAgICAgXCJiZWFyZXJBdXRoXCI6IFtdXHJcbiAgICAgfV1cclxuICAgICAjc3dhZ2dlci5wYXJhbWV0ZXJzW1wic2Vzc2lvblwiXSA9IHtcclxuICAgICAgc2NoZW1hOiAnTkVSRFdIQVRTX0FNRVJJQ0EnXHJcbiAgICAgfVxyXG4gICAgICNzd2FnZ2VyLnBhcmFtZXRlcnNbXCJzZWNyZXRrZXlcIl0gPSB7XHJcbiAgICAgIHNjaGVtYTogJ1RISVNJU01ZU0VDVVJFQ09ERSdcclxuICAgICB9XHJcbiAgICovXHJcbiAgY29uc3QgeyBzZWNyZXRrZXkgfSA9IHJlcS5wYXJhbXM7XHJcbiAgY29uc3QgeyBhdXRob3JpemF0aW9uOiB0b2tlbiB9ID0gcmVxLmhlYWRlcnM7XHJcblxyXG4gIGxldCB0b2tlbkRlY3J5cHQgPSAnJztcclxuXHJcbiAgaWYgKHNlY3JldGtleSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICB0b2tlbkRlY3J5cHQgPSAodG9rZW4gYXMgYW55KS5zcGxpdCgnICcpWzBdO1xyXG4gIH0gZWxzZSB7XHJcbiAgICB0b2tlbkRlY3J5cHQgPSBzZWNyZXRrZXk7XHJcbiAgfVxyXG5cclxuICBjb25zdCBhbGxTZXNzaW9ucyA9IGF3YWl0IGdldEFsbFRva2VucyhyZXEpO1xyXG5cclxuICBpZiAodG9rZW5EZWNyeXB0ICE9PSByZXEuc2VydmVyT3B0aW9ucy5zZWNyZXRLZXkpIHtcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7XHJcbiAgICAgIHJlc3BvbnNlOiAnZXJyb3InLFxyXG4gICAgICBtZXNzYWdlOiAnVGhlIHRva2VuIGlzIGluY29ycmVjdCcsXHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIGFsbFNlc3Npb25zLm1hcChhc3luYyAoc2Vzc2lvbjogc3RyaW5nKSA9PiB7XHJcbiAgICBjb25zdCB1dGlsID0gbmV3IENyZWF0ZVNlc3Npb25VdGlsKCk7XHJcbiAgICBhd2FpdCB1dGlsLm9wZW5kYXRhKHJlcSwgc2Vzc2lvbik7XHJcbiAgfSk7XHJcblxyXG4gIHJldHVybiBhd2FpdCByZXNcclxuICAgIC5zdGF0dXMoMjAxKVxyXG4gICAgLmpzb24oeyBzdGF0dXM6ICdzdWNjZXNzJywgbWVzc2FnZTogJ1N0YXJ0aW5nIGFsbCBzZXNzaW9ucycgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzaG93QWxsU2Vzc2lvbnMocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKSB7XHJcbiAgLyoqXHJcbiAgICogI3N3YWdnZXIudGFncyA9IFtcIkF1dGhcIl1cclxuICAgICAjc3dhZ2dlci5hdXRvQm9keT1mYWxzZVxyXG4gICAgICNzd2FnZ2VyLm9wZXJhdGlvbklkID0gJ3Nob3dBbGxTZXNzaW9ucydcclxuICAgICAjc3dhZ2dlci5hdXRvUXVlcnk9ZmFsc2VcclxuICAgICAjc3dhZ2dlci5hdXRvSGVhZGVycz1mYWxzZVxyXG4gICAgICNzd2FnZ2VyLnNlY3VyaXR5ID0gW3tcclxuICAgICAgICAgICAgXCJiZWFyZXJBdXRoXCI6IFtdXHJcbiAgICAgfV1cclxuICAgICAjc3dhZ2dlci5wYXJhbWV0ZXJzW1wic2VjcmV0a2V5XCJdID0ge1xyXG4gICAgICBzY2hlbWE6ICdUSElTSVNNWVNFQ1VSRVRPS0VOJ1xyXG4gICAgIH1cclxuICAgKi9cclxuICBjb25zdCB7IHNlY3JldGtleSB9ID0gcmVxLnBhcmFtcztcclxuICBjb25zdCB7IGF1dGhvcml6YXRpb246IHRva2VuIH0gPSByZXEuaGVhZGVycztcclxuXHJcbiAgbGV0IHRva2VuRGVjcnlwdDogYW55ID0gJyc7XHJcblxyXG4gIGlmIChzZWNyZXRrZXkgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgdG9rZW5EZWNyeXB0ID0gdG9rZW4/LnNwbGl0KCcgJylbMF07XHJcbiAgfSBlbHNlIHtcclxuICAgIHRva2VuRGVjcnlwdCA9IHNlY3JldGtleTtcclxuICB9XHJcblxyXG4gIGNvbnN0IGFycjogYW55ID0gW107XHJcblxyXG4gIGlmICh0b2tlbkRlY3J5cHQgIT09IHJlcS5zZXJ2ZXJPcHRpb25zLnNlY3JldEtleSkge1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHtcclxuICAgICAgcmVzcG9uc2U6IGZhbHNlLFxyXG4gICAgICBtZXNzYWdlOiAnVGhlIHRva2VuIGlzIGluY29ycmVjdCcsXHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIE9iamVjdC5rZXlzKGNsaWVudHNBcnJheSkuZm9yRWFjaCgoaXRlbSkgPT4ge1xyXG4gICAgYXJyLnB1c2goeyBzZXNzaW9uOiBpdGVtIH0pO1xyXG4gIH0pO1xyXG5cclxuICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oeyByZXNwb25zZTogYXdhaXQgZ2V0QWxsVG9rZW5zKHJlcSkgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzdGFydFNlc3Npb24ocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKSB7XHJcbiAgLyoqXHJcbiAgICogI3N3YWdnZXIudGFncyA9IFtcIkF1dGhcIl1cclxuICAgICAjc3dhZ2dlci5hdXRvQm9keT1mYWxzZVxyXG4gICAgICNzd2FnZ2VyLm9wZXJhdGlvbklkID0gJ3N0YXJ0U2Vzc2lvbidcclxuICAgICAjc3dhZ2dlci5zZWN1cml0eSA9IFt7XHJcbiAgICAgICAgICAgIFwiYmVhcmVyQXV0aFwiOiBbXVxyXG4gICAgIH1dXHJcbiAgICAgI3N3YWdnZXIucGFyYW1ldGVyc1tcInNlc3Npb25cIl0gPSB7XHJcbiAgICAgIHNjaGVtYTogJ05FUkRXSEFUU19BTUVSSUNBJ1xyXG4gICAgIH1cclxuICAgICAjc3dhZ2dlci5yZXF1ZXN0Qm9keSA9IHtcclxuICAgICAgcmVxdWlyZWQ6IHRydWUsXHJcbiAgICAgIFwiQGNvbnRlbnRcIjoge1xyXG4gICAgICAgIFwiYXBwbGljYXRpb24vanNvblwiOiB7XHJcbiAgICAgICAgICBzY2hlbWE6IHtcclxuICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgIHdlYmhvb2s6IHsgdHlwZTogXCJzdHJpbmdcIiB9LFxyXG4gICAgICAgICAgICAgIHdhaXRRckNvZGU6IHsgdHlwZTogXCJib29sZWFuXCIgfSxcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIGV4YW1wbGU6IHtcclxuICAgICAgICAgICAgd2ViaG9vazogXCJcIixcclxuICAgICAgICAgICAgd2FpdFFyQ29kZTogZmFsc2UsXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgfVxyXG4gICAqL1xyXG4gIGNvbnN0IHNlc3Npb24gPSByZXEuc2Vzc2lvbjtcclxuICBjb25zdCB7IHdhaXRRckNvZGUgPSB0cnVlIH0gPSByZXEuYm9keTtcclxuXHJcbiAgYXdhaXQgZ2V0U2Vzc2lvblN0YXRlKHJlcSwgcmVzKTtcclxuICBhd2FpdCBTZXNzaW9uVXRpbC5vcGVuZGF0YShyZXEsIHNlc3Npb24sIHdhaXRRckNvZGUgPyByZXMgOiBudWxsKTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNsb3NlU2Vzc2lvbihyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpIHtcclxuICAvKipcclxuICAgKiAjc3dhZ2dlci50YWdzID0gW1wiQXV0aFwiXVxyXG4gICAgICNzd2FnZ2VyLm9wZXJhdGlvbklkID0gJ2Nsb3NlU2Vzc2lvbidcclxuICAgICAjc3dhZ2dlci5hdXRvQm9keT10cnVlXHJcbiAgICAgI3N3YWdnZXIuc2VjdXJpdHkgPSBbe1xyXG4gICAgICAgICAgICBcImJlYXJlckF1dGhcIjogW11cclxuICAgICB9XVxyXG4gICAgICNzd2FnZ2VyLnBhcmFtZXRlcnNbXCJzZXNzaW9uXCJdID0ge1xyXG4gICAgICBzY2hlbWE6ICdORVJEV0hBVFNfQU1FUklDQSdcclxuICAgICB9XHJcbiAgICovXHJcbiAgY29uc3Qgc2Vzc2lvbiA9IHJlcS5zZXNzaW9uO1xyXG4gIHRyeSB7XHJcbiAgICBpZiAoKGNsaWVudHNBcnJheSBhcyBhbnkpW3Nlc3Npb25dLnN0YXR1cyA9PT0gbnVsbCkge1xyXG4gICAgICByZXR1cm4gYXdhaXQgcmVzXHJcbiAgICAgICAgLnN0YXR1cygyMDApXHJcbiAgICAgICAgLmpzb24oeyBzdGF0dXM6IHRydWUsIG1lc3NhZ2U6ICdTZXNzaW9uIHN1Y2Nlc3NmdWxseSBjbG9zZWQnIH0pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgKGNsaWVudHNBcnJheSBhcyBhbnkpW3Nlc3Npb25dID0geyBzdGF0dXM6IG51bGwgfTtcclxuXHJcbiAgICAgIGF3YWl0IHJlcS5jbGllbnQuY2xvc2UoKTtcclxuICAgICAgcmVxLmlvLmVtaXQoJ3doYXRzYXBwLXN0YXR1cycsIGZhbHNlKTtcclxuICAgICAgY2FsbFdlYkhvb2socmVxLmNsaWVudCwgcmVxLCAnY2xvc2VzZXNzaW9uJywge1xyXG4gICAgICAgIG1lc3NhZ2U6IGBTZXNzaW9uOiAke3Nlc3Npb259IGRpc2Nvbm5lY3RlZGAsXHJcbiAgICAgICAgY29ubmVjdGVkOiBmYWxzZSxcclxuICAgICAgfSk7XHJcblxyXG4gICAgICByZXR1cm4gYXdhaXQgcmVzXHJcbiAgICAgICAgLnN0YXR1cygyMDApXHJcbiAgICAgICAgLmpzb24oeyBzdGF0dXM6IHRydWUsIG1lc3NhZ2U6ICdTZXNzaW9uIHN1Y2Nlc3NmdWxseSBjbG9zZWQnIH0pO1xyXG4gICAgfVxyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICByZXEubG9nZ2VyLmVycm9yKGVycm9yKTtcclxuICAgIHJldHVybiBhd2FpdCByZXNcclxuICAgICAgLnN0YXR1cyg1MDApXHJcbiAgICAgIC5qc29uKHsgc3RhdHVzOiBmYWxzZSwgbWVzc2FnZTogJ0Vycm9yIGNsb3Npbmcgc2Vzc2lvbicsIGVycm9yIH0pO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGxvZ091dFNlc3Npb24ocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKSB7XHJcbiAgLyoqXHJcbiAgICogI3N3YWdnZXIudGFncyA9IFtcIkF1dGhcIl1cclxuICAgICAjc3dhZ2dlci5vcGVyYXRpb25JZCA9ICdsb2dvdXRTZXNzaW9uJ1xyXG4gICAqICNzd2FnZ2VyLmRlc2NyaXB0aW9uID0gJ1RoaXMgcm91dGUgbG9nb3V0IGFuZCBkZWxldGUgc2Vzc2lvbiBkYXRhJ1xyXG4gICAgICNzd2FnZ2VyLmF1dG9Cb2R5PWZhbHNlXHJcbiAgICAgI3N3YWdnZXIuc2VjdXJpdHkgPSBbe1xyXG4gICAgICAgICAgICBcImJlYXJlckF1dGhcIjogW11cclxuICAgICB9XVxyXG4gICAgICNzd2FnZ2VyLnBhcmFtZXRlcnNbXCJzZXNzaW9uXCJdID0ge1xyXG4gICAgICBzY2hlbWE6ICdORVJEV0hBVFNfQU1FUklDQSdcclxuICAgICB9XHJcbiAgICovXHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHNlc3Npb24gPSByZXEuc2Vzc2lvbjtcclxuICAgIGF3YWl0IHJlcS5jbGllbnQubG9nb3V0KCk7XHJcbiAgICBkZWxldGVTZXNzaW9uT25BcnJheShyZXEuc2Vzc2lvbik7XHJcblxyXG4gICAgc2V0VGltZW91dChhc3luYyAoKSA9PiB7XHJcbiAgICAgIGNvbnN0IHBhdGhVc2VyRGF0YSA9IGNvbmZpZy5jdXN0b21Vc2VyRGF0YURpciArIHJlcS5zZXNzaW9uO1xyXG4gICAgICBjb25zdCBwYXRoVG9rZW5zID0gX19kaXJuYW1lICsgYC4uLy4uLy4uL3Rva2Vucy8ke3JlcS5zZXNzaW9ufS5kYXRhLmpzb25gO1xyXG5cclxuICAgICAgaWYgKGZzLmV4aXN0c1N5bmMocGF0aFVzZXJEYXRhKSkge1xyXG4gICAgICAgIGF3YWl0IGZzLnByb21pc2VzLnJtKHBhdGhVc2VyRGF0YSwge1xyXG4gICAgICAgICAgcmVjdXJzaXZlOiB0cnVlLFxyXG4gICAgICAgICAgbWF4UmV0cmllczogNSxcclxuICAgICAgICAgIGZvcmNlOiB0cnVlLFxyXG4gICAgICAgICAgcmV0cnlEZWxheTogMTAwMCxcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgICBpZiAoZnMuZXhpc3RzU3luYyhwYXRoVG9rZW5zKSkge1xyXG4gICAgICAgIGF3YWl0IGZzLnByb21pc2VzLnJtKHBhdGhUb2tlbnMsIHtcclxuICAgICAgICAgIHJlY3Vyc2l2ZTogdHJ1ZSxcclxuICAgICAgICAgIG1heFJldHJpZXM6IDUsXHJcbiAgICAgICAgICBmb3JjZTogdHJ1ZSxcclxuICAgICAgICAgIHJldHJ5RGVsYXk6IDEwMDAsXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJlcS5pby5lbWl0KCd3aGF0c2FwcC1zdGF0dXMnLCBmYWxzZSk7XHJcbiAgICAgIGNhbGxXZWJIb29rKHJlcS5jbGllbnQsIHJlcSwgJ2xvZ291dHNlc3Npb24nLCB7XHJcbiAgICAgICAgbWVzc2FnZTogYFNlc3Npb246ICR7c2Vzc2lvbn0gbG9nZ2VkIG91dGAsXHJcbiAgICAgICAgY29ubmVjdGVkOiBmYWxzZSxcclxuICAgICAgfSk7XHJcblxyXG4gICAgICByZXR1cm4gYXdhaXQgcmVzXHJcbiAgICAgICAgLnN0YXR1cygyMDApXHJcbiAgICAgICAgLmpzb24oeyBzdGF0dXM6IHRydWUsIG1lc3NhZ2U6ICdTZXNzaW9uIHN1Y2Nlc3NmdWxseSBjbG9zZWQnIH0pO1xyXG4gICAgfSwgNTAwKTtcclxuICAgIC8qdHJ5IHtcclxuICAgICAgYXdhaXQgcmVxLmNsaWVudC5jbG9zZSgpO1xyXG4gICAgfSBjYXRjaCAoZXJyb3IpIHt9Ki9cclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgcmVxLmxvZ2dlci5lcnJvcihlcnJvcik7XHJcbiAgICByZXR1cm4gYXdhaXQgcmVzXHJcbiAgICAgIC5zdGF0dXMoNTAwKVxyXG4gICAgICAuanNvbih7IHN0YXR1czogZmFsc2UsIG1lc3NhZ2U6ICdFcnJvciBjbG9zaW5nIHNlc3Npb24nLCBlcnJvciB9KTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjaGVja0Nvbm5lY3Rpb25TZXNzaW9uKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSkge1xyXG4gIC8qKlxyXG4gICAqICNzd2FnZ2VyLnRhZ3MgPSBbXCJBdXRoXCJdXHJcbiAgICAgI3N3YWdnZXIub3BlcmF0aW9uSWQgPSAnQ2hlY2tDb25uZWN0aW9uU3RhdGUnXHJcbiAgICAgI3N3YWdnZXIuYXV0b0JvZHk9ZmFsc2VcclxuICAgICAjc3dhZ2dlci5zZWN1cml0eSA9IFt7XHJcbiAgICAgICAgICAgIFwiYmVhcmVyQXV0aFwiOiBbXVxyXG4gICAgIH1dXHJcbiAgICAgI3N3YWdnZXIucGFyYW1ldGVyc1tcInNlc3Npb25cIl0gPSB7XHJcbiAgICAgIHNjaGVtYTogJ05FUkRXSEFUU19BTUVSSUNBJ1xyXG4gICAgIH1cclxuICAgKi9cclxuICB0cnkge1xyXG4gICAgYXdhaXQgcmVxLmNsaWVudC5pc0Nvbm5lY3RlZCgpO1xyXG5cclxuICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7IHN0YXR1czogdHJ1ZSwgbWVzc2FnZTogJ0Nvbm5lY3RlZCcgfSk7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7IHN0YXR1czogZmFsc2UsIG1lc3NhZ2U6ICdEaXNjb25uZWN0ZWQnIH0pO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGRvd25sb2FkTWVkaWFCeU1lc3NhZ2UocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKSB7XHJcbiAgLyoqXHJcbiAgICogI3N3YWdnZXIudGFncyA9IFtcIk1lc3NhZ2VzXCJdXHJcbiAgICAgI3N3YWdnZXIuYXV0b0JvZHk9ZmFsc2VcclxuICAgICAjc3dhZ2dlci5vcGVyYXRpb25JZCA9ICdkb3dubG9hZE1lZGlhYnlNZXNzYWdlJ1xyXG4gICAgICNzd2FnZ2VyLnNlY3VyaXR5ID0gW3tcclxuICAgICAgICAgICAgXCJiZWFyZXJBdXRoXCI6IFtdXHJcbiAgICAgfV1cclxuICAgICAjc3dhZ2dlci5wYXJhbWV0ZXJzW1wic2Vzc2lvblwiXSA9IHtcclxuICAgICAgc2NoZW1hOiAnTkVSRFdIQVRTX0FNRVJJQ0EnXHJcbiAgICAgfVxyXG4gICAgICNzd2FnZ2VyLnJlcXVlc3RCb2R5ID0ge1xyXG4gICAgICByZXF1aXJlZDogdHJ1ZSxcclxuICAgICAgXCJAY29udGVudFwiOiB7XHJcbiAgICAgICAgXCJhcHBsaWNhdGlvbi9qc29uXCI6IHtcclxuICAgICAgICAgIHNjaGVtYToge1xyXG4gICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgbWVzc2FnZUlkOiB7IHR5cGU6IFwic3RyaW5nXCIgfSxcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIGV4YW1wbGU6IHtcclxuICAgICAgICAgICAgbWVzc2FnZUlkOiAnPG1lc3NhZ2VJZD4nXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgfVxyXG4gICAqL1xyXG4gIGNvbnN0IGNsaWVudCA9IHJlcS5jbGllbnQ7XHJcbiAgY29uc3QgeyBtZXNzYWdlSWQgfSA9IHJlcS5ib2R5O1xyXG5cclxuICBsZXQgbWVzc2FnZTtcclxuXHJcbiAgdHJ5IHtcclxuICAgIGlmICghbWVzc2FnZUlkLmlzTWVkaWEgfHwgIW1lc3NhZ2VJZC50eXBlKSB7XHJcbiAgICAgIG1lc3NhZ2UgPSBhd2FpdCBjbGllbnQuZ2V0TWVzc2FnZUJ5SWQobWVzc2FnZUlkKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIG1lc3NhZ2UgPSBtZXNzYWdlSWQ7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCFtZXNzYWdlKVxyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oe1xyXG4gICAgICAgIHN0YXR1czogJ2Vycm9yJyxcclxuICAgICAgICBtZXNzYWdlOiAnTWVzc2FnZSBub3QgZm91bmQnLFxyXG4gICAgICB9KTtcclxuXHJcbiAgICBpZiAoIShtZXNzYWdlWydtaW1ldHlwZSddIHx8IG1lc3NhZ2UuaXNNZWRpYSB8fCBtZXNzYWdlLmlzTU1TKSlcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHtcclxuICAgICAgICBzdGF0dXM6ICdlcnJvcicsXHJcbiAgICAgICAgbWVzc2FnZTogJ01lc3NhZ2UgZG9lcyBub3QgY29udGFpbiBtZWRpYScsXHJcbiAgICAgIH0pO1xyXG5cclxuICAgIGNvbnN0IGJ1ZmZlciA9IGF3YWl0IGNsaWVudC5kZWNyeXB0RmlsZShtZXNzYWdlKTtcclxuXHJcbiAgICByZXR1cm4gcmVzXHJcbiAgICAgIC5zdGF0dXMoMjAwKVxyXG4gICAgICAuanNvbih7IGJhc2U2NDogYnVmZmVyLnRvU3RyaW5nKCdiYXNlNjQnKSwgbWltZXR5cGU6IG1lc3NhZ2UubWltZXR5cGUgfSk7XHJcbiAgfSBjYXRjaCAoZSkge1xyXG4gICAgcmVxLmxvZ2dlci5lcnJvcihlKTtcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7XHJcbiAgICAgIHN0YXR1czogJ2Vycm9yJyxcclxuICAgICAgbWVzc2FnZTogJ0RlY3J5cHQgZmlsZSBlcnJvcicsXHJcbiAgICAgIGVycm9yOiBlLFxyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0TWVkaWFCeU1lc3NhZ2UocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKSB7XHJcbiAgLyoqXHJcbiAgICogI3N3YWdnZXIudGFncyA9IFtcIk1lc3NhZ2VzXCJdXHJcbiAgICAgI3N3YWdnZXIuYXV0b0JvZHk9ZmFsc2VcclxuICAgICAjc3dhZ2dlci5vcGVyYXRpb25JZCA9ICdnZXRNZWRpYUJ5TWVzc2FnZSdcclxuICAgICAjc3dhZ2dlci5zZWN1cml0eSA9IFt7XHJcbiAgICAgICAgICAgIFwiYmVhcmVyQXV0aFwiOiBbXVxyXG4gICAgIH1dXHJcbiAgICAgI3N3YWdnZXIucGFyYW1ldGVyc1tcInNlc3Npb25cIl0gPSB7XHJcbiAgICAgIHNjaGVtYTogJ05FUkRXSEFUU19BTUVSSUNBJ1xyXG4gICAgIH1cclxuICAgICAjc3dhZ2dlci5wYXJhbWV0ZXJzW1wic2Vzc2lvblwiXSA9IHtcclxuICAgICAgc2NoZW1hOiAnbWVzc2FnZUlkJ1xyXG4gICAgIH1cclxuICAgKi9cclxuICBjb25zdCBjbGllbnQgPSByZXEuY2xpZW50O1xyXG4gIGNvbnN0IHsgbWVzc2FnZUlkIH0gPSByZXEucGFyYW1zO1xyXG5cclxuICB0cnkge1xyXG4gICAgY29uc3QgbWVzc2FnZSA9IGF3YWl0IGNsaWVudC5nZXRNZXNzYWdlQnlJZChtZXNzYWdlSWQpO1xyXG5cclxuICAgIGlmICghbWVzc2FnZSlcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHtcclxuICAgICAgICBzdGF0dXM6ICdlcnJvcicsXHJcbiAgICAgICAgbWVzc2FnZTogJ01lc3NhZ2Ugbm90IGZvdW5kJyxcclxuICAgICAgfSk7XHJcblxyXG4gICAgaWYgKCEobWVzc2FnZVsnbWltZXR5cGUnXSB8fCBtZXNzYWdlLmlzTWVkaWEgfHwgbWVzc2FnZS5pc01NUykpXHJcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7XHJcbiAgICAgICAgc3RhdHVzOiAnZXJyb3InLFxyXG4gICAgICAgIG1lc3NhZ2U6ICdNZXNzYWdlIGRvZXMgbm90IGNvbnRhaW4gbWVkaWEnLFxyXG4gICAgICB9KTtcclxuXHJcbiAgICBjb25zdCBidWZmZXIgPSBhd2FpdCBjbGllbnQuZGVjcnlwdEZpbGUobWVzc2FnZSk7XHJcblxyXG4gICAgcmV0dXJuIHJlc1xyXG4gICAgICAuc3RhdHVzKDIwMClcclxuICAgICAgLmpzb24oeyBiYXNlNjQ6IGJ1ZmZlci50b1N0cmluZygnYmFzZTY0JyksIG1pbWV0eXBlOiBtZXNzYWdlLm1pbWV0eXBlIH0pO1xyXG4gIH0gY2F0Y2ggKGV4KSB7XHJcbiAgICByZXEubG9nZ2VyLmVycm9yKGV4KTtcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7XHJcbiAgICAgIHN0YXR1czogJ2Vycm9yJyxcclxuICAgICAgbWVzc2FnZTogJ1RoZSBzZXNzaW9uIGlzIG5vdCBhY3RpdmUnLFxyXG4gICAgICBlcnJvcjogZXgsXHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRTZXNzaW9uU3RhdGUocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKSB7XHJcbiAgLyoqXHJcbiAgICAgI3N3YWdnZXIudGFncyA9IFtcIkF1dGhcIl1cclxuICAgICAjc3dhZ2dlci5vcGVyYXRpb25JZCA9ICdnZXRTZXNzaW9uU3RhdGUnXHJcbiAgICAgI3N3YWdnZXIuc3VtbWFyeSA9ICdSZXRyaWV2ZSBzdGF0dXMgb2YgYSBzZXNzaW9uJ1xyXG4gICAgICNzd2FnZ2VyLmF1dG9Cb2R5ID0gZmFsc2VcclxuICAgICAjc3dhZ2dlci5zZWN1cml0eSA9IFt7XHJcbiAgICAgICAgICAgIFwiYmVhcmVyQXV0aFwiOiBbXVxyXG4gICAgIH1dXHJcbiAgICAgI3N3YWdnZXIucGFyYW1ldGVyc1tcInNlc3Npb25cIl0gPSB7XHJcbiAgICAgIHNjaGVtYTogJ05FUkRXSEFUU19BTUVSSUNBJ1xyXG4gICAgIH1cclxuICAgKi9cclxuICB0cnkge1xyXG4gICAgY29uc3QgeyB3YWl0UXJDb2RlID0gZmFsc2UgfSA9IHJlcS5ib2R5O1xyXG4gICAgY29uc3QgY2xpZW50ID0gcmVxLmNsaWVudDtcclxuICAgIGNvbnN0IHFyID1cclxuICAgICAgY2xpZW50Py51cmxjb2RlICE9IG51bGwgJiYgY2xpZW50Py51cmxjb2RlICE9ICcnXHJcbiAgICAgICAgPyBhd2FpdCBRUkNvZGUudG9EYXRhVVJMKGNsaWVudC51cmxjb2RlKVxyXG4gICAgICAgIDogbnVsbDtcclxuXHJcbiAgICBpZiAoKGNsaWVudCA9PSBudWxsIHx8IGNsaWVudC5zdGF0dXMgPT0gbnVsbCkgJiYgIXdhaXRRckNvZGUpXHJcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7IHN0YXR1czogJ0NMT1NFRCcsIHFyY29kZTogbnVsbCB9KTtcclxuICAgIGVsc2UgaWYgKGNsaWVudCAhPSBudWxsKVxyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oe1xyXG4gICAgICAgIHN0YXR1czogY2xpZW50LnN0YXR1cyxcclxuICAgICAgICBxcmNvZGU6IHFyLFxyXG4gICAgICAgIHVybGNvZGU6IGNsaWVudC51cmxjb2RlLFxyXG4gICAgICAgIHZlcnNpb246IHZlcnNpb24sXHJcbiAgICAgIH0pO1xyXG4gIH0gY2F0Y2ggKGV4KSB7XHJcbiAgICByZXEubG9nZ2VyLmVycm9yKGV4KTtcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7XHJcbiAgICAgIHN0YXR1czogJ2Vycm9yJyxcclxuICAgICAgbWVzc2FnZTogJ1RoZSBzZXNzaW9uIGlzIG5vdCBhY3RpdmUnLFxyXG4gICAgICBlcnJvcjogZXgsXHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRRckNvZGUocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKSB7XHJcbiAgLyoqXHJcbiAgICogI3N3YWdnZXIudGFncyA9IFtcIkF1dGhcIl1cclxuICAgICAjc3dhZ2dlci5hdXRvQm9keT1mYWxzZVxyXG4gICAgICNzd2FnZ2VyLm9wZXJhdGlvbklkID0gJ2dldFFyQ29kZSdcclxuICAgICAjc3dhZ2dlci5zZWN1cml0eSA9IFt7XHJcbiAgICAgICAgICAgIFwiYmVhcmVyQXV0aFwiOiBbXVxyXG4gICAgIH1dXHJcbiAgICAgI3N3YWdnZXIucGFyYW1ldGVyc1tcInNlc3Npb25cIl0gPSB7XHJcbiAgICAgIHNjaGVtYTogJ05FUkRXSEFUU19BTUVSSUNBJ1xyXG4gICAgIH1cclxuICAgKi9cclxuICB0cnkge1xyXG4gICAgaWYgKHJlcT8uY2xpZW50Py51cmxjb2RlKSB7XHJcbiAgICAgIGNvbnN0IHFyID0gcmVxLmNsaWVudC51cmxjb2RlXHJcbiAgICAgICAgPyBhd2FpdCBRUkNvZGUudG9EYXRhVVJMKHJlcS5jbGllbnQudXJsY29kZSlcclxuICAgICAgICA6IG51bGw7XHJcbiAgICAgIGNvbnN0IGltZyA9IEJ1ZmZlci5mcm9tKFxyXG4gICAgICAgIChxciBhcyBhbnkpLnJlcGxhY2UoL15kYXRhOmltYWdlXFwvKHBuZ3xqcGVnfGpwZyk7YmFzZTY0LC8sICcnKSxcclxuICAgICAgICAnYmFzZTY0J1xyXG4gICAgICApO1xyXG5cclxuICAgICAgcmVzLndyaXRlSGVhZCgyMDAsIHtcclxuICAgICAgICAnQ29udGVudC1UeXBlJzogJ2ltYWdlL3BuZycsXHJcbiAgICAgICAgJ0NvbnRlbnQtTGVuZ3RoJzogaW1nLmxlbmd0aCxcclxuICAgICAgfSk7XHJcbiAgICAgIHJlcy5lbmQoaW1nKTtcclxuICAgIH0gZWxzZSBpZiAodHlwZW9mIHJlcS5jbGllbnQgPT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7XHJcbiAgICAgICAgc3RhdHVzOiBudWxsLFxyXG4gICAgICAgIG1lc3NhZ2U6XHJcbiAgICAgICAgICAnU2Vzc2lvbiBub3Qgc3RhcnRlZC4gUGxlYXNlLCB1c2UgdGhlIC9zdGFydC1zZXNzaW9uIHJvdXRlLCBmb3IgaW5pdGlhbGl6YXRpb24geW91ciBzZXNzaW9uJyxcclxuICAgICAgfSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oe1xyXG4gICAgICAgIHN0YXR1czogcmVxLmNsaWVudC5zdGF0dXMsXHJcbiAgICAgICAgbWVzc2FnZTogJ1FSQ29kZSBpcyBub3QgYXZhaWxhYmxlLi4uJyxcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgfSBjYXRjaCAoZXgpIHtcclxuICAgIHJlcS5sb2dnZXIuZXJyb3IoZXgpO1xyXG4gICAgcmV0dXJuIHJlc1xyXG4gICAgICAuc3RhdHVzKDUwMClcclxuICAgICAgLmpzb24oeyBzdGF0dXM6ICdlcnJvcicsIG1lc3NhZ2U6ICdFcnJvciByZXRyaWV2aW5nIFFSQ29kZScsIGVycm9yOiBleCB9KTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBraWxsU2VydmljZVdvcmtlcihyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpIHtcclxuICAvKipcclxuICAgKiAjc3dhZ2dlci5pZ25vcmU9dHJ1ZVxyXG4gICAqICNzd2FnZ2VyLnRhZ3MgPSBbXCJNZXNzYWdlc1wiXVxyXG4gICAgICNzd2FnZ2VyLm9wZXJhdGlvbklkID0gJ2tpbGxTZXJ2aWNlV29ya2llcidcclxuICAgICAjc3dhZ2dlci5hdXRvQm9keT1mYWxzZVxyXG4gICAgICNzd2FnZ2VyLnNlY3VyaXR5ID0gW3tcclxuICAgICAgICAgICAgXCJiZWFyZXJBdXRoXCI6IFtdXHJcbiAgICAgfV1cclxuICAgICAjc3dhZ2dlci5wYXJhbWV0ZXJzW1wic2Vzc2lvblwiXSA9IHtcclxuICAgICAgc2NoZW1hOiAnTkVSRFdIQVRTX0FNRVJJQ0EnXHJcbiAgICAgfVxyXG4gICAqL1xyXG4gIHRyeSB7XHJcbiAgICByZXR1cm4gcmVzXHJcbiAgICAgIC5zdGF0dXMoMjAwKVxyXG4gICAgICAuanNvbih7IHN0YXR1czogJ2Vycm9yJywgcmVzcG9uc2U6ICdOb3QgaW1wbGVtZW50ZWQgeWV0JyB9KTtcclxuICB9IGNhdGNoIChleCkge1xyXG4gICAgcmVxLmxvZ2dlci5lcnJvcihleCk7XHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oe1xyXG4gICAgICBzdGF0dXM6ICdlcnJvcicsXHJcbiAgICAgIG1lc3NhZ2U6ICdUaGUgc2Vzc2lvbiBpcyBub3QgYWN0aXZlJyxcclxuICAgICAgZXJyb3I6IGV4LFxyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVzdGFydFNlcnZpY2UocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKSB7XHJcbiAgLyoqXHJcbiAgICogI3N3YWdnZXIuaWdub3JlPXRydWVcclxuICAgKiAjc3dhZ2dlci50YWdzID0gW1wiTWVzc2FnZXNcIl1cclxuICAgICAjc3dhZ2dlci5vcGVyYXRpb25JZCA9ICdyZXN0YXJ0U2VydmljZSdcclxuICAgICAjc3dhZ2dlci5hdXRvQm9keT1mYWxzZVxyXG4gICAgICNzd2FnZ2VyLnNlY3VyaXR5ID0gW3tcclxuICAgICAgICAgICAgXCJiZWFyZXJBdXRoXCI6IFtdXHJcbiAgICAgfV1cclxuICAgICAjc3dhZ2dlci5wYXJhbWV0ZXJzW1wic2Vzc2lvblwiXSA9IHtcclxuICAgICAgc2NoZW1hOiAnTkVSRFdIQVRTX0FNRVJJQ0EnXHJcbiAgICAgfVxyXG4gICAqL1xyXG4gIHRyeSB7XHJcbiAgICByZXR1cm4gcmVzXHJcbiAgICAgIC5zdGF0dXMoMjAwKVxyXG4gICAgICAuanNvbih7IHN0YXR1czogJ2Vycm9yJywgcmVzcG9uc2U6ICdOb3QgaW1wbGVtZW50ZWQgeWV0JyB9KTtcclxuICB9IGNhdGNoIChleCkge1xyXG4gICAgcmVxLmxvZ2dlci5lcnJvcihleCk7XHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oe1xyXG4gICAgICBzdGF0dXM6ICdlcnJvcicsXHJcbiAgICAgIHJlc3BvbnNlOiB7IG1lc3NhZ2U6ICdUaGUgc2Vzc2lvbiBpcyBub3QgYWN0aXZlJywgZXJyb3I6IGV4IH0sXHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzdWJzY3JpYmVQcmVzZW5jZShyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpIHtcclxuICAvKipcclxuICAgKiAjc3dhZ2dlci50YWdzID0gW1wiTWlzY1wiXVxyXG4gICAgICNzd2FnZ2VyLm9wZXJhdGlvbklkID0gJ3N1YnNjcmliZVByZXNlbmNlJ1xyXG4gICAgICNzd2FnZ2VyLmF1dG9Cb2R5PWZhbHNlXHJcbiAgICAgI3N3YWdnZXIuc2VjdXJpdHkgPSBbe1xyXG4gICAgICAgICAgICBcImJlYXJlckF1dGhcIjogW11cclxuICAgICB9XVxyXG4gICAgICNzd2FnZ2VyLnBhcmFtZXRlcnNbXCJzZXNzaW9uXCJdID0ge1xyXG4gICAgICBzY2hlbWE6ICdORVJEV0hBVFNfQU1FUklDQSdcclxuICAgICB9XHJcbiAgICAgI3N3YWdnZXIucmVxdWVzdEJvZHkgPSB7XHJcbiAgICAgIHJlcXVpcmVkOiB0cnVlLFxyXG4gICAgICBcIkBjb250ZW50XCI6IHtcclxuICAgICAgICBcImFwcGxpY2F0aW9uL2pzb25cIjoge1xyXG4gICAgICAgICAgc2NoZW1hOiB7XHJcbiAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICBwaG9uZTogeyB0eXBlOiBcInN0cmluZ1wiIH0sXHJcbiAgICAgICAgICAgICAgaXNHcm91cDogeyB0eXBlOiBcImJvb2xlYW5cIiB9LFxyXG4gICAgICAgICAgICAgIGFsbDogeyB0eXBlOiBcImJvb2xlYW5cIiB9LFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgZXhhbXBsZToge1xyXG4gICAgICAgICAgICBwaG9uZTogJzU1MjE5OTk5OTk5OTknLFxyXG4gICAgICAgICAgICBpc0dyb3VwOiBmYWxzZSxcclxuICAgICAgICAgICAgYWxsOiBmYWxzZSxcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICB9XHJcbiAgICovXHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHsgcGhvbmUsIGlzR3JvdXAgPSBmYWxzZSwgYWxsID0gZmFsc2UgfSA9IHJlcS5ib2R5O1xyXG5cclxuICAgIGlmIChhbGwpIHtcclxuICAgICAgbGV0IGNvbnRhY3RzO1xyXG4gICAgICBpZiAoaXNHcm91cCkge1xyXG4gICAgICAgIGNvbnN0IGdyb3VwcyA9IGF3YWl0IHJlcS5jbGllbnQuZ2V0QWxsR3JvdXBzKGZhbHNlKTtcclxuICAgICAgICBjb250YWN0cyA9IGdyb3Vwcy5tYXAoKHA6IGFueSkgPT4gcC5pZC5fc2VyaWFsaXplZCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgY29uc3QgY2hhdHMgPSBhd2FpdCByZXEuY2xpZW50LmdldEFsbENvbnRhY3RzKCk7XHJcbiAgICAgICAgY29udGFjdHMgPSBjaGF0cy5tYXAoKGM6IGFueSkgPT4gYy5pZC5fc2VyaWFsaXplZCk7XHJcbiAgICAgIH1cclxuICAgICAgYXdhaXQgcmVxLmNsaWVudC5zdWJzY3JpYmVQcmVzZW5jZShjb250YWN0cyk7XHJcbiAgICB9IGVsc2VcclxuICAgICAgZm9yIChjb25zdCBjb250YXRvIG9mIGNvbnRhY3RUb0FycmF5KHBob25lLCBpc0dyb3VwKSkge1xyXG4gICAgICAgIGF3YWl0IHJlcS5jbGllbnQuc3Vic2NyaWJlUHJlc2VuY2UoY29udGF0byk7XHJcbiAgICAgIH1cclxuXHJcbiAgICByZXR1cm4gYXdhaXQgcmVzLnN0YXR1cygyMDApLmpzb24oe1xyXG4gICAgICBzdGF0dXM6ICdzdWNjZXNzJyxcclxuICAgICAgcmVzcG9uc2U6IHsgbWVzc2FnZTogJ1N1YnNjcmliZSBwcmVzZW5jZSBleGVjdXRlZCcgfSxcclxuICAgIH0pO1xyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICByZXR1cm4gYXdhaXQgcmVzLnN0YXR1cyg1MDApLmpzb24oe1xyXG4gICAgICBzdGF0dXM6ICdlcnJvcicsXHJcbiAgICAgIG1lc3NhZ2U6ICdFcnJvciBvbiBzdWJzY3JpYmUgcHJlc2VuY2UnLFxyXG4gICAgICBlcnJvcjogZXJyb3IsXHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBlZGl0QnVzaW5lc3NQcm9maWxlKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSkge1xyXG4gIC8qKlxyXG4gICAqICNzd2FnZ2VyLnRhZ3MgPSBbXCJQcm9maWxlXCJdXHJcbiAgICAgI3N3YWdnZXIub3BlcmF0aW9uSWQgPSAnZWRpdEJ1c2luZXNzUHJvZmlsZSdcclxuICAgKiAjc3dhZ2dlci5kZXNjcmlwdGlvbiA9ICdFZGl0IHlvdXIgYnVzc2luZXNzIHByb2ZpbGUnXHJcbiAgICAgI3N3YWdnZXIuYXV0b0JvZHk9ZmFsc2VcclxuICAgICAjc3dhZ2dlci5zZWN1cml0eSA9IFt7XHJcbiAgICAgICAgICAgIFwiYmVhcmVyQXV0aFwiOiBbXVxyXG4gICAgIH1dXHJcbiAgICAgI3N3YWdnZXIucGFyYW1ldGVyc1tcInNlc3Npb25cIl0gPSB7XHJcbiAgICAgIHNjaGVtYTogJ05FUkRXSEFUU19BTUVSSUNBJ1xyXG4gICAgIH1cclxuICAgICAjc3dhZ2dlci5wYXJhbWV0ZXJzW1wib2JqXCJdID0ge1xyXG4gICAgICBpbjogJ2JvZHknLFxyXG4gICAgICBzY2hlbWE6IHtcclxuICAgICAgICAkYWRyZXNzOiAnQXYuIE5vc3NhIFNlbmhvcmEgZGUgQ29wYWNhYmFuYSwgMzE1JyxcclxuICAgICAgICAkZW1haWw6ICd0ZXN0QHRlc3QuY29tLmJyJyxcclxuICAgICAgICAkY2F0ZWdvcmllczoge1xyXG4gICAgICAgICAgJGlkOiBcIjEzMzQzNjc0MzM4ODIxN1wiLFxyXG4gICAgICAgICAgJGxvY2FsaXplZF9kaXNwbGF5X25hbWU6IFwiQXJ0ZXMgZSBlbnRyZXRlbmltZW50b1wiLFxyXG4gICAgICAgICAgJG5vdF9hX2JpejogZmFsc2UsXHJcbiAgICAgICAgfSxcclxuICAgICAgICAkd2Vic2l0ZTogW1xyXG4gICAgICAgICAgXCJodHRwczovL3d3dy53cHBjb25uZWN0LmlvXCIsXHJcbiAgICAgICAgICBcImh0dHBzOi8vd3d3LnRlc3RlMi5jb20uYnJcIixcclxuICAgICAgICBdLFxyXG4gICAgICB9XHJcbiAgICAgfVxyXG4gICAgIFxyXG4gICAgICNzd2FnZ2VyLnJlcXVlc3RCb2R5ID0ge1xyXG4gICAgICByZXF1aXJlZDogdHJ1ZSxcclxuICAgICAgXCJAY29udGVudFwiOiB7XHJcbiAgICAgICAgXCJhcHBsaWNhdGlvbi9qc29uXCI6IHtcclxuICAgICAgICAgIHNjaGVtYToge1xyXG4gICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgYWRyZXNzOiB7IHR5cGU6IFwic3RyaW5nXCIgfSxcclxuICAgICAgICAgICAgICBlbWFpbDogeyB0eXBlOiBcInN0cmluZ1wiIH0sXHJcbiAgICAgICAgICAgICAgY2F0ZWdvcmllczogeyB0eXBlOiBcIm9iamVjdFwiIH0sXHJcbiAgICAgICAgICAgICAgd2Vic2l0ZXM6IHsgdHlwZTogXCJhcnJheVwiIH0sXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICBleGFtcGxlOiB7XHJcbiAgICAgICAgICAgIGFkcmVzczogJ0F2LiBOb3NzYSBTZW5ob3JhIGRlIENvcGFjYWJhbmEsIDMxNScsXHJcbiAgICAgICAgICAgIGVtYWlsOiAndGVzdEB0ZXN0LmNvbS5icicsXHJcbiAgICAgICAgICAgIGNhdGVnb3JpZXM6IHtcclxuICAgICAgICAgICAgICAkaWQ6IFwiMTMzNDM2NzQzMzg4MjE3XCIsXHJcbiAgICAgICAgICAgICAgJGxvY2FsaXplZF9kaXNwbGF5X25hbWU6IFwiQXJ0ZXMgZSBlbnRyZXRlbmltZW50b1wiLFxyXG4gICAgICAgICAgICAgICRub3RfYV9iaXo6IGZhbHNlLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB3ZWJzaXRlOiBbXHJcbiAgICAgICAgICAgICAgXCJodHRwczovL3d3dy53cHBjb25uZWN0LmlvXCIsXHJcbiAgICAgICAgICAgICAgXCJodHRwczovL3d3dy50ZXN0ZTIuY29tLmJyXCIsXHJcbiAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgfVxyXG4gICAqL1xyXG4gIHRyeSB7XHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oYXdhaXQgcmVxLmNsaWVudC5lZGl0QnVzaW5lc3NQcm9maWxlKHJlcS5ib2R5KSk7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7XHJcbiAgICAgIHN0YXR1czogJ2Vycm9yJyxcclxuICAgICAgbWVzc2FnZTogJ0Vycm9yIG9uIGVkaXQgYnVzaW5lc3MgcHJvZmlsZScsXHJcbiAgICAgIGVycm9yOiBlcnJvcixcclxuICAgIH0pO1xy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