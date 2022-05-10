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
import api from 'axios';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import { convert } from '../mapper/index';
import config from '../config.json';

let mime = config.webhook.uploadS3 ? require('mime-types') : null;
let crypto = config.webhook.uploadS3 ? require('crypto') : null;
let aws = config.webhook.uploadS3 ? require('aws-sdk') : null;

export function contactToArray(number, isGroup) {
  let localArr = [];
  if (Array.isArray(number)) {
    for (let contact of number) {
      contact = contact.split('@')[0];
      if (contact !== '')
        if (isGroup) localArr.push(`${contact}@g.us`);
        else localArr.push(`${contact}@c.us`);
    }
  } else {
    let arrContacts = number.split(/\s*[,;]\s*/g);
    for (let contact of arrContacts) {
      contact = contact.split('@')[0];
      if (contact !== '')
        if (isGroup) localArr.push(`${contact}@g.us`);
        else localArr.push(`${contact}@c.us`);
    }
  }

  return localArr;
}

export function groupToArray(group) {
  let localArr = [];
  if (Array.isArray(group)) {
    for (let contact of group) {
      contact = contact.split('@')[0];
      if (contact !== '') localArr.push(`${contact}@g.us`);
    }
  } else {
    let arrContacts = group.split(/\s*[,;]\s*/g);
    for (let contact of arrContacts) {
      contact = contact.split('@')[0];
      if (contact !== '') localArr.push(`${contact}@g.us`);
    }
  }

  return localArr;
}

export function groupNameToArray(group) {
  let localArr = [];
  if (Array.isArray(group)) {
    for (const contact of group) {
      if (contact !== '') localArr.push(`${contact}`);
    }
  } else {
    let arrContacts = group.split(/\s*[,;]\s*/g);
    for (const contact of arrContacts) {
      if (contact !== '') localArr.push(`${contact}`);
    }
  }

  return localArr;
}

export async function callWebHook(client, req, event, data) {
  const webhook = client?.config.webhook || req.serverOptions.webhook.url || false;
  if (webhook) {
    if (req.serverOptions.webhook.autoDownload) await autoDownload(client, req, data);
    try {
      const chatId = data.from || data.chatId || (data.chatId ? data.chatId._serialized : null);
      data = Object.assign({ event: event, session: client.session }, data);
      if (req.serverOptions.mapper.enable) data = await convert(req.serverOptions.mapper.prefix, data);
      api
        .post(webhook, data)
        .then(() => {
          try {
            const events = ['unreadmessages', 'onmessage'];
            if (events.includes(event) && req.serverOptions.webhook.readMessage) client.sendSeen(chatId);
          } catch (e) {}
        })
        .catch((e) => {
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
      let buffer = await client.decryptFile(message);
      if (req.serverOptions.webhook.uploadS3) {
        var hashName = crypto.randomBytes(24).toString('hex');
        var fileName = `${hashName}.${mime.extension(message.mimetype)}`;

        const s3 = new aws.S3();

        var params = {
          Bucket: client.session,
          Key: fileName,
          Body: buffer,
          ACL: 'public-read',
          ContentType: message.mimetype,
        };
        const data = await s3.upload(params).promise();
        message.fileUrl = data.Location;
      } else {
        message.body = await buffer.toString('base64');
      }
    }
  } catch (e) {
    req.logger.error(e);
  }
}

export async function startAllSessions(config, logger) {
  try {
    await api.post(`${config.host}:${config.port}/api/${config.secretKey}/start-all`);
  } catch (e) {
    logger.error(e);
  }
}

export async function startHelper(client, req) {
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
        let date = new Date(chats[i].t * 1000);

        if (DaysBetween(date) > req.serverOptions.archive.daysToArchive) {
          await client.archiveChat(chats[i].id.id || chats[i].id._serialized, true);
          await sleep(Math.floor(Math.random() * req.serverOptions.archive.waitTime + 1));
        }
      }
    }
    req.logger.info(`${client.session} : Fim arquivando chats`);
  } catch (ex) {
    req.logger.error(ex);
  }
}

function DaysBetween(StartDate) {
  let endDate = new Date();
  // The number of milliseconds in all UTC days (no DST)
  const oneDay = 1000 * 60 * 60 * 24;

  // A day in UTC always lasts 24 hours (unlike in other time formats)
  const start = Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
  const end = Date.UTC(StartDate.getFullYear(), StartDate.getMonth(), StartDate.getDate());

  // so it's safe to divide by 24 hours
  return (start - end) / oneDay;
}

export function createFolders() {
  const __dirname = path.resolve(path.dirname(''));
  let dirFiles = path.resolve(__dirname, 'WhatsAppImages');
  if (!fs.existsSync(dirFiles)) {
    fs.mkdirSync(dirFiles);
  }

  let dirUpload = path.resolve(__dirname, 'uploads');
  if (!fs.existsSync(dirUpload)) {
    fs.mkdirSync(dirUpload);
  }
}

export function strToBool(s) {
  return /^(true|1)$/i.test(s);
}

export function getIPAddress() {
  var interfaces = require('os').networkInterfaces();
  for (var devName in interfaces) {
    var iface = interfaces[devName];
    for (var i = 0; i < iface.length; i++) {
      var alias = iface[i];
      if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) return alias.address;
    }
  }
  return '0.0.0.0';
}

export function setMaxListners(serverOptions) {
  if (serverOptions && Number.isInteger(serverOptions.maxListeners)) {
    process.setMaxListeners(serverOptions.maxListeners);
  }
}

export let unlinkAsync = promisify(fs.unlink);
