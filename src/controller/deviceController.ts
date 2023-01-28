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
import { Response } from 'express';
import fs from 'fs';
import mime from 'mime-types';

import { RequestWPP } from '../types/RequestWPP';
import { contactToArray, unlinkAsync } from '../util/functions';
import { clientsArray } from '../util/sessionUtil';
import { download } from './sessionController';

function returnSucess(res: any, session: any, phone: any, data: any) {
  res.status(201).json({
    status: 'Success',
    response: {
      message: 'Information retrieved successfully.',
      contact: phone,
      session: session,
      data: data,
    },
  });
}

function returnError(req: RequestWPP, res: Response, session: any, error: any) {
  req.logger.error(error);
  res.status(400).json({
    status: 'Error',
    response: {
      message: 'Error retrieving information',
      session: session,
      log: error,
    },
  });
}

export async function setProfileName(req: any, res: any) {
  const { name } = req.body;

  if (!name)
    return res
      .status(400)
      .json({ status: 'error', message: 'Parameter name is required!' });

  try {
    const result = await req.client.setProfileName(name);
    return res.status(200).json({ status: 'success', response: result });
  } catch (error) {
    req.logger.error(error);
    res.status(500).json({
      status: 'error',
      message: 'Error on set profile name.',
      error: error,
    });
  }
}

export async function showAllContacts(req: any, res: any) {
  try {
    const contacts = await req.client.getAllContacts();
    res.status(200).json({ status: 'success', response: contacts });
  } catch (error) {
    req.logger.error(error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching contacts',
      error: error,
    });
  }
}

export async function getAllChats(req: any, res: any) {
  try {
    const response = await req.client.getAllChats();
    return res
      .status(200)
      .json({ status: 'success', response: response, mapper: 'chat' });
  } catch (e) {
    req.logger.error(e);
    return res
      .status(500)
      .json({ status: 'error', message: 'Error on get all chats' });
  }
}

export async function getAllChatsWithMessages(req: any, res: any) {
  try {
    const response = await req.client.getAllChatsWithMessages();
    return res.status(200).json({ status: 'success', response: response });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({
      status: 'error',
      message: 'Error on get all chats whit messages',
      error: e,
    });
  }
}
/**
 * Depreciado em favor de getMessages
 */
export async function getAllMessagesInChat(req: any, res: any) {
  try {
    const { phone } = req.params;
    const {
      isGroup = false,
      includeMe = true,
      includeNotifications = true,
    } = req.query;

    let response;
    for (const contato of contactToArray(phone, isGroup as boolean)) {
      response = await req.client.getAllMessagesInChat(
        contato,
        includeMe as boolean,
        includeNotifications as boolean
      );
    }

    return res.status(200).json({ status: 'success', response: response });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({
      status: 'error',
      message: 'Error on get all messages in chat',
      error: e,
    });
  }
}

export async function getAllNewMessages(req: any, res: any) {
  try {
    const response = await req.client.getAllNewMessages();
    return res.status(200).json({ status: 'success', response: response });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({
      status: 'error',
      message: 'Error on get all messages in chat',
      error: e,
    });
  }
}

export async function getAllUnreadMessages(req: any, res: any) {
  try {
    const response = await req.client.getAllUnreadMessages();
    return res.status(200).json({ status: 'success', response: response });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({
      status: 'error',
      message: 'Error on get all messages in chat',
      error: e,
    });
  }
}

export async function getChatById(req: any, res: any) {
  const { phone } = req.params;
  const { isGroup } = req.query;

  try {
    let allMessages: any = [];

    if (isGroup) {
      allMessages = await req.client.getAllMessagesInChat(
        `${phone}@g.us`,
        true,
        true
      );
    } else {
      allMessages = await req.client.getAllMessagesInChat(
        `${phone}@c.us`,
        true,
        true
      );
    }

    const dir = './WhatsAppImages';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }

    allMessages.map((message: any) => {
      if (message.type === 'sticker') {
        download(message, req.client, req.logger);
        message.body = `${req.serverOptions.host}:${
          req.serverOptions.port
        }/files/file${message.t}.${mime.extension(message.mimetype)}`;
      }
    });

    return res.status(200).json({ status: 'success', response: allMessages });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({
      status: 'error',
      message: 'Error changing chat by Id',
      error: e,
    });
  }
}

export async function getMessageById(req: any, res: any) {
  const session = req.session;
  const { messageId } = req.params;

  try {
    const result = await req.client.getMessageById(messageId);

    returnSucess(res, session, result.chatId.user, result);
  } catch (error) {
    returnError(req, res, session, error);
  }
}

export async function getBatteryLevel(req: any, res: any) {
  try {
    const response = await req.client.getBatteryLevel();
    return res.status(200).json({ status: 'Success', response: response });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({
      status: 'error',
      message: 'Error retrieving battery status',
      error: e,
    });
  }
}

export async function getHostDevice(req: any, res: any) {
  try {
    const response = await req.client.getHostDevice();
    const phoneNumber = await req.client.getWid();
    return res.status(200).json({
      status: 'success',
      response: { ...response, phoneNumber },
      mapper: 'device',
    });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({
      status: 'error',
      message: 'Erro ao recuperar dados do telefone',
      error: e,
    });
  }
}

export async function getPhoneNumber(req: any, res: any) {
  try {
    const phoneNumber = await req.client.getWid();
    return res
      .status(200)
      .json({ status: 'success', response: phoneNumber, mapper: 'device' });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({
      status: 'error',
      message: 'Error retrieving phone number',
      error: e,
    });
  }
}

export async function getBlockList(req: any, res: any) {
  const response = await req.client.getBlockList();

  try {
    const blocked = response.map((contato: any) => {
      return { phone: contato ? contato.split('@')[0] : '' };
    });

    return res.status(200).json({ status: 'success', response: blocked });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({
      status: 'error',
      message: 'Error retrieving blocked contact list',
      error: e,
    });
  }
}

export async function deleteChat(req: any, res: any) {
  const { phone } = req.body;
  const session = req.session;

  try {
    const results: any = {};
    for (const contato of phone) {
      results[contato] = await req.client.deleteChat(contato);
    }
    returnSucess(res, session, phone, results);
  } catch (error) {
    returnError(req, res, session, error);
  }
}
export async function deleteAllChats(req: any, res: any) {
  try {
    const chats = await req.client.getAllChats();
    for (const chat of chats) {
      await req.client.deleteChat((chat as any).chatId);
    }
    return res.status(200).json({ status: 'success' });
  } catch (error) {
    req.logger.error(error);
    return res.status(500).json({
      status: 'error',
      message: 'Error on delete all chats',
      error: error,
    });
  }
}

export async function clearChat(req: any, res: any) {
  const { phone } = req.body;
  const session = req.session;

  try {
    const results: any = {};
    for (const contato of phone) {
      results[contato] = await req.client.clearChat(contato);
    }
    returnSucess(res, session, phone, results);
  } catch (error) {
    returnError(req, res, session, error);
  }
}

export async function clearAllChats(req: any, res: any) {
  try {
    const chats = await req.client.getAllChats();
    for (const chat of chats) {
      await req.client.clearChat(`${(chat as any).chatId}`);
    }
    return res.status(201).json({ status: 'success' });
  } catch (e) {
    req.logger.error(e);
    return res
      .status(500)
      .json({ status: 'error', message: 'Error on clear all chats', error: e });
  }
}

export async function archiveChat(req: any, res: any) {
  const { phone, value = true } = req.body;

  try {
    const response = await req.client.archiveChat(`${phone}`, value);
    return res.status(201).json({ status: 'success', response: response });
  } catch (e) {
    req.logger.error(e);
    return res
      .status(500)
      .json({ status: 'error', message: 'Error on archive chat', error: e });
  }
}

export async function archiveAllChats(req: any, res: any) {
  try {
    const chats = await req.client.getAllChats();
    for (const chat of chats) {
      await req.client.archiveChat(`${(chat as any).chatId}`, true);
    }
    return res.status(201).json({ status: 'success' });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({
      status: 'error',
      message: 'Error on archive all chats',
      error: e,
    });
  }
}

export async function deleteMessage(req: any, res: any) {
  const { phone, messageId } = req.body;

  try {
    await req.client.deleteMessage(`${phone}`, [messageId]);

    return res
      .status(200)
      .json({ status: 'success', response: { message: 'Message deleted' } });
  } catch (e) {
    req.logger.error(e);
    return res
      .status(500)
      .json({ status: 'error', message: 'Error on delete message', error: e });
  }
}
export async function reactMessage(req: any, res: any) {
  const { msgId, reaction } = req.body;

  try {
    await req.client.sendReactionToMessage(msgId, reaction);

    return res
      .status(200)
      .json({ status: 'success', response: { message: 'Reaction sended' } });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({
      status: 'error',
      message: 'Error on send reaction to message',
      error: e,
    });
  }
}

export async function reply(req: any, res: any) {
  const { phone, text, messageid } = req.body;

  try {
    const response = await req.client.reply(`${phone}@c.us`, text, messageid);
    return res.status(200).json({ status: 'success', response: response });
  } catch (e) {
    req.logger.error(e);
    return res
      .status(500)
      .json({ status: 'error', message: 'Error replying message', error: e });
  }
}

export async function forwardMessages(req: any, res: any) {
  const { phone, messageId, isGroup = false } = req.body;

  try {
    let response;

    if (!isGroup) {
      response = await req.client.forwardMessages(
        `${phone}`,
        [messageId],
        false
      );
    } else {
      response = await req.client.forwardMessages(
        `${phone}`,
        [messageId],
        false
      );
    }

    return res.status(201).json({ status: 'success', response: response });
  } catch (e) {
    req.logger.error(e);
    return res
      .status(500)
      .json({ status: 'error', message: 'Error forwarding message', error: e });
  }
}

export async function markUnseenMessage(req: any, res: any) {
  const { phone } = req.body;

  try {
    await req.client.markUnseenMessage(`${phone}`);
    return res
      .status(200)
      .json({ status: 'success', response: { message: 'unseen checked' } });
  } catch (e) {
    req.logger.error(e);
    return res
      .status(500)
      .json({ status: 'error', message: 'Error on mark unseen', error: e });
  }
}

export async function blockContact(req: any, res: any) {
  const { phone } = req.body;

  try {
    await req.client.blockContact(`${phone}`);
    return res
      .status(200)
      .json({ status: 'success', response: { message: 'Contact blocked' } });
  } catch (e) {
    req.logger.error(e);
    return res
      .status(500)
      .json({ status: 'error', message: 'Error on block contact', error: e });
  }
}

export async function unblockContact(req: any, res: any) {
  const { phone } = req.body;

  try {
    await req.client.unblockContact(`${phone}`);
    return res
      .status(200)
      .json({ status: 'success', response: { message: 'Contact UnBlocked' } });
  } catch (e) {
    req.logger.error(e);
    return res
      .status(500)
      .json({ status: 'error', message: 'Error on unlock contact', error: e });
  }
}

export async function pinChat(req: any, res: any) {
  const { phone, state } = req.body;

  try {
    for (const contato of phone) {
      await req.client.pinChat(contato, state === 'true', false);
    }

    return res
      .status(200)
      .json({ status: 'success', response: { message: 'Chat fixed' } });
  } catch (e: any) {
    req.logger.error(e);
    return res.status(500).json({
      status: 'error',
      message: e.text || 'Error on pin chat',
      error: e,
    });
  }
}

export async function setProfilePic(req: any, res: any) {
  if (!req.file)
    return res
      .status(400)
      .json({ status: 'Error', message: 'File parameter is required!' });

  try {
    const { path: pathFile } = req.file;

    await req.client.setProfilePic(pathFile);
    await unlinkAsync(pathFile);

    return res.status(200).json({
      status: 'success',
      response: { message: 'Profile photo successfully changed' },
    });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({
      status: 'error',
      message: 'Error changing profile photo',
      error: e,
    });
  }
}

export async function getUnreadMessages(req: any, res: any) {
  try {
    const response = await req.client.getUnreadMessages(false, false, true);
    return res.status(200).json({ status: 'success', response: response });
  } catch (e) {
    req.logger.error(e);
    return res
      .status(500)
      .json({ status: 'error', response: 'Error on open list', error: e });
  }
}

export async function getChatIsOnline(req: any, res: any) {
  const { phone } = req.params;
  try {
    const response = await req.client.getChatIsOnline(`${phone}@c.us`);
    return res.status(200).json({ status: 'success', response: response });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({
      status: 'error',
      response: 'Error on get chat is online',
      error: e,
    });
  }
}

export async function getLastSeen(req: any, res: any) {
  const { phone } = req.params;
  try {
    const response = await req.client.getLastSeen(`${phone}@c.us`);

    return res.status(200).json({ status: 'success', response: response });
  } catch (error) {
    req.logger.error(error);
    return res.status(500).json({
      status: 'error',
      response: 'Error on get chat last seen',
      error: error,
    });
  }
}

export async function getListMutes(req: any, res: any) {
  const { type = 'all' } = req.params;
  try {
    const response = await req.client.getListMutes(type);

    return res.status(200).json({ status: 'success', response: response });
  } catch (error) {
    req.logger.error(error);
    return res.status(500).json({
      status: 'error',
      response: 'Error on get list mutes',
      error: error,
    });
  }
}

export async function loadAndGetAllMessagesInChat(req: any, res: any) {
  const { phone, includeMe = true, includeNotifications = false } = req.params;
  try {
    const response = await req.client.loadAndGetAllMessagesInChat(
      `${phone}@c.us`,
      includeMe as boolean,
      includeNotifications as boolean
    );

    return res.status(200).json({ status: 'success', response: response });
  } catch (error) {
    req.logger.error(error);
    return res
      .status(500)
      .json({ status: 'error', response: 'Error on open list', error: error });
  }
}
export async function getMessages(req: any, res: any) {
  const { phone } = req.params;
  const { count = 20, direction = 'before', id = null } = req.query;
  try {
    const response = await req.client.getMessages(`${phone}`, {
      count: parseInt(count as string),
      direction: direction.toString() as any,
      id: id as string,
    });
    return res.status(200).json({ status: 'success', response: response });
  } catch (e) {
    req.logger.error(e);
    return res
      .status(401)
      .json({ status: 'error', response: 'Error on open list', error: e });
  }
}

export async function sendContactVcard(req: any, res: any) {
  const { phone, contactsId, name = null, isGroup = false } = req.body;
  try {
    let response;
    for (const contato of contactToArray(phone, isGroup)) {
      response = await req.client.sendContactVcard(
        `${contato}`,
        contactsId,
        name
      );
    }

    return res.status(200).json({ status: 'success', response: response });
  } catch (error) {
    req.logger.error(error);
    return res.status(500).json({
      status: 'error',
      message: 'Error on send contact vcard',
      error: error,
    });
  }
}

export async function sendMute(req: any, res: any) {
  const { phone, time, type = 'hours', isGroup = false } = req.body;

  try {
    let response;
    for (const contato of contactToArray(phone, isGroup)) {
      response = await req.client.sendMute(`${contato}`, time, type);
    }

    return res.status(200).json({ status: 'success', response: response });
  } catch (error) {
    req.logger.error(error);
    return res
      .status(500)
      .json({ status: 'error', message: 'Error on send mute', error: error });
  }
}

export async function sendSeen(req: any, res: any) {
  const { phone } = req.body;
  const session = req.session;

  try {
    const results: any = [];
    for (const contato of phone) {
      results.push(await req.client.sendSeen(contato));
    }
    returnSucess(res, session, phone, results);
  } catch (error) {
    returnError(req, res, session, error);
  }
}

export async function setChatState(req: any, res: any) {
  const { phone, chatstate, isGroup = false } = req.body;

  try {
    let response;
    for (const contato of contactToArray(phone, isGroup)) {
      response = await req.client.setChatState(`${contato}`, chatstate);
    }

    return res.status(200).json({ status: 'success', response: response });
  } catch (error) {
    req.logger.error(error);
    return res.status(500).json({
      status: 'error',
      message: 'Error on send chat state',
      error: error,
    });
  }
}

export async function setTemporaryMessages(req: any, res: any) {
  const { phone, value = true, isGroup = false } = req.body;

  try {
    let response;
    for (const contato of contactToArray(phone, isGroup)) {
      response = await req.client.setTemporaryMessages(`${contato}`, value);
    }

    return res.status(200).json({ status: 'success', response: response });
  } catch (error) {
    req.logger.error(error);
    return res.status(500).json({
      status: 'error',
      message: 'Error on set temporary messages',
      error: error,
    });
  }
}

export async function setTyping(req: any, res: any) {
  const { phone, value = true, isGroup = false } = req.body;
  try {
    let response;
    for (const contato of contactToArray(phone, isGroup)) {
      if (value) response = await req.client.startTyping(contato);
      else response = await req.client.stopTyping(contato);
    }

    return res.status(200).json({ status: 'success', response: response });
  } catch (error) {
    req.logger.error(error);
    return res
      .status(500)
      .json({ status: 'error', message: 'Error on set typing', error: error });
  }
}

export async function setRecording(req: any, res: any) {
  const { phone, value = true, duration, isGroup = false } = req.body;
  try {
    let response;
    for (const contato of contactToArray(phone, isGroup)) {
      if (value) response = await req.client.startRecording(contato, duration);
      else response = await req.client.stopRecoring(contato);
    }

    return res.status(200).json({ status: 'success', response: response });
  } catch (error) {
    req.logger.error(error);
    return res.status(500).json({
      status: 'error',
      message: 'Error on set recording',
      error: error,
    });
  }
}

export async function checkNumberStatus(req: any, res: any) {
  const { phone } = req.params;
  try {
    let response;
    for (const contato of contactToArray(phone, false)) {
      response = await req.client.checkNumberStatus(`${contato}`);
    }

    return res.status(200).json({ status: 'success', response: response });
  } catch (error) {
    req.logger.error(error);
    return res.status(500).json({
      status: 'error',
      message: 'Error on check number status',
      error: error,
    });
  }
}

export async function getContact(req: any, res: any) {
  const { phone = true } = req.params;
  try {
    let response;
    for (const contato of contactToArray(phone as string, false)) {
      response = await req.client.getContact(contato);
    }

    return res.status(200).json({ status: 'success', response: response });
  } catch (error) {
    req.logger.error(error);
    return res
      .status(500)
      .json({ status: 'error', message: 'Error on get contact', error: error });
  }
}

export async function getAllContacts(req: any, res: any) {
  try {
    const response = await req.client.getAllContacts();

    return res.status(200).json({ status: 'success', response: response });
  } catch (error) {
    req.logger.error(error);
    return res.status(500).json({
      status: 'error',
      message: 'Error on get all constacts',
      error: error,
    });
  }
}

export async function getNumberProfile(req: any, res: any) {
  const { phone = true } = req.params;
  try {
    let response;
    for (const contato of contactToArray(phone as string, false)) {
      response = await req.client.getNumberProfile(contato);
    }

    return res.status(200).json({ status: 'success', response: response });
  } catch (error) {
    req.logger.error(error);
    return res.status(500).json({
      status: 'error',
      message: 'Error on get number profile',
      error: error,
    });
  }
}

export async function getProfilePicFromServer(req: any, res: any) {
  const { phone = true } = req.params;
  try {
    let response;
    for (const contato of contactToArray(phone as string, false)) {
      response = await req.client.getProfilePicFromServer(contato);
    }

    return res.status(200).json({ status: 'success', response: response });
  } catch (error) {
    req.logger.error(error);
    return res.status(500).json({
      status: 'error',
      message: 'Error on  get profile pic',
      error: error,
    });
  }
}

export async function getStatus(req: any, res: any) {
  const { phone = true } = req.params;
  try {
    let response;
    for (const contato of contactToArray(phone as string, false)) {
      response = await req.client.getStatus(contato);
    }
    return res.status(200).json({ status: 'success', response: response });
  } catch (error) {
    req.logger.error(error);
    return res
      .status(500)
      .json({ status: 'error', message: 'Error on  get status', error: error });
  }
}

export async function setProfileStatus(req: any, res: any) {
  const { status } = req.body;
  try {
    const response = await req.client.setProfileStatus(status);

    return res.status(200).json({ status: 'success', response: response });
  } catch (e) {
    req.logger.error(e);
    return res
      .status(500)
      .json({ status: 'error', message: 'Error on set profile status' });
  }
}
export async function rejectCall(req: any, res: any) {
  const { callId } = req.body;
  try {
    const response = await req.client.rejectCall(callId);

    return res.status(200).json({ status: 'success', response: response });
  } catch (e) {
    req.logger.error(e);
    return res
      .status(500)
      .json({ status: 'error', message: 'Error on rejectCall', error: e });
  }
}

export async function starMessage(req: any, res: any) {
  const { messageId, star = true } = req.body;
  try {
    const response = await req.client.starMessage(messageId, star);

    return res.status(200).json({ status: 'success', response: response });
  } catch (error) {
    req.logger.error(error);
    return res.status(500).json({
      status: 'error',
      message: 'Error on  start message',
      error: error,
    });
  }
}

export async function getReactions(req: any, res: any) {
  const messageId = req.params.id;
  try {
    const response = await req.client.getReactions(messageId);

    return res.status(200).json({ status: 'success', response: response });
  } catch (error) {
    req.logger.error(error);
    return res.status(500).json({
      status: 'error',
      message: 'Error on get reactions',
      error: error,
    });
  }
}

export async function getVotes(req: any, res: any) {
  const messageId = req.params.id;
  try {
    const response = await req.client.getVotes(messageId);

    return res.status(200).json({ status: 'success', response: response });
  } catch (error) {
    req.logger.error(error);
    return res
      .status(500)
      .json({ status: 'error', message: 'Error on get votes', error: error });
  }
}
export async function chatWoot(req: any, res: any) {
  const { session } = req.params;
  const client: any = clientsArray[session];
  if (client == null || client.status !== 'CONNECTED') return;
  try {
    if (await client.isConnected()) {
      const event = req.body.event;

      if (
        event == 'conversation_status_changed' ||
        event == 'conversation_resolved' ||
        req.body.private
      ) {
        return res
          .status(200)
          .json({ status: 'success', message: 'Success on receive chatwoot' });
      }

      const {
        message_type,
        phone = req.body.conversation.meta.sender.phone_number.replace('+', ''),
        message = req.body.conversation.messages[0],
      } = req.body;

      if (event != 'message_created' && message_type != 'outgoing')
        return res.status(200);
      for (const contato of contactToArray(phone, false)) {
        if (message_type == 'outgoing') {
          if (message.attachments) {
            const base_url = `${
              client.config.chatWoot.baseURL
            }/${message.attachments[0].data_url.substring(
              message.attachments[0].data_url.indexOf('/rails/') + 1
            )}`;
            await client.sendFile(
              `${contato}`,
              base_url,
              'file',
              message.content
            );
          } else {
            await client.sendText(contato, message.content);
          }
        }
      }
      return res
        .status(200)
        .json({ status: 'success', message: 'Success on  receive chatwoot' });
    }
  } catch (e) {
    console.log(e);
    return res.status(400).json({
      status: 'error',
      message: 'Error on  receive chatwoot',
      error: e,
    });
  }
}
