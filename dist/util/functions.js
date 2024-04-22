"use strict";var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");Object.defineProperty(exports, "__esModule", { value: true });exports.autoDownload = autoDownload;exports.callWebHook = callWebHook;exports.contactToArray = contactToArray;exports.createCatalogLink = createCatalogLink;exports.createFolders = createFolders;exports.getIPAddress = getIPAddress;exports.groupNameToArray = groupNameToArray;exports.groupToArray = groupToArray;exports.setMaxListners = setMaxListners;exports.startAllSessions = startAllSessions;exports.startHelper = startHelper;exports.strToBool = strToBool;exports.unlinkAsync = void 0;














var _clientS = require("@aws-sdk/client-s3");





var _axios = _interopRequireDefault(require("axios"));
var _crypto = _interopRequireDefault(require("crypto"));

var _fs = _interopRequireDefault(require("fs"));
var _mimeTypes = _interopRequireDefault(require("mime-types"));
var _os = _interopRequireDefault(require("os"));
var _path = _interopRequireDefault(require("path"));
var _util = require("util");

var _config = _interopRequireDefault(require("../config"));
var _index = require("../mapper/index");

var _bucketAlreadyExists = require("./bucketAlreadyExists"); /*
 * Copyright 2023 WPPConnect Team
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
 */let mime, crypto; //, aws: any;
if (_config.default.webhook.uploadS3) {mime = _config.default.webhook.uploadS3 ? _mimeTypes.default : null;crypto = _config.default.webhook.uploadS3 ? _crypto.default : null;}if (_config.default?.websocket?.uploadS3) {mime = _config.default.websocket.uploadS3 ? _mimeTypes.default : null;crypto = _config.default.websocket.uploadS3 ? _crypto.default : null;}function contactToArray(number, isGroup) {const localArr = [];if (Array.isArray(number)) {for (let contact of number) {
      isGroup ?
      contact = contact.split('@')[0] :
      contact = contact.split('@')[0]?.replace(/[^\w ]/g, '');
      if (contact !== '')
      if (isGroup) localArr.push(`${contact}@g.us`);else
      localArr.push(`${contact}@c.us`);
    }
  } else {
    const arrContacts = number.split(/\s*[,;]\s*/g);
    for (let contact of arrContacts) {
      isGroup ?
      contact = contact.split('@')[0] :
      contact = contact.split('@')[0]?.replace(/[^\w ]/g, '');
      if (contact !== '')
      if (isGroup) localArr.push(`${contact}@g.us`);else
      localArr.push(`${contact}@c.us`);
    }
  }

  return localArr;
}

function groupToArray(group) {
  const localArr = [];
  if (Array.isArray(group)) {
    for (let contact of group) {
      contact = contact.split('@')[0];
      if (contact !== '') localArr.push(`${contact}@g.us`);
    }
  } else {
    const arrContacts = group.split(/\s*[,;]\s*/g);
    for (let contact of arrContacts) {
      contact = contact.split('@')[0];
      if (contact !== '') localArr.push(`${contact}@g.us`);
    }
  }

  return localArr;
}

function groupNameToArray(group) {
  const localArr = [];
  if (Array.isArray(group)) {
    for (const contact of group) {
      if (contact !== '') localArr.push(`${contact}`);
    }
  } else {
    const arrContacts = group.split(/\s*[,;]\s*/g);
    for (const contact of arrContacts) {
      if (contact !== '') localArr.push(`${contact}`);
    }
  }

  return localArr;
}

async function callWebHook(
client,
req,
event,
data)
{
  const webhook =
  client?.config.webhook || req.serverOptions.webhook.url || false;
  if (webhook) {
    if (
    req.serverOptions.webhook?.ignore && (
    req.serverOptions.webhook.ignore.includes(event) ||
    req.serverOptions.webhook.ignore.includes(data?.from) ||
    req.serverOptions.webhook.ignore.includes(data?.type)))

    return;
    if (req.serverOptions.webhook.autoDownload)
    await autoDownload(client, req, data);
    try {
      const chatId =
      data.from ||
      data.chatId || (
      data.chatId ? data.chatId._serialized : null);
      data = Object.assign({ event: event, session: client.session }, data);
      if (req.serverOptions.mapper.enable)
      data = await (0, _index.convert)(req.serverOptions.mapper.prefix, data);
      _axios.default.
      post(webhook, data).
      then(() => {
        try {
          const events = ['unreadmessages', 'onmessage'];
          if (events.includes(event) && req.serverOptions.webhook.readMessage)
          client.sendSeen(chatId);
        } catch (e) {}
      }).
      catch((e) => {
        req.logger.warn('Error calling Webhook.', e);
      });
    } catch (e) {
      req.logger.error(e);
    }
  }
}

async function autoDownload(client, req, message) {
  try {
    if (message && (message['mimetype'] || message.isMedia || message.isMMS)) {
      const buffer = await client.decryptFile(message);
      if (
      req.serverOptions.webhook.uploadS3 ||
      req.serverOptions?.websocket?.uploadS3)
      {
        const hashName = crypto.randomBytes(24).toString('hex');

        if (
        !_config.default?.aws_s3?.region ||
        !_config.default?.aws_s3?.access_key_id ||
        !_config.default?.aws_s3?.secret_key)

        throw new Error('Please, configure your aws configs');
        const s3Client = new _clientS.S3Client({
          region: _config.default?.aws_s3?.region,
          endpoint: _config.default?.aws_s3?.endpoint || undefined,
          forcePathStyle: _config.default?.aws_s3?.forcePathStyle || undefined
        });
        let bucketName = _config.default?.aws_s3?.defaultBucketName ?
        _config.default?.aws_s3?.defaultBucketName :
        client.session;
        bucketName = bucketName.
        normalize('NFD').
        replace(/[\u0300-\u036f]|[— _.,?!]/g, '').
        toLowerCase();
        bucketName =
        bucketName.length < 3 ?
        bucketName +
        `${Math.floor(Math.random() * (999 - 100 + 1)) + 100}` :
        bucketName;
        const fileName = `${
        _config.default.aws_s3.defaultBucketName ? client.session + '/' : ''
        }${hashName}.${mime.extension(message.mimetype)}`;

        if (
        !_config.default.aws_s3.defaultBucketName &&
        !(await (0, _bucketAlreadyExists.bucketAlreadyExists)(bucketName)))
        {
          await s3Client.send(
            new _clientS.CreateBucketCommand({
              Bucket: bucketName,
              ObjectOwnership: 'ObjectWriter'
            })
          );
          await s3Client.send(
            new _clientS.PutPublicAccessBlockCommand({
              Bucket: bucketName,
              PublicAccessBlockConfiguration: {
                BlockPublicAcls: false,
                IgnorePublicAcls: false,
                BlockPublicPolicy: false
              }
            })
          );
        }

        await s3Client.send(
          new _clientS.PutObjectCommand({
            Bucket: bucketName,
            Key: fileName,
            Body: buffer,
            ContentType: message.mimetype,
            ACL: 'public-read'
          })
        );

        message.fileUrl = `https://${bucketName}.s3.amazonaws.com/${fileName}`;
      } else {
        message.body = await buffer.toString('base64');
      }
    }
  } catch (e) {
    req.logger.error(e);
  }
}

async function startAllSessions(config, logger) {
  try {
    await _axios.default.post(
      `${config.host}:${config.port}/api/${config.secretKey}/start-all`
    );
  } catch (e) {
    logger.error(e);
  }
}

async function startHelper(client, req) {
  if (req.serverOptions.webhook.allUnreadOnStart) await sendUnread(client, req);

  if (req.serverOptions.archive.enable) await archive(client, req);
}

async function sendUnread(client, req) {
  req.logger.info(`${client.session} : Inicio enviar mensagens não lidas`);

  try {
    const chats = await client.getAllChatsWithMessages(true);

    if (chats && chats.length > 0) {
      for (let i = 0; i < chats.length; i++)
      for (let j = 0; j < chats[i].msgs.length; j++) {
        callWebHook(client, req, 'unreadmessages', chats[i].msgs[j]);
      }
    }

    req.logger.info(`${client.session} : Fim enviar mensagens não lidas`);
  } catch (ex) {
    req.logger.error(ex);
  }
}

async function archive(client, req) {
  async function sleep(time) {
    return new Promise((resolve) => setTimeout(resolve, time * 10));
  }

  req.logger.info(`${client.session} : Inicio arquivando chats`);

  try {
    let chats = await client.getAllChats();
    if (chats && Array.isArray(chats) && chats.length > 0) {
      chats = chats.filter((c) => !c.archive);
    }
    if (chats && Array.isArray(chats) && chats.length > 0) {
      for (let i = 0; i < chats.length; i++) {
        const date = new Date(chats[i].t * 1000);

        if (DaysBetween(date) > req.serverOptions.archive.daysToArchive) {
          await client.archiveChat(
            chats[i].id.id || chats[i].id._serialized,
            true
          );
          await sleep(
            Math.floor(Math.random() * req.serverOptions.archive.waitTime + 1)
          );
        }
      }
    }
    req.logger.info(`${client.session} : Fim arquivando chats`);
  } catch (ex) {
    req.logger.error(ex);
  }
}

function DaysBetween(StartDate) {
  const endDate = new Date();
  // The number of milliseconds in all UTC days (no DST)
  const oneDay = 1000 * 60 * 60 * 24;

  // A day in UTC always lasts 24 hours (unlike in other time formats)
  const start = Date.UTC(
    endDate.getFullYear(),
    endDate.getMonth(),
    endDate.getDate()
  );
  const end = Date.UTC(
    StartDate.getFullYear(),
    StartDate.getMonth(),
    StartDate.getDate()
  );

  // so it's safe to divide by 24 hours
  return (start - end) / oneDay;
}

function createFolders() {
  const __dirname = _path.default.resolve(_path.default.dirname(''));
  const dirFiles = _path.default.resolve(__dirname, 'WhatsAppImages');
  if (!_fs.default.existsSync(dirFiles)) {
    _fs.default.mkdirSync(dirFiles);
  }

  const dirUpload = _path.default.resolve(__dirname, 'uploads');
  if (!_fs.default.existsSync(dirUpload)) {
    _fs.default.mkdirSync(dirUpload);
  }
}

function strToBool(s) {
  return /^(true|1)$/i.test(s);
}

function getIPAddress() {
  const interfaces = _os.default.networkInterfaces();
  for (const devName in interfaces) {
    const iface = interfaces[devName];
    for (let i = 0; i < iface.length; i++) {
      const alias = iface[i];
      if (
      alias.family === 'IPv4' &&
      alias.address !== '127.0.0.1' &&
      !alias.internal)

      return alias.address;
    }
  }
  return '0.0.0.0';
}

function setMaxListners(serverOptions) {
  if (serverOptions && Number.isInteger(serverOptions.maxListeners)) {
    process.setMaxListeners(serverOptions.maxListeners);
  }
}

const unlinkAsync = exports.unlinkAsync = (0, _util.promisify)(_fs.default.unlink);

function createCatalogLink(session) {
  const [wid] = session.split('@');
  return `https://wa.me/c/${wid}`;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfY2xpZW50UyIsInJlcXVpcmUiLCJfYXhpb3MiLCJfaW50ZXJvcFJlcXVpcmVEZWZhdWx0IiwiX2NyeXB0byIsIl9mcyIsIl9taW1lVHlwZXMiLCJfb3MiLCJfcGF0aCIsIl91dGlsIiwiX2NvbmZpZyIsIl9pbmRleCIsIl9idWNrZXRBbHJlYWR5RXhpc3RzIiwibWltZSIsImNyeXB0byIsImNvbmZpZyIsIndlYmhvb2siLCJ1cGxvYWRTMyIsIm1pbWV0eXBlcyIsIkNyeXB0byIsIndlYnNvY2tldCIsImNvbnRhY3RUb0FycmF5IiwibnVtYmVyIiwiaXNHcm91cCIsImxvY2FsQXJyIiwiQXJyYXkiLCJpc0FycmF5IiwiY29udGFjdCIsInNwbGl0IiwicmVwbGFjZSIsInB1c2giLCJhcnJDb250YWN0cyIsImdyb3VwVG9BcnJheSIsImdyb3VwIiwiZ3JvdXBOYW1lVG9BcnJheSIsImNhbGxXZWJIb29rIiwiY2xpZW50IiwicmVxIiwiZXZlbnQiLCJkYXRhIiwic2VydmVyT3B0aW9ucyIsInVybCIsImlnbm9yZSIsImluY2x1ZGVzIiwiZnJvbSIsInR5cGUiLCJhdXRvRG93bmxvYWQiLCJjaGF0SWQiLCJfc2VyaWFsaXplZCIsIk9iamVjdCIsImFzc2lnbiIsInNlc3Npb24iLCJtYXBwZXIiLCJlbmFibGUiLCJjb252ZXJ0IiwicHJlZml4IiwiYXBpIiwicG9zdCIsInRoZW4iLCJldmVudHMiLCJyZWFkTWVzc2FnZSIsInNlbmRTZWVuIiwiZSIsImNhdGNoIiwibG9nZ2VyIiwid2FybiIsImVycm9yIiwibWVzc2FnZSIsImlzTWVkaWEiLCJpc01NUyIsImJ1ZmZlciIsImRlY3J5cHRGaWxlIiwiaGFzaE5hbWUiLCJyYW5kb21CeXRlcyIsInRvU3RyaW5nIiwiYXdzX3MzIiwicmVnaW9uIiwiYWNjZXNzX2tleV9pZCIsInNlY3JldF9rZXkiLCJFcnJvciIsInMzQ2xpZW50IiwiUzNDbGllbnQiLCJlbmRwb2ludCIsInVuZGVmaW5lZCIsImZvcmNlUGF0aFN0eWxlIiwiYnVja2V0TmFtZSIsImRlZmF1bHRCdWNrZXROYW1lIiwibm9ybWFsaXplIiwidG9Mb3dlckNhc2UiLCJsZW5ndGgiLCJNYXRoIiwiZmxvb3IiLCJyYW5kb20iLCJmaWxlTmFtZSIsImV4dGVuc2lvbiIsIm1pbWV0eXBlIiwiYnVja2V0QWxyZWFkeUV4aXN0cyIsInNlbmQiLCJDcmVhdGVCdWNrZXRDb21tYW5kIiwiQnVja2V0IiwiT2JqZWN0T3duZXJzaGlwIiwiUHV0UHVibGljQWNjZXNzQmxvY2tDb21tYW5kIiwiUHVibGljQWNjZXNzQmxvY2tDb25maWd1cmF0aW9uIiwiQmxvY2tQdWJsaWNBY2xzIiwiSWdub3JlUHVibGljQWNscyIsIkJsb2NrUHVibGljUG9saWN5IiwiUHV0T2JqZWN0Q29tbWFuZCIsIktleSIsIkJvZHkiLCJDb250ZW50VHlwZSIsIkFDTCIsImZpbGVVcmwiLCJib2R5Iiwic3RhcnRBbGxTZXNzaW9ucyIsImhvc3QiLCJwb3J0Iiwic2VjcmV0S2V5Iiwic3RhcnRIZWxwZXIiLCJhbGxVbnJlYWRPblN0YXJ0Iiwic2VuZFVucmVhZCIsImFyY2hpdmUiLCJpbmZvIiwiY2hhdHMiLCJnZXRBbGxDaGF0c1dpdGhNZXNzYWdlcyIsImkiLCJqIiwibXNncyIsImV4Iiwic2xlZXAiLCJ0aW1lIiwiUHJvbWlzZSIsInJlc29sdmUiLCJzZXRUaW1lb3V0IiwiZ2V0QWxsQ2hhdHMiLCJmaWx0ZXIiLCJjIiwiZGF0ZSIsIkRhdGUiLCJ0IiwiRGF5c0JldHdlZW4iLCJkYXlzVG9BcmNoaXZlIiwiYXJjaGl2ZUNoYXQiLCJpZCIsIndhaXRUaW1lIiwiU3RhcnREYXRlIiwiZW5kRGF0ZSIsIm9uZURheSIsInN0YXJ0IiwiVVRDIiwiZ2V0RnVsbFllYXIiLCJnZXRNb250aCIsImdldERhdGUiLCJlbmQiLCJjcmVhdGVGb2xkZXJzIiwiX19kaXJuYW1lIiwicGF0aCIsImRpcm5hbWUiLCJkaXJGaWxlcyIsImZzIiwiZXhpc3RzU3luYyIsIm1rZGlyU3luYyIsImRpclVwbG9hZCIsInN0clRvQm9vbCIsInMiLCJ0ZXN0IiwiZ2V0SVBBZGRyZXNzIiwiaW50ZXJmYWNlcyIsIm9zIiwibmV0d29ya0ludGVyZmFjZXMiLCJkZXZOYW1lIiwiaWZhY2UiLCJhbGlhcyIsImZhbWlseSIsImFkZHJlc3MiLCJpbnRlcm5hbCIsInNldE1heExpc3RuZXJzIiwiTnVtYmVyIiwiaXNJbnRlZ2VyIiwibWF4TGlzdGVuZXJzIiwicHJvY2VzcyIsInNldE1heExpc3RlbmVycyIsInVubGlua0FzeW5jIiwiZXhwb3J0cyIsInByb21pc2lmeSIsInVubGluayIsImNyZWF0ZUNhdGFsb2dMaW5rIiwid2lkIl0sInNvdXJjZXMiOlsiLi4vLi4vc3JjL3V0aWwvZnVuY3Rpb25zLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qXHJcbiAqIENvcHlyaWdodCAyMDIzIFdQUENvbm5lY3QgVGVhbVxyXG4gKlxyXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xyXG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXHJcbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxyXG4gKlxyXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXHJcbiAqXHJcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcclxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxyXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cclxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxyXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cclxuICovXHJcbmltcG9ydCB7XHJcbiAgQ3JlYXRlQnVja2V0Q29tbWFuZCxcclxuICBQdXRPYmplY3RDb21tYW5kLFxyXG4gIFB1dFB1YmxpY0FjY2Vzc0Jsb2NrQ29tbWFuZCxcclxuICBTM0NsaWVudCxcclxufSBmcm9tICdAYXdzLXNkay9jbGllbnQtczMnO1xyXG5pbXBvcnQgYXBpIGZyb20gJ2F4aW9zJztcclxuaW1wb3J0IENyeXB0byBmcm9tICdjcnlwdG8nO1xyXG5pbXBvcnQgeyBSZXF1ZXN0IH0gZnJvbSAnZXhwcmVzcyc7XHJcbmltcG9ydCBmcyBmcm9tICdmcyc7XHJcbmltcG9ydCBtaW1ldHlwZXMgZnJvbSAnbWltZS10eXBlcyc7XHJcbmltcG9ydCBvcyBmcm9tICdvcyc7XHJcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQgeyBwcm9taXNpZnkgfSBmcm9tICd1dGlsJztcclxuXHJcbmltcG9ydCBjb25maWcgZnJvbSAnLi4vY29uZmlnJztcclxuaW1wb3J0IHsgY29udmVydCB9IGZyb20gJy4uL21hcHBlci9pbmRleCc7XHJcbmltcG9ydCB7IFNlcnZlck9wdGlvbnMgfSBmcm9tICcuLi90eXBlcy9TZXJ2ZXJPcHRpb25zJztcclxuaW1wb3J0IHsgYnVja2V0QWxyZWFkeUV4aXN0cyB9IGZyb20gJy4vYnVja2V0QWxyZWFkeUV4aXN0cyc7XHJcblxyXG5sZXQgbWltZTogYW55LCBjcnlwdG86IGFueTsgLy8sIGF3czogYW55O1xyXG5pZiAoY29uZmlnLndlYmhvb2sudXBsb2FkUzMpIHtcclxuICBtaW1lID0gY29uZmlnLndlYmhvb2sudXBsb2FkUzMgPyBtaW1ldHlwZXMgOiBudWxsO1xyXG4gIGNyeXB0byA9IGNvbmZpZy53ZWJob29rLnVwbG9hZFMzID8gQ3J5cHRvIDogbnVsbDtcclxufVxyXG5pZiAoY29uZmlnPy53ZWJzb2NrZXQ/LnVwbG9hZFMzKSB7XHJcbiAgbWltZSA9IGNvbmZpZy53ZWJzb2NrZXQudXBsb2FkUzMgPyBtaW1ldHlwZXMgOiBudWxsO1xyXG4gIGNyeXB0byA9IGNvbmZpZy53ZWJzb2NrZXQudXBsb2FkUzMgPyBDcnlwdG8gOiBudWxsO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY29udGFjdFRvQXJyYXkobnVtYmVyOiBhbnksIGlzR3JvdXA/OiBib29sZWFuKSB7XHJcbiAgY29uc3QgbG9jYWxBcnI6IGFueSA9IFtdO1xyXG4gIGlmIChBcnJheS5pc0FycmF5KG51bWJlcikpIHtcclxuICAgIGZvciAobGV0IGNvbnRhY3Qgb2YgbnVtYmVyKSB7XHJcbiAgICAgIGlzR3JvdXBcclxuICAgICAgICA/IChjb250YWN0ID0gY29udGFjdC5zcGxpdCgnQCcpWzBdKVxyXG4gICAgICAgIDogKGNvbnRhY3QgPSBjb250YWN0LnNwbGl0KCdAJylbMF0/LnJlcGxhY2UoL1teXFx3IF0vZywgJycpKTtcclxuICAgICAgaWYgKGNvbnRhY3QgIT09ICcnKVxyXG4gICAgICAgIGlmIChpc0dyb3VwKSAobG9jYWxBcnIgYXMgYW55KS5wdXNoKGAke2NvbnRhY3R9QGcudXNgKTtcclxuICAgICAgICBlbHNlIChsb2NhbEFyciBhcyBhbnkpLnB1c2goYCR7Y29udGFjdH1AYy51c2ApO1xyXG4gICAgfVxyXG4gIH0gZWxzZSB7XHJcbiAgICBjb25zdCBhcnJDb250YWN0cyA9IG51bWJlci5zcGxpdCgvXFxzKlssO11cXHMqL2cpO1xyXG4gICAgZm9yIChsZXQgY29udGFjdCBvZiBhcnJDb250YWN0cykge1xyXG4gICAgICBpc0dyb3VwXHJcbiAgICAgICAgPyAoY29udGFjdCA9IGNvbnRhY3Quc3BsaXQoJ0AnKVswXSlcclxuICAgICAgICA6IChjb250YWN0ID0gY29udGFjdC5zcGxpdCgnQCcpWzBdPy5yZXBsYWNlKC9bXlxcdyBdL2csICcnKSk7XHJcbiAgICAgIGlmIChjb250YWN0ICE9PSAnJylcclxuICAgICAgICBpZiAoaXNHcm91cCkgKGxvY2FsQXJyIGFzIGFueSkucHVzaChgJHtjb250YWN0fUBnLnVzYCk7XHJcbiAgICAgICAgZWxzZSAobG9jYWxBcnIgYXMgYW55KS5wdXNoKGAke2NvbnRhY3R9QGMudXNgKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHJldHVybiBsb2NhbEFycjtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdyb3VwVG9BcnJheShncm91cDogYW55KSB7XHJcbiAgY29uc3QgbG9jYWxBcnI6IGFueSA9IFtdO1xyXG4gIGlmIChBcnJheS5pc0FycmF5KGdyb3VwKSkge1xyXG4gICAgZm9yIChsZXQgY29udGFjdCBvZiBncm91cCkge1xyXG4gICAgICBjb250YWN0ID0gY29udGFjdC5zcGxpdCgnQCcpWzBdO1xyXG4gICAgICBpZiAoY29udGFjdCAhPT0gJycpIChsb2NhbEFyciBhcyBhbnkpLnB1c2goYCR7Y29udGFjdH1AZy51c2ApO1xyXG4gICAgfVxyXG4gIH0gZWxzZSB7XHJcbiAgICBjb25zdCBhcnJDb250YWN0cyA9IGdyb3VwLnNwbGl0KC9cXHMqWyw7XVxccyovZyk7XHJcbiAgICBmb3IgKGxldCBjb250YWN0IG9mIGFyckNvbnRhY3RzKSB7XHJcbiAgICAgIGNvbnRhY3QgPSBjb250YWN0LnNwbGl0KCdAJylbMF07XHJcbiAgICAgIGlmIChjb250YWN0ICE9PSAnJykgKGxvY2FsQXJyIGFzIGFueSkucHVzaChgJHtjb250YWN0fUBnLnVzYCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICByZXR1cm4gbG9jYWxBcnI7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBncm91cE5hbWVUb0FycmF5KGdyb3VwOiBhbnkpIHtcclxuICBjb25zdCBsb2NhbEFycjogYW55ID0gW107XHJcbiAgaWYgKEFycmF5LmlzQXJyYXkoZ3JvdXApKSB7XHJcbiAgICBmb3IgKGNvbnN0IGNvbnRhY3Qgb2YgZ3JvdXApIHtcclxuICAgICAgaWYgKGNvbnRhY3QgIT09ICcnKSAobG9jYWxBcnIgYXMgYW55KS5wdXNoKGAke2NvbnRhY3R9YCk7XHJcbiAgICB9XHJcbiAgfSBlbHNlIHtcclxuICAgIGNvbnN0IGFyckNvbnRhY3RzID0gZ3JvdXAuc3BsaXQoL1xccypbLDtdXFxzKi9nKTtcclxuICAgIGZvciAoY29uc3QgY29udGFjdCBvZiBhcnJDb250YWN0cykge1xyXG4gICAgICBpZiAoY29udGFjdCAhPT0gJycpIChsb2NhbEFyciBhcyBhbnkpLnB1c2goYCR7Y29udGFjdH1gKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHJldHVybiBsb2NhbEFycjtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNhbGxXZWJIb29rKFxyXG4gIGNsaWVudDogYW55LFxyXG4gIHJlcTogUmVxdWVzdCxcclxuICBldmVudDogYW55LFxyXG4gIGRhdGE6IGFueVxyXG4pIHtcclxuICBjb25zdCB3ZWJob29rID1cclxuICAgIGNsaWVudD8uY29uZmlnLndlYmhvb2sgfHwgcmVxLnNlcnZlck9wdGlvbnMud2ViaG9vay51cmwgfHwgZmFsc2U7XHJcbiAgaWYgKHdlYmhvb2spIHtcclxuICAgIGlmIChcclxuICAgICAgcmVxLnNlcnZlck9wdGlvbnMud2ViaG9vaz8uaWdub3JlICYmXHJcbiAgICAgIChyZXEuc2VydmVyT3B0aW9ucy53ZWJob29rLmlnbm9yZS5pbmNsdWRlcyhldmVudCkgfHxcclxuICAgICAgICByZXEuc2VydmVyT3B0aW9ucy53ZWJob29rLmlnbm9yZS5pbmNsdWRlcyhkYXRhPy5mcm9tKSB8fFxyXG4gICAgICAgIHJlcS5zZXJ2ZXJPcHRpb25zLndlYmhvb2suaWdub3JlLmluY2x1ZGVzKGRhdGE/LnR5cGUpKVxyXG4gICAgKVxyXG4gICAgICByZXR1cm47XHJcbiAgICBpZiAocmVxLnNlcnZlck9wdGlvbnMud2ViaG9vay5hdXRvRG93bmxvYWQpXHJcbiAgICAgIGF3YWl0IGF1dG9Eb3dubG9hZChjbGllbnQsIHJlcSwgZGF0YSk7XHJcbiAgICB0cnkge1xyXG4gICAgICBjb25zdCBjaGF0SWQgPVxyXG4gICAgICAgIGRhdGEuZnJvbSB8fFxyXG4gICAgICAgIGRhdGEuY2hhdElkIHx8XHJcbiAgICAgICAgKGRhdGEuY2hhdElkID8gZGF0YS5jaGF0SWQuX3NlcmlhbGl6ZWQgOiBudWxsKTtcclxuICAgICAgZGF0YSA9IE9iamVjdC5hc3NpZ24oeyBldmVudDogZXZlbnQsIHNlc3Npb246IGNsaWVudC5zZXNzaW9uIH0sIGRhdGEpO1xyXG4gICAgICBpZiAocmVxLnNlcnZlck9wdGlvbnMubWFwcGVyLmVuYWJsZSlcclxuICAgICAgICBkYXRhID0gYXdhaXQgY29udmVydChyZXEuc2VydmVyT3B0aW9ucy5tYXBwZXIucHJlZml4LCBkYXRhKTtcclxuICAgICAgYXBpXHJcbiAgICAgICAgLnBvc3Qod2ViaG9vaywgZGF0YSlcclxuICAgICAgICAudGhlbigoKSA9PiB7XHJcbiAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBjb25zdCBldmVudHMgPSBbJ3VucmVhZG1lc3NhZ2VzJywgJ29ubWVzc2FnZSddO1xyXG4gICAgICAgICAgICBpZiAoZXZlbnRzLmluY2x1ZGVzKGV2ZW50KSAmJiByZXEuc2VydmVyT3B0aW9ucy53ZWJob29rLnJlYWRNZXNzYWdlKVxyXG4gICAgICAgICAgICAgIGNsaWVudC5zZW5kU2VlbihjaGF0SWQpO1xyXG4gICAgICAgICAgfSBjYXRjaCAoZSkge31cclxuICAgICAgICB9KVxyXG4gICAgICAgIC5jYXRjaCgoZSkgPT4ge1xyXG4gICAgICAgICAgcmVxLmxvZ2dlci53YXJuKCdFcnJvciBjYWxsaW5nIFdlYmhvb2suJywgZSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgIHJlcS5sb2dnZXIuZXJyb3IoZSk7XHJcbiAgICB9XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gYXV0b0Rvd25sb2FkKGNsaWVudDogYW55LCByZXE6IGFueSwgbWVzc2FnZTogYW55KSB7XHJcbiAgdHJ5IHtcclxuICAgIGlmIChtZXNzYWdlICYmIChtZXNzYWdlWydtaW1ldHlwZSddIHx8IG1lc3NhZ2UuaXNNZWRpYSB8fCBtZXNzYWdlLmlzTU1TKSkge1xyXG4gICAgICBjb25zdCBidWZmZXIgPSBhd2FpdCBjbGllbnQuZGVjcnlwdEZpbGUobWVzc2FnZSk7XHJcbiAgICAgIGlmIChcclxuICAgICAgICByZXEuc2VydmVyT3B0aW9ucy53ZWJob29rLnVwbG9hZFMzIHx8XHJcbiAgICAgICAgcmVxLnNlcnZlck9wdGlvbnM/LndlYnNvY2tldD8udXBsb2FkUzNcclxuICAgICAgKSB7XHJcbiAgICAgICAgY29uc3QgaGFzaE5hbWUgPSBjcnlwdG8ucmFuZG9tQnl0ZXMoMjQpLnRvU3RyaW5nKCdoZXgnKTtcclxuXHJcbiAgICAgICAgaWYgKFxyXG4gICAgICAgICAgIWNvbmZpZz8uYXdzX3MzPy5yZWdpb24gfHxcclxuICAgICAgICAgICFjb25maWc/LmF3c19zMz8uYWNjZXNzX2tleV9pZCB8fFxyXG4gICAgICAgICAgIWNvbmZpZz8uYXdzX3MzPy5zZWNyZXRfa2V5XHJcbiAgICAgICAgKVxyXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdQbGVhc2UsIGNvbmZpZ3VyZSB5b3VyIGF3cyBjb25maWdzJyk7XHJcbiAgICAgICAgY29uc3QgczNDbGllbnQgPSBuZXcgUzNDbGllbnQoe1xyXG4gICAgICAgICAgcmVnaW9uOiBjb25maWc/LmF3c19zMz8ucmVnaW9uLFxyXG4gICAgICAgICAgZW5kcG9pbnQ6IGNvbmZpZz8uYXdzX3MzPy5lbmRwb2ludCB8fCB1bmRlZmluZWQsXHJcbiAgICAgICAgICBmb3JjZVBhdGhTdHlsZTogY29uZmlnPy5hd3NfczM/LmZvcmNlUGF0aFN0eWxlIHx8IHVuZGVmaW5lZCxcclxuICAgICAgICB9KTtcclxuICAgICAgICBsZXQgYnVja2V0TmFtZSA9IGNvbmZpZz8uYXdzX3MzPy5kZWZhdWx0QnVja2V0TmFtZVxyXG4gICAgICAgICAgPyBjb25maWc/LmF3c19zMz8uZGVmYXVsdEJ1Y2tldE5hbWVcclxuICAgICAgICAgIDogY2xpZW50LnNlc3Npb247XHJcbiAgICAgICAgYnVja2V0TmFtZSA9IGJ1Y2tldE5hbWVcclxuICAgICAgICAgIC5ub3JtYWxpemUoJ05GRCcpXHJcbiAgICAgICAgICAucmVwbGFjZSgvW1xcdTAzMDAtXFx1MDM2Zl18W+KAlCBfLiw/IV0vZywgJycpXHJcbiAgICAgICAgICAudG9Mb3dlckNhc2UoKTtcclxuICAgICAgICBidWNrZXROYW1lID1cclxuICAgICAgICAgIGJ1Y2tldE5hbWUubGVuZ3RoIDwgM1xyXG4gICAgICAgICAgICA/IGJ1Y2tldE5hbWUgK1xyXG4gICAgICAgICAgICAgIGAke01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqICg5OTkgLSAxMDAgKyAxKSkgKyAxMDB9YFxyXG4gICAgICAgICAgICA6IGJ1Y2tldE5hbWU7XHJcbiAgICAgICAgY29uc3QgZmlsZU5hbWUgPSBgJHtcclxuICAgICAgICAgIGNvbmZpZy5hd3NfczMuZGVmYXVsdEJ1Y2tldE5hbWUgPyBjbGllbnQuc2Vzc2lvbiArICcvJyA6ICcnXHJcbiAgICAgICAgfSR7aGFzaE5hbWV9LiR7bWltZS5leHRlbnNpb24obWVzc2FnZS5taW1ldHlwZSl9YDtcclxuXHJcbiAgICAgICAgaWYgKFxyXG4gICAgICAgICAgIWNvbmZpZy5hd3NfczMuZGVmYXVsdEJ1Y2tldE5hbWUgJiZcclxuICAgICAgICAgICEoYXdhaXQgYnVja2V0QWxyZWFkeUV4aXN0cyhidWNrZXROYW1lKSlcclxuICAgICAgICApIHtcclxuICAgICAgICAgIGF3YWl0IHMzQ2xpZW50LnNlbmQoXHJcbiAgICAgICAgICAgIG5ldyBDcmVhdGVCdWNrZXRDb21tYW5kKHtcclxuICAgICAgICAgICAgICBCdWNrZXQ6IGJ1Y2tldE5hbWUsXHJcbiAgICAgICAgICAgICAgT2JqZWN0T3duZXJzaGlwOiAnT2JqZWN0V3JpdGVyJyxcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICk7XHJcbiAgICAgICAgICBhd2FpdCBzM0NsaWVudC5zZW5kKFxyXG4gICAgICAgICAgICBuZXcgUHV0UHVibGljQWNjZXNzQmxvY2tDb21tYW5kKHtcclxuICAgICAgICAgICAgICBCdWNrZXQ6IGJ1Y2tldE5hbWUsXHJcbiAgICAgICAgICAgICAgUHVibGljQWNjZXNzQmxvY2tDb25maWd1cmF0aW9uOiB7XHJcbiAgICAgICAgICAgICAgICBCbG9ja1B1YmxpY0FjbHM6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgSWdub3JlUHVibGljQWNsczogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICBCbG9ja1B1YmxpY1BvbGljeTogZmFsc2UsXHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBhd2FpdCBzM0NsaWVudC5zZW5kKFxyXG4gICAgICAgICAgbmV3IFB1dE9iamVjdENvbW1hbmQoe1xyXG4gICAgICAgICAgICBCdWNrZXQ6IGJ1Y2tldE5hbWUsXHJcbiAgICAgICAgICAgIEtleTogZmlsZU5hbWUsXHJcbiAgICAgICAgICAgIEJvZHk6IGJ1ZmZlcixcclxuICAgICAgICAgICAgQ29udGVudFR5cGU6IG1lc3NhZ2UubWltZXR5cGUsXHJcbiAgICAgICAgICAgIEFDTDogJ3B1YmxpYy1yZWFkJyxcclxuICAgICAgICAgIH0pXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgbWVzc2FnZS5maWxlVXJsID0gYGh0dHBzOi8vJHtidWNrZXROYW1lfS5zMy5hbWF6b25hd3MuY29tLyR7ZmlsZU5hbWV9YDtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBtZXNzYWdlLmJvZHkgPSBhd2FpdCBidWZmZXIudG9TdHJpbmcoJ2Jhc2U2NCcpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSBjYXRjaCAoZSkge1xyXG4gICAgcmVxLmxvZ2dlci5lcnJvcihlKTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzdGFydEFsbFNlc3Npb25zKGNvbmZpZzogYW55LCBsb2dnZXI6IGFueSkge1xyXG4gIHRyeSB7XHJcbiAgICBhd2FpdCBhcGkucG9zdChcclxuICAgICAgYCR7Y29uZmlnLmhvc3R9OiR7Y29uZmlnLnBvcnR9L2FwaS8ke2NvbmZpZy5zZWNyZXRLZXl9L3N0YXJ0LWFsbGBcclxuICAgICk7XHJcbiAgfSBjYXRjaCAoZSkge1xyXG4gICAgbG9nZ2VyLmVycm9yKGUpO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHN0YXJ0SGVscGVyKGNsaWVudDogYW55LCByZXE6IGFueSkge1xyXG4gIGlmIChyZXEuc2VydmVyT3B0aW9ucy53ZWJob29rLmFsbFVucmVhZE9uU3RhcnQpIGF3YWl0IHNlbmRVbnJlYWQoY2xpZW50LCByZXEpO1xyXG5cclxuICBpZiAocmVxLnNlcnZlck9wdGlvbnMuYXJjaGl2ZS5lbmFibGUpIGF3YWl0IGFyY2hpdmUoY2xpZW50LCByZXEpO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBzZW5kVW5yZWFkKGNsaWVudDogYW55LCByZXE6IGFueSkge1xyXG4gIHJlcS5sb2dnZXIuaW5mbyhgJHtjbGllbnQuc2Vzc2lvbn0gOiBJbmljaW8gZW52aWFyIG1lbnNhZ2VucyBuw6NvIGxpZGFzYCk7XHJcblxyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBjaGF0cyA9IGF3YWl0IGNsaWVudC5nZXRBbGxDaGF0c1dpdGhNZXNzYWdlcyh0cnVlKTtcclxuXHJcbiAgICBpZiAoY2hhdHMgJiYgY2hhdHMubGVuZ3RoID4gMCkge1xyXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNoYXRzLmxlbmd0aDsgaSsrKVxyXG4gICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgY2hhdHNbaV0ubXNncy5sZW5ndGg7IGorKykge1xyXG4gICAgICAgICAgY2FsbFdlYkhvb2soY2xpZW50LCByZXEsICd1bnJlYWRtZXNzYWdlcycsIGNoYXRzW2ldLm1zZ3Nbal0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXEubG9nZ2VyLmluZm8oYCR7Y2xpZW50LnNlc3Npb259IDogRmltIGVudmlhciBtZW5zYWdlbnMgbsOjbyBsaWRhc2ApO1xyXG4gIH0gY2F0Y2ggKGV4KSB7XHJcbiAgICByZXEubG9nZ2VyLmVycm9yKGV4KTtcclxuICB9XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGFyY2hpdmUoY2xpZW50OiBhbnksIHJlcTogYW55KSB7XHJcbiAgYXN5bmMgZnVuY3Rpb24gc2xlZXAodGltZTogbnVtYmVyKSB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgdGltZSAqIDEwKSk7XHJcbiAgfVxyXG5cclxuICByZXEubG9nZ2VyLmluZm8oYCR7Y2xpZW50LnNlc3Npb259IDogSW5pY2lvIGFycXVpdmFuZG8gY2hhdHNgKTtcclxuXHJcbiAgdHJ5IHtcclxuICAgIGxldCBjaGF0cyA9IGF3YWl0IGNsaWVudC5nZXRBbGxDaGF0cygpO1xyXG4gICAgaWYgKGNoYXRzICYmIEFycmF5LmlzQXJyYXkoY2hhdHMpICYmIGNoYXRzLmxlbmd0aCA+IDApIHtcclxuICAgICAgY2hhdHMgPSBjaGF0cy5maWx0ZXIoKGMpID0+ICFjLmFyY2hpdmUpO1xyXG4gICAgfVxyXG4gICAgaWYgKGNoYXRzICYmIEFycmF5LmlzQXJyYXkoY2hhdHMpICYmIGNoYXRzLmxlbmd0aCA+IDApIHtcclxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjaGF0cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIGNvbnN0IGRhdGUgPSBuZXcgRGF0ZShjaGF0c1tpXS50ICogMTAwMCk7XHJcblxyXG4gICAgICAgIGlmIChEYXlzQmV0d2VlbihkYXRlKSA+IHJlcS5zZXJ2ZXJPcHRpb25zLmFyY2hpdmUuZGF5c1RvQXJjaGl2ZSkge1xyXG4gICAgICAgICAgYXdhaXQgY2xpZW50LmFyY2hpdmVDaGF0KFxyXG4gICAgICAgICAgICBjaGF0c1tpXS5pZC5pZCB8fCBjaGF0c1tpXS5pZC5fc2VyaWFsaXplZCxcclxuICAgICAgICAgICAgdHJ1ZVxyXG4gICAgICAgICAgKTtcclxuICAgICAgICAgIGF3YWl0IHNsZWVwKFxyXG4gICAgICAgICAgICBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiByZXEuc2VydmVyT3B0aW9ucy5hcmNoaXZlLndhaXRUaW1lICsgMSlcclxuICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZXEubG9nZ2VyLmluZm8oYCR7Y2xpZW50LnNlc3Npb259IDogRmltIGFycXVpdmFuZG8gY2hhdHNgKTtcclxuICB9IGNhdGNoIChleCkge1xyXG4gICAgcmVxLmxvZ2dlci5lcnJvcihleCk7XHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBEYXlzQmV0d2VlbihTdGFydERhdGU6IERhdGUpIHtcclxuICBjb25zdCBlbmREYXRlID0gbmV3IERhdGUoKTtcclxuICAvLyBUaGUgbnVtYmVyIG9mIG1pbGxpc2Vjb25kcyBpbiBhbGwgVVRDIGRheXMgKG5vIERTVClcclxuICBjb25zdCBvbmVEYXkgPSAxMDAwICogNjAgKiA2MCAqIDI0O1xyXG5cclxuICAvLyBBIGRheSBpbiBVVEMgYWx3YXlzIGxhc3RzIDI0IGhvdXJzICh1bmxpa2UgaW4gb3RoZXIgdGltZSBmb3JtYXRzKVxyXG4gIGNvbnN0IHN0YXJ0ID0gRGF0ZS5VVEMoXHJcbiAgICBlbmREYXRlLmdldEZ1bGxZZWFyKCksXHJcbiAgICBlbmREYXRlLmdldE1vbnRoKCksXHJcbiAgICBlbmREYXRlLmdldERhdGUoKVxyXG4gICk7XHJcbiAgY29uc3QgZW5kID0gRGF0ZS5VVEMoXHJcbiAgICBTdGFydERhdGUuZ2V0RnVsbFllYXIoKSxcclxuICAgIFN0YXJ0RGF0ZS5nZXRNb250aCgpLFxyXG4gICAgU3RhcnREYXRlLmdldERhdGUoKVxyXG4gICk7XHJcblxyXG4gIC8vIHNvIGl0J3Mgc2FmZSB0byBkaXZpZGUgYnkgMjQgaG91cnNcclxuICByZXR1cm4gKHN0YXJ0IC0gZW5kKSAvIG9uZURheTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUZvbGRlcnMoKSB7XHJcbiAgY29uc3QgX19kaXJuYW1lID0gcGF0aC5yZXNvbHZlKHBhdGguZGlybmFtZSgnJykpO1xyXG4gIGNvbnN0IGRpckZpbGVzID0gcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJ1doYXRzQXBwSW1hZ2VzJyk7XHJcbiAgaWYgKCFmcy5leGlzdHNTeW5jKGRpckZpbGVzKSkge1xyXG4gICAgZnMubWtkaXJTeW5jKGRpckZpbGVzKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IGRpclVwbG9hZCA9IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICd1cGxvYWRzJyk7XHJcbiAgaWYgKCFmcy5leGlzdHNTeW5jKGRpclVwbG9hZCkpIHtcclxuICAgIGZzLm1rZGlyU3luYyhkaXJVcGxvYWQpO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHN0clRvQm9vbChzOiBzdHJpbmcpIHtcclxuICByZXR1cm4gL14odHJ1ZXwxKSQvaS50ZXN0KHMpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0SVBBZGRyZXNzKCkge1xyXG4gIGNvbnN0IGludGVyZmFjZXMgPSBvcy5uZXR3b3JrSW50ZXJmYWNlcygpO1xyXG4gIGZvciAoY29uc3QgZGV2TmFtZSBpbiBpbnRlcmZhY2VzKSB7XHJcbiAgICBjb25zdCBpZmFjZTogYW55ID0gaW50ZXJmYWNlc1tkZXZOYW1lXTtcclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaWZhY2UubGVuZ3RoOyBpKyspIHtcclxuICAgICAgY29uc3QgYWxpYXMgPSBpZmFjZVtpXTtcclxuICAgICAgaWYgKFxyXG4gICAgICAgIGFsaWFzLmZhbWlseSA9PT0gJ0lQdjQnICYmXHJcbiAgICAgICAgYWxpYXMuYWRkcmVzcyAhPT0gJzEyNy4wLjAuMScgJiZcclxuICAgICAgICAhYWxpYXMuaW50ZXJuYWxcclxuICAgICAgKVxyXG4gICAgICAgIHJldHVybiBhbGlhcy5hZGRyZXNzO1xyXG4gICAgfVxyXG4gIH1cclxuICByZXR1cm4gJzAuMC4wLjAnO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc2V0TWF4TGlzdG5lcnMoc2VydmVyT3B0aW9uczogU2VydmVyT3B0aW9ucykge1xyXG4gIGlmIChzZXJ2ZXJPcHRpb25zICYmIE51bWJlci5pc0ludGVnZXIoc2VydmVyT3B0aW9ucy5tYXhMaXN0ZW5lcnMpKSB7XHJcbiAgICBwcm9jZXNzLnNldE1heExpc3RlbmVycyhzZXJ2ZXJPcHRpb25zLm1heExpc3RlbmVycyk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgY29uc3QgdW5saW5rQXN5bmMgPSBwcm9taXNpZnkoZnMudW5saW5rKTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVDYXRhbG9nTGluayhzZXNzaW9uOiBhbnkpIHtcclxuICBjb25zdCBbd2lkXSA9IHNlc3Npb24uc3BsaXQoJ0AnKTtcclxuICByZXR1cm4gYGh0dHBzOi8vd2EubWUvYy8ke3dpZH1gO1xyXG59XHJcbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBZUEsSUFBQUEsUUFBQSxHQUFBQyxPQUFBOzs7Ozs7QUFNQSxJQUFBQyxNQUFBLEdBQUFDLHNCQUFBLENBQUFGLE9BQUE7QUFDQSxJQUFBRyxPQUFBLEdBQUFELHNCQUFBLENBQUFGLE9BQUE7O0FBRUEsSUFBQUksR0FBQSxHQUFBRixzQkFBQSxDQUFBRixPQUFBO0FBQ0EsSUFBQUssVUFBQSxHQUFBSCxzQkFBQSxDQUFBRixPQUFBO0FBQ0EsSUFBQU0sR0FBQSxHQUFBSixzQkFBQSxDQUFBRixPQUFBO0FBQ0EsSUFBQU8sS0FBQSxHQUFBTCxzQkFBQSxDQUFBRixPQUFBO0FBQ0EsSUFBQVEsS0FBQSxHQUFBUixPQUFBOztBQUVBLElBQUFTLE9BQUEsR0FBQVAsc0JBQUEsQ0FBQUYsT0FBQTtBQUNBLElB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