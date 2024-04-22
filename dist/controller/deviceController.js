"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.archiveAllChats = archiveAllChats;exports.archiveChat = archiveChat;exports.blockContact = blockContact;exports.chatWoot = chatWoot;exports.checkNumberStatus = checkNumberStatus;exports.clearAllChats = clearAllChats;exports.clearChat = clearChat;exports.deleteAllChats = deleteAllChats;exports.deleteChat = deleteChat;exports.deleteMessage = deleteMessage;exports.forwardMessages = forwardMessages;exports.getAllChats = getAllChats;exports.getAllChatsArchiveds = getAllChatsArchiveds;exports.getAllChatsWithMessages = getAllChatsWithMessages;exports.getAllContacts = getAllContacts;exports.getAllMessagesInChat = getAllMessagesInChat;exports.getAllNewMessages = getAllNewMessages;exports.getAllUnreadMessages = getAllUnreadMessages;exports.getBatteryLevel = getBatteryLevel;exports.getBlockList = getBlockList;exports.getChatById = getChatById;exports.getChatIsOnline = getChatIsOnline;exports.getContact = getContact;exports.getHostDevice = getHostDevice;exports.getLastSeen = getLastSeen;exports.getListMutes = getListMutes;exports.getMessageById = getMessageById;exports.getMessages = getMessages;exports.getNumberProfile = getNumberProfile;exports.getPhoneNumber = getPhoneNumber;exports.getPlatformFromMessage = getPlatformFromMessage;exports.getProfilePicFromServer = getProfilePicFromServer;exports.getReactions = getReactions;exports.getStatus = getStatus;exports.getUnreadMessages = getUnreadMessages;exports.getVotes = getVotes;exports.listChats = listChats;exports.loadAndGetAllMessagesInChat = loadAndGetAllMessagesInChat;exports.markUnseenMessage = markUnseenMessage;exports.pinChat = pinChat;exports.reactMessage = reactMessage;exports.rejectCall = rejectCall;exports.reply = reply;exports.sendContactVcard = sendContactVcard;exports.sendMute = sendMute;exports.sendSeen = sendSeen;exports.setChatState = setChatState;exports.setProfileName = setProfileName;exports.setProfilePic = setProfilePic;exports.setProfileStatus = setProfileStatus;exports.setRecording = setRecording;exports.setTemporaryMessages = setTemporaryMessages;exports.setTyping = setTyping;exports.showAllContacts = showAllContacts;exports.starMessage = starMessage;exports.unblockContact = unblockContact;

















var _functions = require("../util/functions");
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
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function returnSucess(res, session, phone, data) {res.status(201).json({ status: 'Success', response: { message: 'Information retrieved successfully.', contact: phone, session: session, data: data } });}function returnError(req, res, session, error) {
  req.logger.error(error);
  res.status(400).json({
    status: 'Error',
    response: {
      message: 'Error retrieving information',
      session: session,
      log: error
    }
  });
}

async function setProfileName(req, res) {
  /**
   * #swagger.tags = ["Profile"]
     #swagger.autoBody=false
     #swagger.security = [{
            "bearerAuth": []
     }]
     #swagger.parameters["session"] = {
      schema: 'NERDWHATS_AMERICA'
     }
     #swagger.requestBody = {
      required: false,
      "@content": {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              name: { type: "string" },
            }
          },
          examples: {
            "Default": {
              value: {
                name: "My new name",
              }
            },
          }
        }
      }
     }
   */
  const { name } = req.body;

  if (!name)
  return res.
  status(400).
  json({ status: 'error', message: 'Parameter name is required!' });

  try {
    const result = await req.client.setProfileName(name);
    return res.status(200).json({ status: 'success', response: result });
  } catch (error) {
    req.logger.error(error);
    res.status(500).json({
      status: 'error',
      message: 'Error on set profile name.',
      error: error
    });
  }
}

async function showAllContacts(req, res) {
  /**
   * #swagger.tags = ["Contacts"]
     #swagger.autoBody=false
     #swagger.security = [{
            "bearerAuth": []
     }]
     #swagger.parameters["session"] = {
      schema: 'NERDWHATS_AMERICA'
     }
   */
  try {
    const contacts = await req.client.getAllContacts();
    res.status(200).json({ status: 'success', response: contacts });
  } catch (error) {
    req.logger.error(error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching contacts',
      error: error
    });
  }
}

async function getAllChats(req, res) {
  /**
   * #swagger.tags = ["Chat"]
   * #swagger.summary = 'Deprecated in favor of 'list-chats'
   * #swagger.deprecated = true
     #swagger.autoBody=false
     #swagger.security = [{
            "bearerAuth": []
     }]
     #swagger.parameters["session"] = {
      schema: 'NERDWHATS_AMERICA'
     }
   */
  try {
    const response = await req.client.getAllChats();
    return res.
    status(200).
    json({ status: 'success', response: response, mapper: 'chat' });
  } catch (e) {
    req.logger.error(e);
    return res.
    status(500).
    json({ status: 'error', message: 'Error on get all chats' });
  }
}

async function listChats(req, res) {
  /**
   * #swagger.tags = ["Chat"]
   * #swagger.summary = 'Retrieve a list of chats'
   * #swagger.description = 'This body is not required. Not sent body to get all chats or filter.'
     #swagger.security = [{
            "bearerAuth": []
     }]
     #swagger.parameters["session"] = {
      schema: 'NERDWHATS_AMERICA'
     }
     #swagger.requestBody = {
      required: false,
      "@content": {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              id: { type: "string" },
              count: { type: "number" },
              direction: { type: "string" },
              onlyGroups: { type: "boolean" },
              onlyUsers: { type: "boolean" },
              onlyWithUnreadMessage: { type: "boolean" },
              withLabels: { type: "array" },
            }
          },
          examples: {
            "All options - Edit this": {
              value: {
                id: "<chatId>",
                count: 20,
                direction: "after",
                onlyGroups: false,
                onlyUsers: false,
                onlyWithUnreadMessage: false,
                withLabels: []
              }
            },
            "All chats": {
              value: {
              }
            },
            "Chats group": {
              value: {
                onlyGroups: true,
              }
            },
            "Only with unread messages": {
              value: {
                onlyWithUnreadMessage: false,
              }
            },
            "Paginated results": {
              value: {
                id: "<chatId>",
                count: 20,
                direction: "after",
              }
            },
          }
        }
      }
     }
   */
  try {
    const {
      id,
      count,
      direction,
      onlyGroups,
      onlyUsers,
      onlyWithUnreadMessage,
      withLabels
    } = req.body;

    const response = await req.client.listChats({
      id: id,
      count: count,
      direction: direction,
      onlyGroups: onlyGroups,
      onlyUsers: onlyUsers,
      onlyWithUnreadMessage: onlyWithUnreadMessage,
      withLabels: withLabels
    });

    return res.status(200).json(response);
  } catch (e) {
    req.logger.error(e);
    return res.
    status(500).
    json({ status: 'error', message: 'Error on get all chats' });
  }
}

async function getAllChatsWithMessages(req, res) {
  /**
   * #swagger.tags = ["Chat"]
   * #swagger.summary = 'Deprecated in favor of list-chats'
   * #swagger.deprecated = true
     #swagger.autoBody=false
     #swagger.security = [{
            "bearerAuth": []
     }]
     #swagger.parameters["session"] = {
      schema: 'NERDWHATS_AMERICA'
     }
   */
  try {
    const response = await req.client.getAllChatsWithMessages();
    return res.status(200).json({ status: 'success', response: response });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({
      status: 'error',
      message: 'Error on get all chats whit messages',
      error: e
    });
  }
}
/**
 * Depreciado em favor de getMessages
 */
async function getAllMessagesInChat(req, res) {
  /**
   * #swagger.tags = ["Chat"]
     #swagger.autoBody=false
     #swagger.security = [{
            "bearerAuth": []
     }]
     #swagger.parameters["session"] = {
      schema: 'NERDWHATS_AMERICA'
     }
     #swagger.parameters["phone"] = {
      schema: '5521999999999'
     }
     #swagger.parameters["isGroup"] = {
      schema: 'false'
     }
     #swagger.parameters["includeMe"] = {
      schema: 'true'
     }
     #swagger.parameters["includeNotifications"] = {
      schema: 'true'
     }
   */
  try {
    const { phone } = req.params;
    const {
      isGroup = false,
      includeMe = true,
      includeNotifications = true
    } = req.query;

    let response;
    for (const contato of (0, _functions.contactToArray)(phone, isGroup)) {
      response = await req.client.getAllMessagesInChat(
        contato,
        includeMe,
        includeNotifications
      );
    }

    return res.status(200).json({ status: 'success', response: response });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({
      status: 'error',
      message: 'Error on get all messages in chat',
      error: e
    });
  }
}

async function getAllNewMessages(req, res) {
  /**
   * #swagger.tags = ["Chat"]
     #swagger.autoBody=false
     #swagger.security = [{
            "bearerAuth": []
     }]
     #swagger.parameters["session"] = {
      schema: 'NERDWHATS_AMERICA'
     }
   */
  try {
    const response = await req.client.getAllNewMessages();
    return res.status(200).json({ status: 'success', response: response });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({
      status: 'error',
      message: 'Error on get all messages in chat',
      error: e
    });
  }
}

async function getAllUnreadMessages(req, res) {
  /**
   * #swagger.tags = ["Chat"]
     #swagger.autoBody=false
     #swagger.security = [{
            "bearerAuth": []
     }]
     #swagger.parameters["session"] = {
      schema: 'NERDWHATS_AMERICA'
     }
   */
  try {
    const response = await req.client.getAllUnreadMessages();
    return res.status(200).json({ status: 'success', response: response });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({
      status: 'error',
      message: 'Error on get all messages in chat',
      error: e
    });
  }
}

async function getChatById(req, res) {
  /**
   * #swagger.tags = ["Chat"]
     #swagger.autoBody=false
     #swagger.security = [{
            "bearerAuth": []
     }]
     #swagger.parameters["session"] = {
      schema: 'NERDWHATS_AMERICA'
     }
     #swagger.parameters["phone"] = {
      schema: '5521999999999'
     }
     #swagger.parameters["isGroup"] = {
      schema: 'false'
     }
   */
  const { phone } = req.params;
  const { isGroup } = req.query;

  try {
    let result = {};
    if (isGroup) {
      result = await req.client.getChatById(`${phone}@g.us`);
    } else {
      result = await req.client.getChatById(`${phone}@c.us`);
    }

    return res.status(200).json(result);
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({
      status: 'error',
      message: 'Error changing chat by Id',
      error: e
    });
  }
}

async function getMessageById(req, res) {
  /**
   * #swagger.tags = ["Chat"]
     #swagger.autoBody=false
     #swagger.security = [{
            "bearerAuth": []
     }]
     #swagger.parameters["session"] = {
      schema: 'NERDWHATS_AMERICA'
     }
     #swagger.parameters["messageId"] = {
      required: true,
      schema: '<message_id>'
     }
   */
  const session = req.session;
  const { messageId } = req.params;

  try {
    const result = await req.client.getMessageById(messageId);

    returnSucess(res, session, result.chatId.user, result);
  } catch (error) {
    returnError(req, res, session, error);
  }
}

async function getBatteryLevel(req, res) {
  /**
   * #swagger.tags = ["Misc"]
     #swagger.autoBody=false
     #swagger.security = [{
            "bearerAuth": []
     }]
     #swagger.parameters["session"] = {
      schema: 'NERDWHATS_AMERICA'
     }
   */
  try {
    const response = await req.client.getBatteryLevel();
    return res.status(200).json({ status: 'Success', response: response });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({
      status: 'error',
      message: 'Error retrieving battery status',
      error: e
    });
  }
}

async function getHostDevice(req, res) {
  /**
   * #swagger.tags = ["Misc"]
     #swagger.autoBody=false
     #swagger.security = [{
            "bearerAuth": []
     }]
     #swagger.parameters["session"] = {
      schema: 'NERDWHATS_AMERICA'
     }
   */
  try {
    const response = await req.client.getHostDevice();
    const phoneNumber = await req.client.getWid();
    return res.status(200).json({
      status: 'success',
      response: { ...response, phoneNumber },
      mapper: 'device'
    });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({
      status: 'error',
      message: 'Erro ao recuperar dados do telefone',
      error: e
    });
  }
}

async function getPhoneNumber(req, res) {
  /**
   * #swagger.tags = ["Misc"]
     #swagger.autoBody=false
     #swagger.security = [{
            "bearerAuth": []
     }]
     #swagger.parameters["session"] = {
      schema: 'NERDWHATS_AMERICA'
     }
   */
  try {
    const phoneNumber = await req.client.getWid();
    return res.
    status(200).
    json({ status: 'success', response: phoneNumber, mapper: 'device' });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({
      status: 'error',
      message: 'Error retrieving phone number',
      error: e
    });
  }
}

async function getBlockList(req, res) {
  /**
   * #swagger.tags = ["Misc"]
     #swagger.autoBody=false
     #swagger.security = [{
            "bearerAuth": []
     }]
     #swagger.parameters["session"] = {
      schema: 'NERDWHATS_AMERICA'
     }
   */
  const response = await req.client.getBlockList();

  try {
    const blocked = response.map((contato) => {
      return { phone: contato ? contato.split('@')[0] : '' };
    });

    return res.status(200).json({ status: 'success', response: blocked });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({
      status: 'error',
      message: 'Error retrieving blocked contact list',
      error: e
    });
  }
}

async function deleteChat(req, res) {
  /**
   * #swagger.tags = ["Chat"]
     #swagger.autoBody=false
     #swagger.security = [{
            "bearerAuth": []
     }]
     #swagger.parameters["session"] = {
      schema: 'NERDWHATS_AMERICA'
     }
     #swagger.requestBody = {
      required: false,
      "@content": {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              phone: { type: "string" },
              isGroup: { type: "boolean" },
            }
          },
          examples: {
            "Default": {
              value: {
                phone: "5521999999999",
                isGroup: false,
              }
            },
          }
        }
      }
     }
   */
  const { phone } = req.body;
  const session = req.session;

  try {
    const results = {};
    for (const contato of phone) {
      results[contato] = await req.client.deleteChat(contato);
    }
    returnSucess(res, session, phone, results);
  } catch (error) {
    returnError(req, res, session, error);
  }
}
async function deleteAllChats(req, res) {
  /**
   * #swagger.tags = ["Chat"]
     #swagger.autoBody=false
     #swagger.security = [{
            "bearerAuth": []
     }]
     #swagger.parameters["session"] = {
      schema: 'NERDWHATS_AMERICA'
     }
   */
  try {
    const chats = await req.client.getAllChats();
    for (const chat of chats) {
      await req.client.deleteChat(chat.chatId);
    }
    return res.status(200).json({ status: 'success' });
  } catch (error) {
    req.logger.error(error);
    return res.status(500).json({
      status: 'error',
      message: 'Error on delete all chats',
      error: error
    });
  }
}

async function clearChat(req, res) {
  /**
   * #swagger.tags = ["Chat"]
     #swagger.autoBody=false
     #swagger.security = [{
            "bearerAuth": []
     }]
     #swagger.parameters["session"] = {
      schema: 'NERDWHATS_AMERICA'
     }
     
     #swagger.requestBody = {
      required: false,
      "@content": {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              phone: { type: "string" },
              isGroup: { type: "boolean" },
            }
          },
          examples: {
            "Default": {
              value: {
                phone: "5521999999999",
                isGroup: false,
              }
            },
          }
        }
      }
     }
   */
  const { phone } = req.body;
  const session = req.session;

  try {
    const results = {};
    for (const contato of phone) {
      results[contato] = await req.client.clearChat(contato);
    }
    returnSucess(res, session, phone, results);
  } catch (error) {
    returnError(req, res, session, error);
  }
}

async function clearAllChats(req, res) {
  /**
   * #swagger.tags = ["Chat"]
     #swagger.autoBody=false
     #swagger.security = [{
            "bearerAuth": []
     }]
     #swagger.parameters["session"] = {
      schema: 'NERDWHATS_AMERICA'
     }
   */
  try {
    const chats = await req.client.getAllChats();
    for (const chat of chats) {
      await req.client.clearChat(`${chat.chatId}`);
    }
    return res.status(201).json({ status: 'success' });
  } catch (e) {
    req.logger.error(e);
    return res.
    status(500).
    json({ status: 'error', message: 'Error on clear all chats', error: e });
  }
}

async function archiveChat(req, res) {
  /**
   * #swagger.tags = ["Chat"]
     #swagger.autoBody=false
     #swagger.security = [{
            "bearerAuth": []
     }]
     #swagger.parameters["session"] = {
      schema: 'NERDWHATS_AMERICA'
     }
     
     #swagger.requestBody = {
      required: false,
      "@content": {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              phone: { type: "string" },
              isGroup: { type: "boolean" },
              value: { type: "boolean" },
            }
          },
          examples: {
            "Default": {
              value: {
                phone: "5521999999999",
                isGroup: false,
                value: true,
              }
            },
          }
        }
      }
     }
   */
  const { phone, value = true } = req.body;

  try {
    const response = await req.client.archiveChat(`${phone}`, value);
    return res.status(201).json({ status: 'success', response: response });
  } catch (e) {
    req.logger.error(e);
    return res.
    status(500).
    json({ status: 'error', message: 'Error on archive chat', error: e });
  }
}

async function archiveAllChats(req, res) {
  /**
   * #swagger.tags = ["Chat"]
     #swagger.autoBody=false
     #swagger.security = [{
            "bearerAuth": []
     }]
     #swagger.parameters["session"] = {
      schema: 'NERDWHATS_AMERICA'
     }
   */
  try {
    const chats = await req.client.getAllChats();
    for (const chat of chats) {
      await req.client.archiveChat(`${chat.chatId}`, true);
    }
    return res.status(201).json({ status: 'success' });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({
      status: 'error',
      message: 'Error on archive all chats',
      error: e
    });
  }
}

async function getAllChatsArchiveds(req, res) {
  /**
   * #swagger.tags = ["Chat"]
   * #swagger.description = 'Retrieves all archived chats.'
     #swagger.autoBody=false
     #swagger.security = [{
            "bearerAuth": []
     }]
     #swagger.parameters["session"] = {
      schema: 'NERDWHATS_AMERICA'
     }
   */
  try {
    const chats = await req.client.getAllChats();
    const archived = [];
    for (const chat of chats) {
      if (chat.archive === true) {
        archived.push(chat);
      }
    }
    return res.status(201).json(archived);
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({
      status: 'error',
      message: 'Error on archive all chats',
      error: e
    });
  }
}
async function deleteMessage(req, res) {
  /**
   * #swagger.tags = ["Messages"]
     #swagger.autoBody=false
     #swagger.security = [{
            "bearerAuth": []
     }]
     #swagger.parameters["session"] = {
      schema: 'NERDWHATS_AMERICA'
     }
     
     #swagger.requestBody = {
      required: false,
      "@content": {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              phone: { type: "string" },
              isGroup: { type: "boolean" },
              messageId: { type: "string" },
            }
          },
          examples: {
            "Default": {
              value: {
                phone: "5521999999999",
                isGroup: false,
                messageId: "<messageId>",
              }
            },
          }
        }
      }
     }
   */
  const { phone, messageId } = req.body;

  try {
    await req.client.deleteMessage(`${phone}`, [messageId]);

    return res.
    status(200).
    json({ status: 'success', response: { message: 'Message deleted' } });
  } catch (e) {
    req.logger.error(e);
    return res.
    status(500).
    json({ status: 'error', message: 'Error on delete message', error: e });
  }
}
async function reactMessage(req, res) {
  /**
   * #swagger.tags = ["Messages"]
     #swagger.autoBody=false
     #swagger.security = [{
            "bearerAuth": []
     }]
     #swagger.parameters["session"] = {
      schema: 'NERDWHATS_AMERICA'
     }
     #swagger.requestBody = {
      required: false,
      "@content": {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              msgId: { type: "string" },
              reaction: { type: "string" },
            }
          },
          examples: {
            "Default": {
              value: {
                msgId: "<messageId>",
                reaction: "😜",
              }
            },
          }
        }
      }
     }
   */
  const { msgId, reaction } = req.body;

  try {
    await req.client.sendReactionToMessage(msgId, reaction);

    return res.
    status(200).
    json({ status: 'success', response: { message: 'Reaction sended' } });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({
      status: 'error',
      message: 'Error on send reaction to message',
      error: e
    });
  }
}

async function reply(req, res) {
  /**
   * #swagger.deprecated=true
     #swagger.tags = ["Messages"]
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
              messageid: { type: "string" },
              text: { type: "string" },
            }
          },
          examples: {
            "Default": {
              value: {
              phone: "5521999999999",
              isGroup: false,
              messageid: "<messageId>",
              text: "Text to reply",
              }
            },
          }
        }
      }
     }
   */
  const { phone, text, messageid } = req.body;

  try {
    const response = await req.client.reply(`${phone}@c.us`, text, messageid);
    return res.status(200).json({ status: 'success', response: response });
  } catch (e) {
    req.logger.error(e);
    return res.
    status(500).
    json({ status: 'error', message: 'Error replying message', error: e });
  }
}

async function forwardMessages(req, res) {
  /**
     #swagger.tags = ["Messages"]
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
              messageid: { type: "string" },
            }
          },
          examples: {
            "Default": {
              value: {
                phone: "5521999999999",
                isGroup: false,
                messageid: "<messageId>",
              }
            },
          }
        }
      }
     }
   */
  const { phone, messageId, isGroup = false } = req.body;

  try {
    let response;

    if (!isGroup) {
      response = await req.client.forwardMessage(`${phone}`, [messageId]);
    } else {
      response = await req.client.forwardMessage(`${phone}`, [messageId]);
    }

    return res.status(201).json({ status: 'success', response: response });
  } catch (e) {
    req.logger.error(e);
    return res.
    status(500).
    json({ status: 'error', message: 'Error forwarding message', error: e });
  }
}

async function markUnseenMessage(req, res) {
  /**
     #swagger.tags = ["Messages"]
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
            }
          },
          examples: {
            "Default": {
              value: {
                phone: "5521999999999",
                isGroup: false,
              }
            },
          }
        }
      }
     }
   */
  const { phone } = req.body;

  try {
    await req.client.markUnseenMessage(`${phone}`);
    return res.
    status(200).
    json({ status: 'success', response: { message: 'unseen checked' } });
  } catch (e) {
    req.logger.error(e);
    return res.
    status(500).
    json({ status: 'error', message: 'Error on mark unseen', error: e });
  }
}

async function blockContact(req, res) {
  /**
     #swagger.tags = ["Misc"]
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
            }
          },
          examples: {
            "Default": {
              value: {
              phone: "5521999999999",
              isGroup: false,
              }
            },
          }
        }
      }
     }
   */
  const { phone } = req.body;

  try {
    await req.client.blockContact(`${phone}`);
    return res.
    status(200).
    json({ status: 'success', response: { message: 'Contact blocked' } });
  } catch (e) {
    req.logger.error(e);
    return res.
    status(500).
    json({ status: 'error', message: 'Error on block contact', error: e });
  }
}

async function unblockContact(req, res) {
  /**
     #swagger.tags = ["Misc"]
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
            }
          },
          examples: {
            "Default": {
              value: {
              phone: "5521999999999",
              isGroup: false,
              }
            },
          }
        }
      }
     }
   */
  const { phone } = req.body;

  try {
    await req.client.unblockContact(`${phone}`);
    return res.
    status(200).
    json({ status: 'success', response: { message: 'Contact UnBlocked' } });
  } catch (e) {
    req.logger.error(e);
    return res.
    status(500).
    json({ status: 'error', message: 'Error on unlock contact', error: e });
  }
}

async function pinChat(req, res) {
  /**
     #swagger.tags = ["Chat"]
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
        $phone: '5521999999999',
        $isGroup: false,
        $state: true,
      }
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
              state: { type: "boolean" },
            }
          },
          examples: {
            "Default": {
              value: {
              phone: "5521999999999",
              state: true,
              }
            },
          }
        }
      }
     }
   */
  const { phone, state } = req.body;

  try {
    for (const contato of phone) {
      await req.client.pinChat(contato, state === 'true', false);
    }

    return res.
    status(200).
    json({ status: 'success', response: { message: 'Chat fixed' } });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({
      status: 'error',
      message: e.text || 'Error on pin chat',
      error: e
    });
  }
}

async function setProfilePic(req, res) {
  /**
     #swagger.tags = ["Profile"]
     #swagger.autoBody=false
     #swagger.security = [{
            "bearerAuth": []
     }]
     #swagger.parameters["session"] = {
      schema: 'NERDWHATS_AMERICA'
     }
     #swagger.consumes = ['multipart/form-data']  
      #swagger.parameters['file'] = {
          in: 'formData',
          type: 'file',
          required: 'true',
      }
   */
  if (!req.file)
  return res.
  status(400).
  json({ status: 'Error', message: 'File parameter is required!' });

  try {
    const { path: pathFile } = req.file;

    await req.client.setProfilePic(pathFile);
    await (0, _functions.unlinkAsync)(pathFile);

    return res.status(200).json({
      status: 'success',
      response: { message: 'Profile photo successfully changed' }
    });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({
      status: 'error',
      message: 'Error changing profile photo',
      error: e
    });
  }
}

async function getUnreadMessages(req, res) {
  /**
     #swagger.deprecated=true
     #swagger.tags = ["Messages"]
     #swagger.autoBody=false
     #swagger.security = [{
            "bearerAuth": []
     }]
     #swagger.parameters["session"] = {
      schema: 'NERDWHATS_AMERICA'
     }
   */
  try {
    const response = await req.client.getUnreadMessages(false, false, true);
    return res.status(200).json({ status: 'success', response: response });
  } catch (e) {
    req.logger.error(e);
    return res.
    status(500).
    json({ status: 'error', response: 'Error on open list', error: e });
  }
}

async function getChatIsOnline(req, res) {
  /**
     #swagger.tags = ["Chat"]
     #swagger.autoBody=false
     #swagger.security = [{
            "bearerAuth": []
     }]
     #swagger.parameters["session"] = {
      schema: 'NERDWHATS_AMERICA'
     }
     #swagger.parameters["phone"] = {
      schema: '5521999999999',
     }
   */
  const { phone } = req.params;
  try {
    const response = await req.client.getChatIsOnline(`${phone}@c.us`);
    return res.status(200).json({ status: 'success', response: response });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({
      status: 'error',
      response: 'Error on get chat is online',
      error: e
    });
  }
}

async function getLastSeen(req, res) {
  /**
     #swagger.tags = ["Chat"]
     #swagger.autoBody=false
     #swagger.security = [{
            "bearerAuth": []
     }]
     #swagger.parameters["session"] = {
      schema: 'NERDWHATS_AMERICA'
     }
     #swagger.parameters["phone"] = {
      schema: '5521999999999',
     }
   */
  const { phone } = req.params;
  try {
    const response = await req.client.getLastSeen(`${phone}@c.us`);

    return res.status(200).json({ status: 'success', response: response });
  } catch (error) {
    req.logger.error(error);
    return res.status(500).json({
      status: 'error',
      response: 'Error on get chat last seen',
      error: error
    });
  }
}

async function getListMutes(req, res) {
  /**
     #swagger.tags = ["Chat"]
     #swagger.autoBody=false
     #swagger.security = [{
            "bearerAuth": []
     }]
     #swagger.parameters["session"] = {
      schema: 'NERDWHATS_AMERICA'
     }
     #swagger.parameters["type"] = {
      schema: 'all',
     }
   */
  const { type = 'all' } = req.params;
  try {
    const response = await req.client.getListMutes(type);

    return res.status(200).json({ status: 'success', response: response });
  } catch (error) {
    req.logger.error(error);
    return res.status(500).json({
      status: 'error',
      response: 'Error on get list mutes',
      error: error
    });
  }
}

async function loadAndGetAllMessagesInChat(req, res) {
  /**
     #swagger.deprecated=true
     #swagger.tags = ["Chat"]
     #swagger.autoBody=false
     #swagger.security = [{
            "bearerAuth": []
     }]
     #swagger.parameters["session"] = {
      schema: 'NERDWHATS_AMERICA'
     }
     #swagger.parameters["phone"] = {
      schema: '5521999999999'
     }
     #swagger.parameters["includeMe"] = {
      schema: 'true'
     }
     #swagger.parameters["includeNotifications"] = {
      schema: 'false'
     }
   */
  const { phone, includeMe = true, includeNotifications = false } = req.params;
  try {
    const response = await req.client.loadAndGetAllMessagesInChat(
      `${phone}@c.us`,
      includeMe,
      includeNotifications
    );

    return res.status(200).json({ status: 'success', response: response });
  } catch (error) {
    req.logger.error(error);
    return res.
    status(500).
    json({ status: 'error', response: 'Error on open list', error: error });
  }
}
async function getMessages(req, res) {
  /**
     #swagger.tags = ["Messages"]
     #swagger.autoBody=false
     #swagger.security = [{
            "bearerAuth": []
     }]
     #swagger.parameters["session"] = {
      schema: 'NERDWHATS_AMERICA'
     }
     #swagger.parameters["phone"] = {
      schema: '5521999999999@c.us'
     }
     #swagger.parameters["count"] = {
      schema: '20'
     }
     #swagger.parameters["direction"] = {
      schema: 'before'
     }
     #swagger.parameters["id"] = {
      schema: '<message_id_to_use_direction>'
     }
   */
  const { phone } = req.params;
  const { count = 20, direction = 'before', id = null } = req.query;
  try {
    const response = await req.client.getMessages(`${phone}`, {
      count: parseInt(count),
      direction: direction.toString(),
      id: id
    });
    return res.status(200).json({ status: 'success', response: response });
  } catch (e) {
    req.logger.error(e);
    return res.
    status(401).
    json({ status: 'error', response: 'Error on open list', error: e });
  }
}

async function sendContactVcard(req, res) {
  /**
     #swagger.tags = ["Messages"]
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
              name: { type: "string" },
              contactsId: { type: "array" },
            }
          },
          examples: {
            "Default": {
              value: {
                phone: "5521999999999",
                isGroup: false,
                name: 'Name of contact',
                contactsId: ['5521999999999'],
              }
            },
          }
        }
      }
     }
   */
  const { phone, contactsId, name = null, isGroup = false } = req.body;
  try {
    let response;
    for (const contato of (0, _functions.contactToArray)(phone, isGroup)) {
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
      error: error
    });
  }
}

async function sendMute(req, res) {
  /**
     #swagger.tags = ["Chat"]
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
              time: { type: "number" },
              type: { type: "string" },
            }
          },
          examples: {
            "Default": {
              value: {
                phone: "5521999999999",
                isGroup: false,
                time: 1,
                type: 'hours',
              }
            },
          }
        }
      }
     }
   */
  const { phone, time, type = 'hours', isGroup = false } = req.body;

  try {
    let response;
    for (const contato of (0, _functions.contactToArray)(phone, isGroup)) {
      response = await req.client.sendMute(`${contato}`, time, type);
    }

    return res.status(200).json({ status: 'success', response: response });
  } catch (error) {
    req.logger.error(error);
    return res.
    status(500).
    json({ status: 'error', message: 'Error on send mute', error: error });
  }
}

async function sendSeen(req, res) {
  /**
     #swagger.tags = ["Chat"]
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
            }
          },
          examples: {
            "Default": {
              value: {
                phone: "5521999999999",
                isGroup: false,
              }
            },
          }
        }
      }
     }
   */
  const { phone } = req.body;
  const session = req.session;

  try {
    const results = [];
    for (const contato of phone) {
      results.push(await req.client.sendSeen(contato));
    }
    returnSucess(res, session, phone, results);
  } catch (error) {
    returnError(req, res, session, error);
  }
}

async function setChatState(req, res) {
  /**
     #swagger.deprecated=true
     #swagger.tags = ["Chat"]
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
              chatstate: { type: "string" },
            }
          },
          examples: {
            "Default": {
              value: {
                phone: "5521999999999",
                isGroup: false,
                chatstate: "1",
              }
            },
          }
        }
      }
     }
   */
  const { phone, chatstate, isGroup = false } = req.body;

  try {
    let response;
    for (const contato of (0, _functions.contactToArray)(phone, isGroup)) {
      response = await req.client.setChatState(`${contato}`, chatstate);
    }

    return res.status(200).json({ status: 'success', response: response });
  } catch (error) {
    req.logger.error(error);
    return res.status(500).json({
      status: 'error',
      message: 'Error on send chat state',
      error: error
    });
  }
}

async function setTemporaryMessages(req, res) {
  /**
     #swagger.tags = ["Messages"]
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
              value: { type: "boolean" },
            }
          },
          examples: {
            "Default": {
              value: {
                phone: "5521999999999",
                isGroup: false,
                value: true,
              }
            },
          }
        }
      }
     }
   */
  const { phone, value = true, isGroup = false } = req.body;

  try {
    let response;
    for (const contato of (0, _functions.contactToArray)(phone, isGroup)) {
      response = await req.client.setTemporaryMessages(`${contato}`, value);
    }

    return res.status(200).json({ status: 'success', response: response });
  } catch (error) {
    req.logger.error(error);
    return res.status(500).json({
      status: 'error',
      message: 'Error on set temporary messages',
      error: error
    });
  }
}

async function setTyping(req, res) {
  /**
     #swagger.tags = ["Chat"]
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
              value: { type: "boolean" },
            }
          },
          examples: {
            "Default": {
              value: {
                phone: "5521999999999",
                isGroup: false,
                value: true,
              }
            },
          }
        }
      }
     }
   */
  const { phone, value = true, isGroup = false } = req.body;
  try {
    let response;
    for (const contato of (0, _functions.contactToArray)(phone, isGroup)) {
      if (value) response = await req.client.startTyping(contato);else
      response = await req.client.stopTyping(contato);
    }

    return res.status(200).json({ status: 'success', response: response });
  } catch (error) {
    req.logger.error(error);
    return res.
    status(500).
    json({ status: 'error', message: 'Error on set typing', error: error });
  }
}

async function setRecording(req, res) {
  /**
     #swagger.tags = ["Chat"]
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
              duration: { type: "number" },
              value: { type: "boolean" },
            }
          },
          examples: {
            "Default": {
              value: {
                phone: "5521999999999",
                isGroup: false,
                duration: 5,
                value: true,
              }
            },
          }
        }
      }
     }
   */
  const { phone, value = true, duration, isGroup = false } = req.body;
  try {
    let response;
    for (const contato of (0, _functions.contactToArray)(phone, isGroup)) {
      if (value) response = await req.client.startRecording(contato, duration);else
      response = await req.client.stopRecoring(contato);
    }

    return res.status(200).json({ status: 'success', response: response });
  } catch (error) {
    req.logger.error(error);
    return res.status(500).json({
      status: 'error',
      message: 'Error on set recording',
      error: error
    });
  }
}

async function checkNumberStatus(req, res) {
  /**
     #swagger.tags = ["Misc"]
     #swagger.autoBody=false
     #swagger.security = [{
            "bearerAuth": []
     }]
     #swagger.parameters["session"] = {
      schema: 'NERDWHATS_AMERICA'
     }
     #swagger.parameters["phone"] = {
      schema: '5521999999999'
     }
   */
  const { phone } = req.params;
  try {
    let response;
    for (const contato of (0, _functions.contactToArray)(phone, false)) {
      response = await req.client.checkNumberStatus(`${contato}`);
    }

    return res.status(200).json({ status: 'success', response: response });
  } catch (error) {
    req.logger.error(error);
    return res.status(500).json({
      status: 'error',
      message: 'Error on check number status',
      error: error
    });
  }
}

async function getContact(req, res) {
  /**
     #swagger.tags = ["Chat"]
     #swagger.autoBody=false
     #swagger.security = [{
            "bearerAuth": []
     }]
     #swagger.parameters["session"] = {
      schema: 'NERDWHATS_AMERICA'
     }
     #swagger.parameters["phone"] = {
      schema: '5521999999999'
     }
   */
  const { phone = true } = req.params;
  try {
    let response;
    for (const contato of (0, _functions.contactToArray)(phone, false)) {
      response = await req.client.getContact(contato);
    }

    return res.status(200).json({ status: 'success', response: response });
  } catch (error) {
    req.logger.error(error);
    return res.
    status(500).
    json({ status: 'error', message: 'Error on get contact', error: error });
  }
}

async function getAllContacts(req, res) {
  /**
   * #swagger.tags = ["Contact"]
     #swagger.autoBody=false
     #swagger.security = [{
            "bearerAuth": []
     }]
     #swagger.parameters["session"] = {
      schema: 'NERDWHATS_AMERICA'
     }
   */
  try {
    const response = await req.client.getAllContacts();

    return res.status(200).json({ status: 'success', response: response });
  } catch (error) {
    req.logger.error(error);
    return res.status(500).json({
      status: 'error',
      message: 'Error on get all constacts',
      error: error
    });
  }
}

async function getNumberProfile(req, res) {
  /**
     #swagger.deprecated=true
     #swagger.tags = ["Chat"]
     #swagger.autoBody=false
     #swagger.security = [{
            "bearerAuth": []
     }]
     #swagger.parameters["session"] = {
      schema: 'NERDWHATS_AMERICA'
     }
     #swagger.parameters["phone"] = {
      schema: '5521999999999'
     }
   */
  const { phone = true } = req.params;
  try {
    let response;
    for (const contato of (0, _functions.contactToArray)(phone, false)) {
      response = await req.client.getNumberProfile(contato);
    }

    return res.status(200).json({ status: 'success', response: response });
  } catch (error) {
    req.logger.error(error);
    return res.status(500).json({
      status: 'error',
      message: 'Error on get number profile',
      error: error
    });
  }
}

async function getProfilePicFromServer(req, res) {
  /**
     #swagger.tags = ["Contact"]
     #swagger.autoBody=false
     #swagger.security = [{
            "bearerAuth": []
     }]
     #swagger.parameters["session"] = {
      schema: 'NERDWHATS_AMERICA'
     }
     #swagger.parameters["phone"] = {
      schema: '5521999999999'
     }
   */
  const { phone = true } = req.params;
  const { isGroup = false } = req.query;
  try {
    let response;
    for (const contato of (0, _functions.contactToArray)(phone, isGroup)) {
      response = await req.client.getProfilePicFromServer(contato);
    }

    return res.status(200).json({ status: 'success', response: response });
  } catch (error) {
    req.logger.error(error);
    return res.status(500).json({
      status: 'error',
      message: 'Error on  get profile pic',
      error: error
    });
  }
}

async function getStatus(req, res) {
  /**
     #swagger.tags = ["Contact"]
     #swagger.autoBody=false
     #swagger.security = [{
            "bearerAuth": []
     }]
     #swagger.parameters["session"] = {
      schema: 'NERDWHATS_AMERICA'
     }
     #swagger.parameters["phone"] = {
      schema: '5521999999999'
     }
   */
  const { phone = true } = req.params;
  try {
    let response;
    for (const contato of (0, _functions.contactToArray)(phone, false)) {
      response = await req.client.getStatus(contato);
    }
    return res.status(200).json({ status: 'success', response: response });
  } catch (error) {
    req.logger.error(error);
    return res.
    status(500).
    json({ status: 'error', message: 'Error on  get status', error: error });
  }
}

async function setProfileStatus(req, res) {
  /**
     #swagger.tags = ["Profile"]
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
        $status: 'My new status',
      }
     }
     
     #swagger.requestBody = {
      required: true,
      "@content": {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              status: { type: "string" },
            }
          },
          examples: {
            "Default": {
              value: {
                status: "My new status",
              }
            },
          }
        }
      }
     }
   */
  const { status } = req.body;
  try {
    const response = await req.client.setProfileStatus(status);

    return res.status(200).json({ status: 'success', response: response });
  } catch (e) {
    req.logger.error(e);
    return res.
    status(500).
    json({ status: 'error', message: 'Error on set profile status' });
  }
}
async function rejectCall(req, res) {
  /**
     #swagger.tags = ["Misc"]
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
              callId: { type: "string" },
            }
          },
          examples: {
            "Default": {
              value: {
                callId: "<callid>",
              }
            },
          }
        }
      }
     }
   */
  const { callId } = req.body;
  try {
    const response = await req.client.rejectCall(callId);

    return res.status(200).json({ status: 'success', response: response });
  } catch (e) {
    req.logger.error(e);
    return res.
    status(500).
    json({ status: 'error', message: 'Error on rejectCall', error: e });
  }
}

async function starMessage(req, res) {
  /**
     #swagger.tags = ["Messages"]
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
              messageId: { type: "string" },
              star: { type: "boolean" },
            }
          },
          examples: {
            "Default": {
              value: {
                messageId: "5521999999999",
                star: true,
              }
            },
          }
        }
      }
     }
   */
  const { messageId, star = true } = req.body;
  try {
    const response = await req.client.starMessage(messageId, star);

    return res.status(200).json({ status: 'success', response: response });
  } catch (error) {
    req.logger.error(error);
    return res.status(500).json({
      status: 'error',
      message: 'Error on  start message',
      error: error
    });
  }
}

async function getReactions(req, res) {
  /**
     #swagger.tags = ["Messages"]
     #swagger.autoBody=false
     #swagger.security = [{
            "bearerAuth": []
     }]
     #swagger.parameters["session"] = {
      schema: 'NERDWHATS_AMERICA'
     }
     #swagger.parameters["messageId"] = {
      schema: '<messageId>'
     }
   */
  const messageId = req.params.id;
  try {
    const response = await req.client.getReactions(messageId);

    return res.status(200).json({ status: 'success', response: response });
  } catch (error) {
    req.logger.error(error);
    return res.status(500).json({
      status: 'error',
      message: 'Error on get reactions',
      error: error
    });
  }
}

async function getVotes(req, res) {
  /**
     #swagger.tags = ["Messages"]
     #swagger.autoBody=false
     #swagger.security = [{
            "bearerAuth": []
     }]
     #swagger.parameters["session"] = {
      schema: 'NERDWHATS_AMERICA'
     }
     #swagger.parameters["messageId"] = {
      schema: '<messageId>'
     }
   */
  const messageId = req.params.id;
  try {
    const response = await req.client.getVotes(messageId);

    return res.status(200).json({ status: 'success', response: response });
  } catch (error) {
    req.logger.error(error);
    return res.
    status(500).
    json({ status: 'error', message: 'Error on get votes', error: error });
  }
}
async function chatWoot(req, res) {
  /**
     #swagger.tags = ["Misc"]
     #swagger.description = 'You can point your Chatwoot to this route so that it can perform functions.'
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
              event: { type: "string" },
              private: { type: "string" },
            }
          },
          examples: {
            "Default": {
              value: {
                messageId: "conversation_status_changed",
                private: "false",
              }
            },
          }
        }
      }
     }
   */
  const { session } = req.params;
  const client = _sessionUtil.clientsArray[session];
  if (client == null || client.status !== 'CONNECTED') return;
  try {
    if (await client.isConnected()) {
      const event = req.body.event;

      if (
      event == 'conversation_status_changed' ||
      event == 'conversation_resolved' ||
      req.body.private)
      {
        return res.
        status(200).
        json({ status: 'success', message: 'Success on receive chatwoot' });
      }

      const {
        message_type,
        phone = req.body.conversation.meta.sender.phone_number.replace('+', ''),
        message = req.body.conversation.messages[0]
      } = req.body;

      if (event != 'message_created' && message_type != 'outgoing')
      return res.status(200);
      for (const contato of (0, _functions.contactToArray)(phone, false)) {
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
      return res.
      status(200).
      json({ status: 'success', message: 'Success on  receive chatwoot' });
    }
  } catch (e) {
    console.log(e);
    return res.status(400).json({
      status: 'error',
      message: 'Error on  receive chatwoot',
      error: e
    });
  }
}
async function getPlatformFromMessage(req, res) {
  /**
   * #swagger.tags = ["Misc"]
     #swagger.autoBody=false
     #swagger.security = [{
            "bearerAuth": []
     }]
     #swagger.parameters["session"] = {
      schema: 'NERDWHATS_AMERICA'
     }
     #swagger.parameters["messageId"] = {
      schema: '<messageId>'
     }
   */
  try {
    const result = await req.client.getPlatformFromMessage(
      req.params.messageId
    );
    return res.status(200).json(result);
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({
      status: 'error',
      message: 'Error on get get platform from message',
      error: e
    });
  }
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfZnVuY3Rpb25zIiwicmVxdWlyZSIsIl9zZXNzaW9uVXRpbCIsInJldHVyblN1Y2VzcyIsInJlcyIsInNlc3Npb24iLCJwaG9uZSIsImRhdGEiLCJzdGF0dXMiLCJqc29uIiwicmVzcG9uc2UiLCJtZXNzYWdlIiwiY29udGFjdCIsInJldHVybkVycm9yIiwicmVxIiwiZXJyb3IiLCJsb2dnZXIiLCJsb2ciLCJzZXRQcm9maWxlTmFtZSIsIm5hbWUiLCJib2R5IiwicmVzdWx0IiwiY2xpZW50Iiwic2hvd0FsbENvbnRhY3RzIiwiY29udGFjdHMiLCJnZXRBbGxDb250YWN0cyIsImdldEFsbENoYXRzIiwibWFwcGVyIiwiZSIsImxpc3RDaGF0cyIsImlkIiwiY291bnQiLCJkaXJlY3Rpb24iLCJvbmx5R3JvdXBzIiwib25seVVzZXJzIiwib25seVdpdGhVbnJlYWRNZXNzYWdlIiwid2l0aExhYmVscyIsImdldEFsbENoYXRzV2l0aE1lc3NhZ2VzIiwiZ2V0QWxsTWVzc2FnZXNJbkNoYXQiLCJwYXJhbXMiLCJpc0dyb3VwIiwiaW5jbHVkZU1lIiwiaW5jbHVkZU5vdGlmaWNhdGlvbnMiLCJxdWVyeSIsImNvbnRhdG8iLCJjb250YWN0VG9BcnJheSIsImdldEFsbE5ld01lc3NhZ2VzIiwiZ2V0QWxsVW5yZWFkTWVzc2FnZXMiLCJnZXRDaGF0QnlJZCIsImdldE1lc3NhZ2VCeUlkIiwibWVzc2FnZUlkIiwiY2hhdElkIiwidXNlciIsImdldEJhdHRlcnlMZXZlbCIsImdldEhvc3REZXZpY2UiLCJwaG9uZU51bWJlciIsImdldFdpZCIsImdldFBob25lTnVtYmVyIiwiZ2V0QmxvY2tMaXN0IiwiYmxvY2tlZCIsIm1hcCIsInNwbGl0IiwiZGVsZXRlQ2hhdCIsInJlc3VsdHMiLCJkZWxldGVBbGxDaGF0cyIsImNoYXRzIiwiY2hhdCIsImNsZWFyQ2hhdCIsImNsZWFyQWxsQ2hhdHMiLCJhcmNoaXZlQ2hhdCIsInZhbHVlIiwiYXJjaGl2ZUFsbENoYXRzIiwiZ2V0QWxsQ2hhdHNBcmNoaXZlZHMiLCJhcmNoaXZlZCIsImFyY2hpdmUiLCJwdXNoIiwiZGVsZXRlTWVzc2FnZSIsInJlYWN0TWVzc2FnZSIsIm1zZ0lkIiwicmVhY3Rpb24iLCJzZW5kUmVhY3Rpb25Ub01lc3NhZ2UiLCJyZXBseSIsInRleHQiLCJtZXNzYWdlaWQiLCJmb3J3YXJkTWVzc2FnZXMiLCJmb3J3YXJkTWVzc2FnZSIsIm1hcmtVbnNlZW5NZXNzYWdlIiwiYmxvY2tDb250YWN0IiwidW5ibG9ja0NvbnRhY3QiLCJwaW5DaGF0Iiwic3RhdGUiLCJzZXRQcm9maWxlUGljIiwiZmlsZSIsInBhdGgiLCJwYXRoRmlsZSIsInVubGlua0FzeW5jIiwiZ2V0VW5yZWFkTWVzc2FnZXMiLCJnZXRDaGF0SXNPbmxpbmUiLCJnZXRMYXN0U2VlbiIsImdldExpc3RNdXRlcyIsInR5cGUiLCJsb2FkQW5kR2V0QWxsTWVzc2FnZXNJbkNoYXQiLCJnZXRNZXNzYWdlcyIsInBhcnNlSW50IiwidG9TdHJpbmciLCJzZW5kQ29udGFjdFZjYXJkIiwiY29udGFjdHNJZCIsInNlbmRNdXRlIiwidGltZSIsInNlbmRTZWVuIiwic2V0Q2hhdFN0YXRlIiwiY2hhdHN0YXRlIiwic2V0VGVtcG9yYXJ5TWVzc2FnZXMiLCJzZXRUeXBpbmciLCJzdGFydFR5cGluZyIsInN0b3BUeXBpbmciLCJzZXRSZWNvcmRpbmciLCJkdXJhdGlvbiIsInN0YXJ0UmVjb3JkaW5nIiwic3RvcFJlY29yaW5nIiwiY2hlY2tOdW1iZXJTdGF0dXMiLCJnZXRDb250YWN0IiwiZ2V0TnVtYmVyUHJvZmlsZSIsImdldFByb2ZpbGVQaWNGcm9tU2VydmVyIiwiZ2V0U3RhdHVzIiwic2V0UHJvZmlsZVN0YXR1cyIsInJlamVjdENhbGwiLCJjYWxsSWQiLCJzdGFyTWVzc2FnZSIsInN0YXIiLCJnZXRSZWFjdGlvbnMiLCJnZXRWb3RlcyIsImNoYXRXb290IiwiY2xpZW50c0FycmF5IiwiaXNDb25uZWN0ZWQiLCJldmVudCIsInByaXZhdGUiLCJtZXNzYWdlX3R5cGUiLCJjb252ZXJzYXRpb24iLCJtZXRhIiwic2VuZGVyIiwicGhvbmVfbnVtYmVyIiwicmVwbGFjZSIsIm1lc3NhZ2VzIiwiYXR0YWNobWVudHMiLCJiYXNlX3VybCIsImNvbmZpZyIsImJhc2VVUkwiLCJkYXRhX3VybCIsInN1YnN0cmluZyIsImluZGV4T2YiLCJzZW5kRmlsZSIsImNvbnRlbnQiLCJzZW5kVGV4dCIsImNvbnNvbGUiLCJnZXRQbGF0Zm9ybUZyb21NZXNzYWdlIl0sInNvdXJjZXMiOlsiLi4vLi4vc3JjL2NvbnRyb2xsZXIvZGV2aWNlQ29udHJvbGxlci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKlxyXG4gKiBDb3B5cmlnaHQgMjAyMSBXUFBDb25uZWN0IFRlYW1cclxuICpcclxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcclxuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxyXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcclxuICpcclxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxyXG4gKlxyXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXHJcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcclxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXHJcbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcclxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXHJcbiAqL1xyXG5pbXBvcnQgeyBDaGF0IH0gZnJvbSAnQHdwcGNvbm5lY3QtdGVhbS93cHBjb25uZWN0JztcclxuaW1wb3J0IHsgUmVxdWVzdCwgUmVzcG9uc2UgfSBmcm9tICdleHByZXNzJztcclxuXHJcbmltcG9ydCB7IGNvbnRhY3RUb0FycmF5LCB1bmxpbmtBc3luYyB9IGZyb20gJy4uL3V0aWwvZnVuY3Rpb25zJztcclxuaW1wb3J0IHsgY2xpZW50c0FycmF5IH0gZnJvbSAnLi4vdXRpbC9zZXNzaW9uVXRpbCc7XHJcblxyXG5mdW5jdGlvbiByZXR1cm5TdWNlc3MocmVzOiBhbnksIHNlc3Npb246IGFueSwgcGhvbmU6IGFueSwgZGF0YTogYW55KSB7XHJcbiAgcmVzLnN0YXR1cygyMDEpLmpzb24oe1xyXG4gICAgc3RhdHVzOiAnU3VjY2VzcycsXHJcbiAgICByZXNwb25zZToge1xyXG4gICAgICBtZXNzYWdlOiAnSW5mb3JtYXRpb24gcmV0cmlldmVkIHN1Y2Nlc3NmdWxseS4nLFxyXG4gICAgICBjb250YWN0OiBwaG9uZSxcclxuICAgICAgc2Vzc2lvbjogc2Vzc2lvbixcclxuICAgICAgZGF0YTogZGF0YSxcclxuICAgIH0sXHJcbiAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJldHVybkVycm9yKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSwgc2Vzc2lvbjogYW55LCBlcnJvcjogYW55KSB7XHJcbiAgcmVxLmxvZ2dlci5lcnJvcihlcnJvcik7XHJcbiAgcmVzLnN0YXR1cyg0MDApLmpzb24oe1xyXG4gICAgc3RhdHVzOiAnRXJyb3InLFxyXG4gICAgcmVzcG9uc2U6IHtcclxuICAgICAgbWVzc2FnZTogJ0Vycm9yIHJldHJpZXZpbmcgaW5mb3JtYXRpb24nLFxyXG4gICAgICBzZXNzaW9uOiBzZXNzaW9uLFxyXG4gICAgICBsb2c6IGVycm9yLFxyXG4gICAgfSxcclxuICB9KTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNldFByb2ZpbGVOYW1lKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSkge1xyXG4gIC8qKlxyXG4gICAqICNzd2FnZ2VyLnRhZ3MgPSBbXCJQcm9maWxlXCJdXHJcbiAgICAgI3N3YWdnZXIuYXV0b0JvZHk9ZmFsc2VcclxuICAgICAjc3dhZ2dlci5zZWN1cml0eSA9IFt7XHJcbiAgICAgICAgICAgIFwiYmVhcmVyQXV0aFwiOiBbXVxyXG4gICAgIH1dXHJcbiAgICAgI3N3YWdnZXIucGFyYW1ldGVyc1tcInNlc3Npb25cIl0gPSB7XHJcbiAgICAgIHNjaGVtYTogJ05FUkRXSEFUU19BTUVSSUNBJ1xyXG4gICAgIH1cclxuICAgICAjc3dhZ2dlci5yZXF1ZXN0Qm9keSA9IHtcclxuICAgICAgcmVxdWlyZWQ6IGZhbHNlLFxyXG4gICAgICBcIkBjb250ZW50XCI6IHtcclxuICAgICAgICBcImFwcGxpY2F0aW9uL2pzb25cIjoge1xyXG4gICAgICAgICAgc2NoZW1hOiB7XHJcbiAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICBuYW1lOiB7IHR5cGU6IFwic3RyaW5nXCIgfSxcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIGV4YW1wbGVzOiB7XHJcbiAgICAgICAgICAgIFwiRGVmYXVsdFwiOiB7XHJcbiAgICAgICAgICAgICAgdmFsdWU6IHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwiTXkgbmV3IG5hbWVcIixcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgfVxyXG4gICAqL1xyXG4gIGNvbnN0IHsgbmFtZSB9ID0gcmVxLmJvZHk7XHJcblxyXG4gIGlmICghbmFtZSlcclxuICAgIHJldHVybiByZXNcclxuICAgICAgLnN0YXR1cyg0MDApXHJcbiAgICAgIC5qc29uKHsgc3RhdHVzOiAnZXJyb3InLCBtZXNzYWdlOiAnUGFyYW1ldGVyIG5hbWUgaXMgcmVxdWlyZWQhJyB9KTtcclxuXHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHJlcS5jbGllbnQuc2V0UHJvZmlsZU5hbWUobmFtZSk7XHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oeyBzdGF0dXM6ICdzdWNjZXNzJywgcmVzcG9uc2U6IHJlc3VsdCB9KTtcclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgcmVxLmxvZ2dlci5lcnJvcihlcnJvcik7XHJcbiAgICByZXMuc3RhdHVzKDUwMCkuanNvbih7XHJcbiAgICAgIHN0YXR1czogJ2Vycm9yJyxcclxuICAgICAgbWVzc2FnZTogJ0Vycm9yIG9uIHNldCBwcm9maWxlIG5hbWUuJyxcclxuICAgICAgZXJyb3I6IGVycm9yLFxyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2hvd0FsbENvbnRhY3RzKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSkge1xyXG4gIC8qKlxyXG4gICAqICNzd2FnZ2VyLnRhZ3MgPSBbXCJDb250YWN0c1wiXVxyXG4gICAgICNzd2FnZ2VyLmF1dG9Cb2R5PWZhbHNlXHJcbiAgICAgI3N3YWdnZXIuc2VjdXJpdHkgPSBbe1xyXG4gICAgICAgICAgICBcImJlYXJlckF1dGhcIjogW11cclxuICAgICB9XVxyXG4gICAgICNzd2FnZ2VyLnBhcmFtZXRlcnNbXCJzZXNzaW9uXCJdID0ge1xyXG4gICAgICBzY2hlbWE6ICdORVJEV0hBVFNfQU1FUklDQSdcclxuICAgICB9XHJcbiAgICovXHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IGNvbnRhY3RzID0gYXdhaXQgcmVxLmNsaWVudC5nZXRBbGxDb250YWN0cygpO1xyXG4gICAgcmVzLnN0YXR1cygyMDApLmpzb24oeyBzdGF0dXM6ICdzdWNjZXNzJywgcmVzcG9uc2U6IGNvbnRhY3RzIH0pO1xyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICByZXEubG9nZ2VyLmVycm9yKGVycm9yKTtcclxuICAgIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgc3RhdHVzOiAnZXJyb3InLFxyXG4gICAgICBtZXNzYWdlOiAnRXJyb3IgZmV0Y2hpbmcgY29udGFjdHMnLFxyXG4gICAgICBlcnJvcjogZXJyb3IsXHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRBbGxDaGF0cyhyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpIHtcclxuICAvKipcclxuICAgKiAjc3dhZ2dlci50YWdzID0gW1wiQ2hhdFwiXVxyXG4gICAqICNzd2FnZ2VyLnN1bW1hcnkgPSAnRGVwcmVjYXRlZCBpbiBmYXZvciBvZiAnbGlzdC1jaGF0cydcclxuICAgKiAjc3dhZ2dlci5kZXByZWNhdGVkID0gdHJ1ZVxyXG4gICAgICNzd2FnZ2VyLmF1dG9Cb2R5PWZhbHNlXHJcbiAgICAgI3N3YWdnZXIuc2VjdXJpdHkgPSBbe1xyXG4gICAgICAgICAgICBcImJlYXJlckF1dGhcIjogW11cclxuICAgICB9XVxyXG4gICAgICNzd2FnZ2VyLnBhcmFtZXRlcnNbXCJzZXNzaW9uXCJdID0ge1xyXG4gICAgICBzY2hlbWE6ICdORVJEV0hBVFNfQU1FUklDQSdcclxuICAgICB9XHJcbiAgICovXHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgcmVxLmNsaWVudC5nZXRBbGxDaGF0cygpO1xyXG4gICAgcmV0dXJuIHJlc1xyXG4gICAgICAuc3RhdHVzKDIwMClcclxuICAgICAgLmpzb24oeyBzdGF0dXM6ICdzdWNjZXNzJywgcmVzcG9uc2U6IHJlc3BvbnNlLCBtYXBwZXI6ICdjaGF0JyB9KTtcclxuICB9IGNhdGNoIChlKSB7XHJcbiAgICByZXEubG9nZ2VyLmVycm9yKGUpO1xyXG4gICAgcmV0dXJuIHJlc1xyXG4gICAgICAuc3RhdHVzKDUwMClcclxuICAgICAgLmpzb24oeyBzdGF0dXM6ICdlcnJvcicsIG1lc3NhZ2U6ICdFcnJvciBvbiBnZXQgYWxsIGNoYXRzJyB9KTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBsaXN0Q2hhdHMocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKSB7XHJcbiAgLyoqXHJcbiAgICogI3N3YWdnZXIudGFncyA9IFtcIkNoYXRcIl1cclxuICAgKiAjc3dhZ2dlci5zdW1tYXJ5ID0gJ1JldHJpZXZlIGEgbGlzdCBvZiBjaGF0cydcclxuICAgKiAjc3dhZ2dlci5kZXNjcmlwdGlvbiA9ICdUaGlzIGJvZHkgaXMgbm90IHJlcXVpcmVkLiBOb3Qgc2VudCBib2R5IHRvIGdldCBhbGwgY2hhdHMgb3IgZmlsdGVyLidcclxuICAgICAjc3dhZ2dlci5zZWN1cml0eSA9IFt7XHJcbiAgICAgICAgICAgIFwiYmVhcmVyQXV0aFwiOiBbXVxyXG4gICAgIH1dXHJcbiAgICAgI3N3YWdnZXIucGFyYW1ldGVyc1tcInNlc3Npb25cIl0gPSB7XHJcbiAgICAgIHNjaGVtYTogJ05FUkRXSEFUU19BTUVSSUNBJ1xyXG4gICAgIH1cclxuICAgICAjc3dhZ2dlci5yZXF1ZXN0Qm9keSA9IHtcclxuICAgICAgcmVxdWlyZWQ6IGZhbHNlLFxyXG4gICAgICBcIkBjb250ZW50XCI6IHtcclxuICAgICAgICBcImFwcGxpY2F0aW9uL2pzb25cIjoge1xyXG4gICAgICAgICAgc2NoZW1hOiB7XHJcbiAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICBpZDogeyB0eXBlOiBcInN0cmluZ1wiIH0sXHJcbiAgICAgICAgICAgICAgY291bnQ6IHsgdHlwZTogXCJudW1iZXJcIiB9LFxyXG4gICAgICAgICAgICAgIGRpcmVjdGlvbjogeyB0eXBlOiBcInN0cmluZ1wiIH0sXHJcbiAgICAgICAgICAgICAgb25seUdyb3VwczogeyB0eXBlOiBcImJvb2xlYW5cIiB9LFxyXG4gICAgICAgICAgICAgIG9ubHlVc2VyczogeyB0eXBlOiBcImJvb2xlYW5cIiB9LFxyXG4gICAgICAgICAgICAgIG9ubHlXaXRoVW5yZWFkTWVzc2FnZTogeyB0eXBlOiBcImJvb2xlYW5cIiB9LFxyXG4gICAgICAgICAgICAgIHdpdGhMYWJlbHM6IHsgdHlwZTogXCJhcnJheVwiIH0sXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICBleGFtcGxlczoge1xyXG4gICAgICAgICAgICBcIkFsbCBvcHRpb25zIC0gRWRpdCB0aGlzXCI6IHtcclxuICAgICAgICAgICAgICB2YWx1ZToge1xyXG4gICAgICAgICAgICAgICAgaWQ6IFwiPGNoYXRJZD5cIixcclxuICAgICAgICAgICAgICAgIGNvdW50OiAyMCxcclxuICAgICAgICAgICAgICAgIGRpcmVjdGlvbjogXCJhZnRlclwiLFxyXG4gICAgICAgICAgICAgICAgb25seUdyb3VwczogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICBvbmx5VXNlcnM6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgb25seVdpdGhVbnJlYWRNZXNzYWdlOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgIHdpdGhMYWJlbHM6IFtdXHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBcIkFsbCBjaGF0c1wiOiB7XHJcbiAgICAgICAgICAgICAgdmFsdWU6IHtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFwiQ2hhdHMgZ3JvdXBcIjoge1xyXG4gICAgICAgICAgICAgIHZhbHVlOiB7XHJcbiAgICAgICAgICAgICAgICBvbmx5R3JvdXBzOiB0cnVlLFxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgXCJPbmx5IHdpdGggdW5yZWFkIG1lc3NhZ2VzXCI6IHtcclxuICAgICAgICAgICAgICB2YWx1ZToge1xyXG4gICAgICAgICAgICAgICAgb25seVdpdGhVbnJlYWRNZXNzYWdlOiBmYWxzZSxcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFwiUGFnaW5hdGVkIHJlc3VsdHNcIjoge1xyXG4gICAgICAgICAgICAgIHZhbHVlOiB7XHJcbiAgICAgICAgICAgICAgICBpZDogXCI8Y2hhdElkPlwiLFxyXG4gICAgICAgICAgICAgICAgY291bnQ6IDIwLFxyXG4gICAgICAgICAgICAgICAgZGlyZWN0aW9uOiBcImFmdGVyXCIsXHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgIH1cclxuICAgKi9cclxuICB0cnkge1xyXG4gICAgY29uc3Qge1xyXG4gICAgICBpZCxcclxuICAgICAgY291bnQsXHJcbiAgICAgIGRpcmVjdGlvbixcclxuICAgICAgb25seUdyb3VwcyxcclxuICAgICAgb25seVVzZXJzLFxyXG4gICAgICBvbmx5V2l0aFVucmVhZE1lc3NhZ2UsXHJcbiAgICAgIHdpdGhMYWJlbHMsXHJcbiAgICB9ID0gcmVxLmJvZHk7XHJcblxyXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCByZXEuY2xpZW50Lmxpc3RDaGF0cyh7XHJcbiAgICAgIGlkOiBpZCxcclxuICAgICAgY291bnQ6IGNvdW50LFxyXG4gICAgICBkaXJlY3Rpb246IGRpcmVjdGlvbixcclxuICAgICAgb25seUdyb3Vwczogb25seUdyb3VwcyxcclxuICAgICAgb25seVVzZXJzOiBvbmx5VXNlcnMsXHJcbiAgICAgIG9ubHlXaXRoVW5yZWFkTWVzc2FnZTogb25seVdpdGhVbnJlYWRNZXNzYWdlLFxyXG4gICAgICB3aXRoTGFiZWxzOiB3aXRoTGFiZWxzLFxyXG4gICAgfSk7XHJcblxyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHJlc3BvbnNlKTtcclxuICB9IGNhdGNoIChlKSB7XHJcbiAgICByZXEubG9nZ2VyLmVycm9yKGUpO1xyXG4gICAgcmV0dXJuIHJlc1xyXG4gICAgICAuc3RhdHVzKDUwMClcclxuICAgICAgLmpzb24oeyBzdGF0dXM6ICdlcnJvcicsIG1lc3NhZ2U6ICdFcnJvciBvbiBnZXQgYWxsIGNoYXRzJyB9KTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRBbGxDaGF0c1dpdGhNZXNzYWdlcyhyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpIHtcclxuICAvKipcclxuICAgKiAjc3dhZ2dlci50YWdzID0gW1wiQ2hhdFwiXVxyXG4gICAqICNzd2FnZ2VyLnN1bW1hcnkgPSAnRGVwcmVjYXRlZCBpbiBmYXZvciBvZiBsaXN0LWNoYXRzJ1xyXG4gICAqICNzd2FnZ2VyLmRlcHJlY2F0ZWQgPSB0cnVlXHJcbiAgICAgI3N3YWdnZXIuYXV0b0JvZHk9ZmFsc2VcclxuICAgICAjc3dhZ2dlci5zZWN1cml0eSA9IFt7XHJcbiAgICAgICAgICAgIFwiYmVhcmVyQXV0aFwiOiBbXVxyXG4gICAgIH1dXHJcbiAgICAgI3N3YWdnZXIucGFyYW1ldGVyc1tcInNlc3Npb25cIl0gPSB7XHJcbiAgICAgIHNjaGVtYTogJ05FUkRXSEFUU19BTUVSSUNBJ1xyXG4gICAgIH1cclxuICAgKi9cclxuICB0cnkge1xyXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCByZXEuY2xpZW50LmdldEFsbENoYXRzV2l0aE1lc3NhZ2VzKCk7XHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oeyBzdGF0dXM6ICdzdWNjZXNzJywgcmVzcG9uc2U6IHJlc3BvbnNlIH0pO1xyXG4gIH0gY2F0Y2ggKGUpIHtcclxuICAgIHJlcS5sb2dnZXIuZXJyb3IoZSk7XHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oe1xyXG4gICAgICBzdGF0dXM6ICdlcnJvcicsXHJcbiAgICAgIG1lc3NhZ2U6ICdFcnJvciBvbiBnZXQgYWxsIGNoYXRzIHdoaXQgbWVzc2FnZXMnLFxyXG4gICAgICBlcnJvcjogZSxcclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG4vKipcclxuICogRGVwcmVjaWFkbyBlbSBmYXZvciBkZSBnZXRNZXNzYWdlc1xyXG4gKi9cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldEFsbE1lc3NhZ2VzSW5DaGF0KHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSkge1xyXG4gIC8qKlxyXG4gICAqICNzd2FnZ2VyLnRhZ3MgPSBbXCJDaGF0XCJdXHJcbiAgICAgI3N3YWdnZXIuYXV0b0JvZHk9ZmFsc2VcclxuICAgICAjc3dhZ2dlci5zZWN1cml0eSA9IFt7XHJcbiAgICAgICAgICAgIFwiYmVhcmVyQXV0aFwiOiBbXVxyXG4gICAgIH1dXHJcbiAgICAgI3N3YWdnZXIucGFyYW1ldGVyc1tcInNlc3Npb25cIl0gPSB7XHJcbiAgICAgIHNjaGVtYTogJ05FUkRXSEFUU19BTUVSSUNBJ1xyXG4gICAgIH1cclxuICAgICAjc3dhZ2dlci5wYXJhbWV0ZXJzW1wicGhvbmVcIl0gPSB7XHJcbiAgICAgIHNjaGVtYTogJzU1MjE5OTk5OTk5OTknXHJcbiAgICAgfVxyXG4gICAgICNzd2FnZ2VyLnBhcmFtZXRlcnNbXCJpc0dyb3VwXCJdID0ge1xyXG4gICAgICBzY2hlbWE6ICdmYWxzZSdcclxuICAgICB9XHJcbiAgICAgI3N3YWdnZXIucGFyYW1ldGVyc1tcImluY2x1ZGVNZVwiXSA9IHtcclxuICAgICAgc2NoZW1hOiAndHJ1ZSdcclxuICAgICB9XHJcbiAgICAgI3N3YWdnZXIucGFyYW1ldGVyc1tcImluY2x1ZGVOb3RpZmljYXRpb25zXCJdID0ge1xyXG4gICAgICBzY2hlbWE6ICd0cnVlJ1xyXG4gICAgIH1cclxuICAgKi9cclxuICB0cnkge1xyXG4gICAgY29uc3QgeyBwaG9uZSB9ID0gcmVxLnBhcmFtcztcclxuICAgIGNvbnN0IHtcclxuICAgICAgaXNHcm91cCA9IGZhbHNlLFxyXG4gICAgICBpbmNsdWRlTWUgPSB0cnVlLFxyXG4gICAgICBpbmNsdWRlTm90aWZpY2F0aW9ucyA9IHRydWUsXHJcbiAgICB9ID0gcmVxLnF1ZXJ5O1xyXG5cclxuICAgIGxldCByZXNwb25zZTtcclxuICAgIGZvciAoY29uc3QgY29udGF0byBvZiBjb250YWN0VG9BcnJheShwaG9uZSwgaXNHcm91cCBhcyBib29sZWFuKSkge1xyXG4gICAgICByZXNwb25zZSA9IGF3YWl0IHJlcS5jbGllbnQuZ2V0QWxsTWVzc2FnZXNJbkNoYXQoXHJcbiAgICAgICAgY29udGF0byxcclxuICAgICAgICBpbmNsdWRlTWUgYXMgYm9vbGVhbixcclxuICAgICAgICBpbmNsdWRlTm90aWZpY2F0aW9ucyBhcyBib29sZWFuXHJcbiAgICAgICk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHsgc3RhdHVzOiAnc3VjY2VzcycsIHJlc3BvbnNlOiByZXNwb25zZSB9KTtcclxuICB9IGNhdGNoIChlKSB7XHJcbiAgICByZXEubG9nZ2VyLmVycm9yKGUpO1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgc3RhdHVzOiAnZXJyb3InLFxyXG4gICAgICBtZXNzYWdlOiAnRXJyb3Igb24gZ2V0IGFsbCBtZXNzYWdlcyBpbiBjaGF0JyxcclxuICAgICAgZXJyb3I6IGUsXHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRBbGxOZXdNZXNzYWdlcyhyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpIHtcclxuICAvKipcclxuICAgKiAjc3dhZ2dlci50YWdzID0gW1wiQ2hhdFwiXVxyXG4gICAgICNzd2FnZ2VyLmF1dG9Cb2R5PWZhbHNlXHJcbiAgICAgI3N3YWdnZXIuc2VjdXJpdHkgPSBbe1xyXG4gICAgICAgICAgICBcImJlYXJlckF1dGhcIjogW11cclxuICAgICB9XVxyXG4gICAgICNzd2FnZ2VyLnBhcmFtZXRlcnNbXCJzZXNzaW9uXCJdID0ge1xyXG4gICAgICBzY2hlbWE6ICdORVJEV0hBVFNfQU1FUklDQSdcclxuICAgICB9XHJcbiAgICovXHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgcmVxLmNsaWVudC5nZXRBbGxOZXdNZXNzYWdlcygpO1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHsgc3RhdHVzOiAnc3VjY2VzcycsIHJlc3BvbnNlOiByZXNwb25zZSB9KTtcclxuICB9IGNhdGNoIChlKSB7XHJcbiAgICByZXEubG9nZ2VyLmVycm9yKGUpO1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgc3RhdHVzOiAnZXJyb3InLFxyXG4gICAgICBtZXNzYWdlOiAnRXJyb3Igb24gZ2V0IGFsbCBtZXNzYWdlcyBpbiBjaGF0JyxcclxuICAgICAgZXJyb3I6IGUsXHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRBbGxVbnJlYWRNZXNzYWdlcyhyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpIHtcclxuICAvKipcclxuICAgKiAjc3dhZ2dlci50YWdzID0gW1wiQ2hhdFwiXVxyXG4gICAgICNzd2FnZ2VyLmF1dG9Cb2R5PWZhbHNlXHJcbiAgICAgI3N3YWdnZXIuc2VjdXJpdHkgPSBbe1xyXG4gICAgICAgICAgICBcImJlYXJlckF1dGhcIjogW11cclxuICAgICB9XVxyXG4gICAgICNzd2FnZ2VyLnBhcmFtZXRlcnNbXCJzZXNzaW9uXCJdID0ge1xyXG4gICAgICBzY2hlbWE6ICdORVJEV0hBVFNfQU1FUklDQSdcclxuICAgICB9XHJcbiAgICovXHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgcmVxLmNsaWVudC5nZXRBbGxVbnJlYWRNZXNzYWdlcygpO1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHsgc3RhdHVzOiAnc3VjY2VzcycsIHJlc3BvbnNlOiByZXNwb25zZSB9KTtcclxuICB9IGNhdGNoIChlKSB7XHJcbiAgICByZXEubG9nZ2VyLmVycm9yKGUpO1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgc3RhdHVzOiAnZXJyb3InLFxyXG4gICAgICBtZXNzYWdlOiAnRXJyb3Igb24gZ2V0IGFsbCBtZXNzYWdlcyBpbiBjaGF0JyxcclxuICAgICAgZXJyb3I6IGUsXHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRDaGF0QnlJZChyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpIHtcclxuICAvKipcclxuICAgKiAjc3dhZ2dlci50YWdzID0gW1wiQ2hhdFwiXVxyXG4gICAgICNzd2FnZ2VyLmF1dG9Cb2R5PWZhbHNlXHJcbiAgICAgI3N3YWdnZXIuc2VjdXJpdHkgPSBbe1xyXG4gICAgICAgICAgICBcImJlYXJlckF1dGhcIjogW11cclxuICAgICB9XVxyXG4gICAgICNzd2FnZ2VyLnBhcmFtZXRlcnNbXCJzZXNzaW9uXCJdID0ge1xyXG4gICAgICBzY2hlbWE6ICdORVJEV0hBVFNfQU1FUklDQSdcclxuICAgICB9XHJcbiAgICAgI3N3YWdnZXIucGFyYW1ldGVyc1tcInBob25lXCJdID0ge1xyXG4gICAgICBzY2hlbWE6ICc1NTIxOTk5OTk5OTk5J1xyXG4gICAgIH1cclxuICAgICAjc3dhZ2dlci5wYXJhbWV0ZXJzW1wiaXNHcm91cFwiXSA9IHtcclxuICAgICAgc2NoZW1hOiAnZmFsc2UnXHJcbiAgICAgfVxyXG4gICAqL1xyXG4gIGNvbnN0IHsgcGhvbmUgfSA9IHJlcS5wYXJhbXM7XHJcbiAgY29uc3QgeyBpc0dyb3VwIH0gPSByZXEucXVlcnk7XHJcblxyXG4gIHRyeSB7XHJcbiAgICBsZXQgcmVzdWx0ID0ge30gYXMgQ2hhdDtcclxuICAgIGlmIChpc0dyb3VwKSB7XHJcbiAgICAgIHJlc3VsdCA9IGF3YWl0IHJlcS5jbGllbnQuZ2V0Q2hhdEJ5SWQoYCR7cGhvbmV9QGcudXNgKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJlc3VsdCA9IGF3YWl0IHJlcS5jbGllbnQuZ2V0Q2hhdEJ5SWQoYCR7cGhvbmV9QGMudXNgKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24ocmVzdWx0KTtcclxuICB9IGNhdGNoIChlKSB7XHJcbiAgICByZXEubG9nZ2VyLmVycm9yKGUpO1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgc3RhdHVzOiAnZXJyb3InLFxyXG4gICAgICBtZXNzYWdlOiAnRXJyb3IgY2hhbmdpbmcgY2hhdCBieSBJZCcsXHJcbiAgICAgIGVycm9yOiBlLFxyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0TWVzc2FnZUJ5SWQocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKSB7XHJcbiAgLyoqXHJcbiAgICogI3N3YWdnZXIudGFncyA9IFtcIkNoYXRcIl1cclxuICAgICAjc3dhZ2dlci5hdXRvQm9keT1mYWxzZVxyXG4gICAgICNzd2FnZ2VyLnNlY3VyaXR5ID0gW3tcclxuICAgICAgICAgICAgXCJiZWFyZXJBdXRoXCI6IFtdXHJcbiAgICAgfV1cclxuICAgICAjc3dhZ2dlci5wYXJhbWV0ZXJzW1wic2Vzc2lvblwiXSA9IHtcclxuICAgICAgc2NoZW1hOiAnTkVSRFdIQVRTX0FNRVJJQ0EnXHJcbiAgICAgfVxyXG4gICAgICNzd2FnZ2VyLnBhcmFtZXRlcnNbXCJtZXNzYWdlSWRcIl0gPSB7XHJcbiAgICAgIHJlcXVpcmVkOiB0cnVlLFxyXG4gICAgICBzY2hlbWE6ICc8bWVzc2FnZV9pZD4nXHJcbiAgICAgfVxyXG4gICAqL1xyXG4gIGNvbnN0IHNlc3Npb24gPSByZXEuc2Vzc2lvbjtcclxuICBjb25zdCB7IG1lc3NhZ2VJZCB9ID0gcmVxLnBhcmFtcztcclxuXHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHJlcS5jbGllbnQuZ2V0TWVzc2FnZUJ5SWQobWVzc2FnZUlkKTtcclxuXHJcbiAgICByZXR1cm5TdWNlc3MocmVzLCBzZXNzaW9uLCAocmVzdWx0IGFzIGFueSkuY2hhdElkLnVzZXIsIHJlc3VsdCk7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIHJldHVybkVycm9yKHJlcSwgcmVzLCBzZXNzaW9uLCBlcnJvcik7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0QmF0dGVyeUxldmVsKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSkge1xyXG4gIC8qKlxyXG4gICAqICNzd2FnZ2VyLnRhZ3MgPSBbXCJNaXNjXCJdXHJcbiAgICAgI3N3YWdnZXIuYXV0b0JvZHk9ZmFsc2VcclxuICAgICAjc3dhZ2dlci5zZWN1cml0eSA9IFt7XHJcbiAgICAgICAgICAgIFwiYmVhcmVyQXV0aFwiOiBbXVxyXG4gICAgIH1dXHJcbiAgICAgI3N3YWdnZXIucGFyYW1ldGVyc1tcInNlc3Npb25cIl0gPSB7XHJcbiAgICAgIHNjaGVtYTogJ05FUkRXSEFUU19BTUVSSUNBJ1xyXG4gICAgIH1cclxuICAgKi9cclxuICB0cnkge1xyXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCByZXEuY2xpZW50LmdldEJhdHRlcnlMZXZlbCgpO1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHsgc3RhdHVzOiAnU3VjY2VzcycsIHJlc3BvbnNlOiByZXNwb25zZSB9KTtcclxuICB9IGNhdGNoIChlKSB7XHJcbiAgICByZXEubG9nZ2VyLmVycm9yKGUpO1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgc3RhdHVzOiAnZXJyb3InLFxyXG4gICAgICBtZXNzYWdlOiAnRXJyb3IgcmV0cmlldmluZyBiYXR0ZXJ5IHN0YXR1cycsXHJcbiAgICAgIGVycm9yOiBlLFxyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0SG9zdERldmljZShyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpIHtcclxuICAvKipcclxuICAgKiAjc3dhZ2dlci50YWdzID0gW1wiTWlzY1wiXVxyXG4gICAgICNzd2FnZ2VyLmF1dG9Cb2R5PWZhbHNlXHJcbiAgICAgI3N3YWdnZXIuc2VjdXJpdHkgPSBbe1xyXG4gICAgICAgICAgICBcImJlYXJlckF1dGhcIjogW11cclxuICAgICB9XVxyXG4gICAgICNzd2FnZ2VyLnBhcmFtZXRlcnNbXCJzZXNzaW9uXCJdID0ge1xyXG4gICAgICBzY2hlbWE6ICdORVJEV0hBVFNfQU1FUklDQSdcclxuICAgICB9XHJcbiAgICovXHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgcmVxLmNsaWVudC5nZXRIb3N0RGV2aWNlKCk7XHJcbiAgICBjb25zdCBwaG9uZU51bWJlciA9IGF3YWl0IHJlcS5jbGllbnQuZ2V0V2lkKCk7XHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oe1xyXG4gICAgICBzdGF0dXM6ICdzdWNjZXNzJyxcclxuICAgICAgcmVzcG9uc2U6IHsgLi4ucmVzcG9uc2UsIHBob25lTnVtYmVyIH0sXHJcbiAgICAgIG1hcHBlcjogJ2RldmljZScsXHJcbiAgICB9KTtcclxuICB9IGNhdGNoIChlKSB7XHJcbiAgICByZXEubG9nZ2VyLmVycm9yKGUpO1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgc3RhdHVzOiAnZXJyb3InLFxyXG4gICAgICBtZXNzYWdlOiAnRXJybyBhbyByZWN1cGVyYXIgZGFkb3MgZG8gdGVsZWZvbmUnLFxyXG4gICAgICBlcnJvcjogZSxcclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldFBob25lTnVtYmVyKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSkge1xyXG4gIC8qKlxyXG4gICAqICNzd2FnZ2VyLnRhZ3MgPSBbXCJNaXNjXCJdXHJcbiAgICAgI3N3YWdnZXIuYXV0b0JvZHk9ZmFsc2VcclxuICAgICAjc3dhZ2dlci5zZWN1cml0eSA9IFt7XHJcbiAgICAgICAgICAgIFwiYmVhcmVyQXV0aFwiOiBbXVxyXG4gICAgIH1dXHJcbiAgICAgI3N3YWdnZXIucGFyYW1ldGVyc1tcInNlc3Npb25cIl0gPSB7XHJcbiAgICAgIHNjaGVtYTogJ05FUkRXSEFUU19BTUVSSUNBJ1xyXG4gICAgIH1cclxuICAgKi9cclxuICB0cnkge1xyXG4gICAgY29uc3QgcGhvbmVOdW1iZXIgPSBhd2FpdCByZXEuY2xpZW50LmdldFdpZCgpO1xyXG4gICAgcmV0dXJuIHJlc1xyXG4gICAgICAuc3RhdHVzKDIwMClcclxuICAgICAgLmpzb24oeyBzdGF0dXM6ICdzdWNjZXNzJywgcmVzcG9uc2U6IHBob25lTnVtYmVyLCBtYXBwZXI6ICdkZXZpY2UnIH0pO1xyXG4gIH0gY2F0Y2ggKGUpIHtcclxuICAgIHJlcS5sb2dnZXIuZXJyb3IoZSk7XHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oe1xyXG4gICAgICBzdGF0dXM6ICdlcnJvcicsXHJcbiAgICAgIG1lc3NhZ2U6ICdFcnJvciByZXRyaWV2aW5nIHBob25lIG51bWJlcicsXHJcbiAgICAgIGVycm9yOiBlLFxyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0QmxvY2tMaXN0KHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSkge1xyXG4gIC8qKlxyXG4gICAqICNzd2FnZ2VyLnRhZ3MgPSBbXCJNaXNjXCJdXHJcbiAgICAgI3N3YWdnZXIuYXV0b0JvZHk9ZmFsc2VcclxuICAgICAjc3dhZ2dlci5zZWN1cml0eSA9IFt7XHJcbiAgICAgICAgICAgIFwiYmVhcmVyQXV0aFwiOiBbXVxyXG4gICAgIH1dXHJcbiAgICAgI3N3YWdnZXIucGFyYW1ldGVyc1tcInNlc3Npb25cIl0gPSB7XHJcbiAgICAgIHNjaGVtYTogJ05FUkRXSEFUU19BTUVSSUNBJ1xyXG4gICAgIH1cclxuICAgKi9cclxuICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHJlcS5jbGllbnQuZ2V0QmxvY2tMaXN0KCk7XHJcblxyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBibG9ja2VkID0gcmVzcG9uc2UubWFwKChjb250YXRvOiBhbnkpID0+IHtcclxuICAgICAgcmV0dXJuIHsgcGhvbmU6IGNvbnRhdG8gPyBjb250YXRvLnNwbGl0KCdAJylbMF0gOiAnJyB9O1xyXG4gICAgfSk7XHJcblxyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHsgc3RhdHVzOiAnc3VjY2VzcycsIHJlc3BvbnNlOiBibG9ja2VkIH0pO1xyXG4gIH0gY2F0Y2ggKGUpIHtcclxuICAgIHJlcS5sb2dnZXIuZXJyb3IoZSk7XHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oe1xyXG4gICAgICBzdGF0dXM6ICdlcnJvcicsXHJcbiAgICAgIG1lc3NhZ2U6ICdFcnJvciByZXRyaWV2aW5nIGJsb2NrZWQgY29udGFjdCBsaXN0JyxcclxuICAgICAgZXJyb3I6IGUsXHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBkZWxldGVDaGF0KHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSkge1xyXG4gIC8qKlxyXG4gICAqICNzd2FnZ2VyLnRhZ3MgPSBbXCJDaGF0XCJdXHJcbiAgICAgI3N3YWdnZXIuYXV0b0JvZHk9ZmFsc2VcclxuICAgICAjc3dhZ2dlci5zZWN1cml0eSA9IFt7XHJcbiAgICAgICAgICAgIFwiYmVhcmVyQXV0aFwiOiBbXVxyXG4gICAgIH1dXHJcbiAgICAgI3N3YWdnZXIucGFyYW1ldGVyc1tcInNlc3Npb25cIl0gPSB7XHJcbiAgICAgIHNjaGVtYTogJ05FUkRXSEFUU19BTUVSSUNBJ1xyXG4gICAgIH1cclxuICAgICAjc3dhZ2dlci5yZXF1ZXN0Qm9keSA9IHtcclxuICAgICAgcmVxdWlyZWQ6IGZhbHNlLFxyXG4gICAgICBcIkBjb250ZW50XCI6IHtcclxuICAgICAgICBcImFwcGxpY2F0aW9uL2pzb25cIjoge1xyXG4gICAgICAgICAgc2NoZW1hOiB7XHJcbiAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICBwaG9uZTogeyB0eXBlOiBcInN0cmluZ1wiIH0sXHJcbiAgICAgICAgICAgICAgaXNHcm91cDogeyB0eXBlOiBcImJvb2xlYW5cIiB9LFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgZXhhbXBsZXM6IHtcclxuICAgICAgICAgICAgXCJEZWZhdWx0XCI6IHtcclxuICAgICAgICAgICAgICB2YWx1ZToge1xyXG4gICAgICAgICAgICAgICAgcGhvbmU6IFwiNTUyMTk5OTk5OTk5OVwiLFxyXG4gICAgICAgICAgICAgICAgaXNHcm91cDogZmFsc2UsXHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgIH1cclxuICAgKi9cclxuICBjb25zdCB7IHBob25lIH0gPSByZXEuYm9keTtcclxuICBjb25zdCBzZXNzaW9uID0gcmVxLnNlc3Npb247XHJcblxyXG4gIHRyeSB7XHJcbiAgICBjb25zdCByZXN1bHRzOiBhbnkgPSB7fTtcclxuICAgIGZvciAoY29uc3QgY29udGF0byBvZiBwaG9uZSkge1xyXG4gICAgICByZXN1bHRzW2NvbnRhdG9dID0gYXdhaXQgcmVxLmNsaWVudC5kZWxldGVDaGF0KGNvbnRhdG8pO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuU3VjZXNzKHJlcywgc2Vzc2lvbiwgcGhvbmUsIHJlc3VsdHMpO1xyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICByZXR1cm5FcnJvcihyZXEsIHJlcywgc2Vzc2lvbiwgZXJyb3IpO1xyXG4gIH1cclxufVxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZGVsZXRlQWxsQ2hhdHMocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKSB7XHJcbiAgLyoqXHJcbiAgICogI3N3YWdnZXIudGFncyA9IFtcIkNoYXRcIl1cclxuICAgICAjc3dhZ2dlci5hdXRvQm9keT1mYWxzZVxyXG4gICAgICNzd2FnZ2VyLnNlY3VyaXR5ID0gW3tcclxuICAgICAgICAgICAgXCJiZWFyZXJBdXRoXCI6IFtdXHJcbiAgICAgfV1cclxuICAgICAjc3dhZ2dlci5wYXJhbWV0ZXJzW1wic2Vzc2lvblwiXSA9IHtcclxuICAgICAgc2NoZW1hOiAnTkVSRFdIQVRTX0FNRVJJQ0EnXHJcbiAgICAgfVxyXG4gICAqL1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBjaGF0cyA9IGF3YWl0IHJlcS5jbGllbnQuZ2V0QWxsQ2hhdHMoKTtcclxuICAgIGZvciAoY29uc3QgY2hhdCBvZiBjaGF0cykge1xyXG4gICAgICBhd2FpdCByZXEuY2xpZW50LmRlbGV0ZUNoYXQoKGNoYXQgYXMgYW55KS5jaGF0SWQpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHsgc3RhdHVzOiAnc3VjY2VzcycgfSk7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIHJlcS5sb2dnZXIuZXJyb3IoZXJyb3IpO1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgc3RhdHVzOiAnZXJyb3InLFxyXG4gICAgICBtZXNzYWdlOiAnRXJyb3Igb24gZGVsZXRlIGFsbCBjaGF0cycsXHJcbiAgICAgIGVycm9yOiBlcnJvcixcclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNsZWFyQ2hhdChyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpIHtcclxuICAvKipcclxuICAgKiAjc3dhZ2dlci50YWdzID0gW1wiQ2hhdFwiXVxyXG4gICAgICNzd2FnZ2VyLmF1dG9Cb2R5PWZhbHNlXHJcbiAgICAgI3N3YWdnZXIuc2VjdXJpdHkgPSBbe1xyXG4gICAgICAgICAgICBcImJlYXJlckF1dGhcIjogW11cclxuICAgICB9XVxyXG4gICAgICNzd2FnZ2VyLnBhcmFtZXRlcnNbXCJzZXNzaW9uXCJdID0ge1xyXG4gICAgICBzY2hlbWE6ICdORVJEV0hBVFNfQU1FUklDQSdcclxuICAgICB9XHJcbiAgICAgXHJcbiAgICAgI3N3YWdnZXIucmVxdWVzdEJvZHkgPSB7XHJcbiAgICAgIHJlcXVpcmVkOiBmYWxzZSxcclxuICAgICAgXCJAY29udGVudFwiOiB7XHJcbiAgICAgICAgXCJhcHBsaWNhdGlvbi9qc29uXCI6IHtcclxuICAgICAgICAgIHNjaGVtYToge1xyXG4gICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgcGhvbmU6IHsgdHlwZTogXCJzdHJpbmdcIiB9LFxyXG4gICAgICAgICAgICAgIGlzR3JvdXA6IHsgdHlwZTogXCJib29sZWFuXCIgfSxcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIGV4YW1wbGVzOiB7XHJcbiAgICAgICAgICAgIFwiRGVmYXVsdFwiOiB7XHJcbiAgICAgICAgICAgICAgdmFsdWU6IHtcclxuICAgICAgICAgICAgICAgIHBob25lOiBcIjU1MjE5OTk5OTk5OTlcIixcclxuICAgICAgICAgICAgICAgIGlzR3JvdXA6IGZhbHNlLFxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICB9XHJcbiAgICovXHJcbiAgY29uc3QgeyBwaG9uZSB9ID0gcmVxLmJvZHk7XHJcbiAgY29uc3Qgc2Vzc2lvbiA9IHJlcS5zZXNzaW9uO1xyXG5cclxuICB0cnkge1xyXG4gICAgY29uc3QgcmVzdWx0czogYW55ID0ge307XHJcbiAgICBmb3IgKGNvbnN0IGNvbnRhdG8gb2YgcGhvbmUpIHtcclxuICAgICAgcmVzdWx0c1tjb250YXRvXSA9IGF3YWl0IHJlcS5jbGllbnQuY2xlYXJDaGF0KGNvbnRhdG8pO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuU3VjZXNzKHJlcywgc2Vzc2lvbiwgcGhvbmUsIHJlc3VsdHMpO1xyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICByZXR1cm5FcnJvcihyZXEsIHJlcywgc2Vzc2lvbiwgZXJyb3IpO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNsZWFyQWxsQ2hhdHMocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKSB7XHJcbiAgLyoqXHJcbiAgICogI3N3YWdnZXIudGFncyA9IFtcIkNoYXRcIl1cclxuICAgICAjc3dhZ2dlci5hdXRvQm9keT1mYWxzZVxyXG4gICAgICNzd2FnZ2VyLnNlY3VyaXR5ID0gW3tcclxuICAgICAgICAgICAgXCJiZWFyZXJBdXRoXCI6IFtdXHJcbiAgICAgfV1cclxuICAgICAjc3dhZ2dlci5wYXJhbWV0ZXJzW1wic2Vzc2lvblwiXSA9IHtcclxuICAgICAgc2NoZW1hOiAnTkVSRFdIQVRTX0FNRVJJQ0EnXHJcbiAgICAgfVxyXG4gICAqL1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBjaGF0cyA9IGF3YWl0IHJlcS5jbGllbnQuZ2V0QWxsQ2hhdHMoKTtcclxuICAgIGZvciAoY29uc3QgY2hhdCBvZiBjaGF0cykge1xyXG4gICAgICBhd2FpdCByZXEuY2xpZW50LmNsZWFyQ2hhdChgJHsoY2hhdCBhcyBhbnkpLmNoYXRJZH1gKTtcclxuICAgIH1cclxuICAgIHJldHVybiByZXMuc3RhdHVzKDIwMSkuanNvbih7IHN0YXR1czogJ3N1Y2Nlc3MnIH0pO1xyXG4gIH0gY2F0Y2ggKGUpIHtcclxuICAgIHJlcS5sb2dnZXIuZXJyb3IoZSk7XHJcbiAgICByZXR1cm4gcmVzXHJcbiAgICAgIC5zdGF0dXMoNTAwKVxyXG4gICAgICAuanNvbih7IHN0YXR1czogJ2Vycm9yJywgbWVzc2FnZTogJ0Vycm9yIG9uIGNsZWFyIGFsbCBjaGF0cycsIGVycm9yOiBlIH0pO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGFyY2hpdmVDaGF0KHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSkge1xyXG4gIC8qKlxyXG4gICAqICNzd2FnZ2VyLnRhZ3MgPSBbXCJDaGF0XCJdXHJcbiAgICAgI3N3YWdnZXIuYXV0b0JvZHk9ZmFsc2VcclxuICAgICAjc3dhZ2dlci5zZWN1cml0eSA9IFt7XHJcbiAgICAgICAgICAgIFwiYmVhcmVyQXV0aFwiOiBbXVxyXG4gICAgIH1dXHJcbiAgICAgI3N3YWdnZXIucGFyYW1ldGVyc1tcInNlc3Npb25cIl0gPSB7XHJcbiAgICAgIHNjaGVtYTogJ05FUkRXSEFUU19BTUVSSUNBJ1xyXG4gICAgIH1cclxuICAgICBcclxuICAgICAjc3dhZ2dlci5yZXF1ZXN0Qm9keSA9IHtcclxuICAgICAgcmVxdWlyZWQ6IGZhbHNlLFxyXG4gICAgICBcIkBjb250ZW50XCI6IHtcclxuICAgICAgICBcImFwcGxpY2F0aW9uL2pzb25cIjoge1xyXG4gICAgICAgICAgc2NoZW1hOiB7XHJcbiAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICBwaG9uZTogeyB0eXBlOiBcInN0cmluZ1wiIH0sXHJcbiAgICAgICAgICAgICAgaXNHcm91cDogeyB0eXBlOiBcImJvb2xlYW5cIiB9LFxyXG4gICAgICAgICAgICAgIHZhbHVlOiB7IHR5cGU6IFwiYm9vbGVhblwiIH0sXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICBleGFtcGxlczoge1xyXG4gICAgICAgICAgICBcIkRlZmF1bHRcIjoge1xyXG4gICAgICAgICAgICAgIHZhbHVlOiB7XHJcbiAgICAgICAgICAgICAgICBwaG9uZTogXCI1NTIxOTk5OTk5OTk5XCIsXHJcbiAgICAgICAgICAgICAgICBpc0dyb3VwOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgIHZhbHVlOiB0cnVlLFxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICB9XHJcbiAgICovXHJcbiAgY29uc3QgeyBwaG9uZSwgdmFsdWUgPSB0cnVlIH0gPSByZXEuYm9keTtcclxuXHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgcmVxLmNsaWVudC5hcmNoaXZlQ2hhdChgJHtwaG9uZX1gLCB2YWx1ZSk7XHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cygyMDEpLmpzb24oeyBzdGF0dXM6ICdzdWNjZXNzJywgcmVzcG9uc2U6IHJlc3BvbnNlIH0pO1xyXG4gIH0gY2F0Y2ggKGUpIHtcclxuICAgIHJlcS5sb2dnZXIuZXJyb3IoZSk7XHJcbiAgICByZXR1cm4gcmVzXHJcbiAgICAgIC5zdGF0dXMoNTAwKVxyXG4gICAgICAuanNvbih7IHN0YXR1czogJ2Vycm9yJywgbWVzc2FnZTogJ0Vycm9yIG9uIGFyY2hpdmUgY2hhdCcsIGVycm9yOiBlIH0pO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGFyY2hpdmVBbGxDaGF0cyhyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpIHtcclxuICAvKipcclxuICAgKiAjc3dhZ2dlci50YWdzID0gW1wiQ2hhdFwiXVxyXG4gICAgICNzd2FnZ2VyLmF1dG9Cb2R5PWZhbHNlXHJcbiAgICAgI3N3YWdnZXIuc2VjdXJpdHkgPSBbe1xyXG4gICAgICAgICAgICBcImJlYXJlckF1dGhcIjogW11cclxuICAgICB9XVxyXG4gICAgICNzd2FnZ2VyLnBhcmFtZXRlcnNbXCJzZXNzaW9uXCJdID0ge1xyXG4gICAgICBzY2hlbWE6ICdORVJEV0hBVFNfQU1FUklDQSdcclxuICAgICB9XHJcbiAgICovXHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IGNoYXRzID0gYXdhaXQgcmVxLmNsaWVudC5nZXRBbGxDaGF0cygpO1xyXG4gICAgZm9yIChjb25zdCBjaGF0IG9mIGNoYXRzKSB7XHJcbiAgICAgIGF3YWl0IHJlcS5jbGllbnQuYXJjaGl2ZUNoYXQoYCR7KGNoYXQgYXMgYW55KS5jaGF0SWR9YCwgdHJ1ZSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cygyMDEpLmpzb24oeyBzdGF0dXM6ICdzdWNjZXNzJyB9KTtcclxuICB9IGNhdGNoIChlKSB7XHJcbiAgICByZXEubG9nZ2VyLmVycm9yKGUpO1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgc3RhdHVzOiAnZXJyb3InLFxyXG4gICAgICBtZXNzYWdlOiAnRXJyb3Igb24gYXJjaGl2ZSBhbGwgY2hhdHMnLFxyXG4gICAgICBlcnJvcjogZSxcclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldEFsbENoYXRzQXJjaGl2ZWRzKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSkge1xyXG4gIC8qKlxyXG4gICAqICNzd2FnZ2VyLnRhZ3MgPSBbXCJDaGF0XCJdXHJcbiAgICogI3N3YWdnZXIuZGVzY3JpcHRpb24gPSAnUmV0cmlldmVzIGFsbCBhcmNoaXZlZCBjaGF0cy4nXHJcbiAgICAgI3N3YWdnZXIuYXV0b0JvZHk9ZmFsc2VcclxuICAgICAjc3dhZ2dlci5zZWN1cml0eSA9IFt7XHJcbiAgICAgICAgICAgIFwiYmVhcmVyQXV0aFwiOiBbXVxyXG4gICAgIH1dXHJcbiAgICAgI3N3YWdnZXIucGFyYW1ldGVyc1tcInNlc3Npb25cIl0gPSB7XHJcbiAgICAgIHNjaGVtYTogJ05FUkRXSEFUU19BTUVSSUNBJ1xyXG4gICAgIH1cclxuICAgKi9cclxuICB0cnkge1xyXG4gICAgY29uc3QgY2hhdHMgPSBhd2FpdCByZXEuY2xpZW50LmdldEFsbENoYXRzKCk7XHJcbiAgICBjb25zdCBhcmNoaXZlZCA9IFtdIGFzIGFueTtcclxuICAgIGZvciAoY29uc3QgY2hhdCBvZiBjaGF0cykge1xyXG4gICAgICBpZiAoY2hhdC5hcmNoaXZlID09PSB0cnVlKSB7XHJcbiAgICAgICAgYXJjaGl2ZWQucHVzaChjaGF0KTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAxKS5qc29uKGFyY2hpdmVkKTtcclxuICB9IGNhdGNoIChlKSB7XHJcbiAgICByZXEubG9nZ2VyLmVycm9yKGUpO1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgc3RhdHVzOiAnZXJyb3InLFxyXG4gICAgICBtZXNzYWdlOiAnRXJyb3Igb24gYXJjaGl2ZSBhbGwgY2hhdHMnLFxyXG4gICAgICBlcnJvcjogZSxcclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZGVsZXRlTWVzc2FnZShyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpIHtcclxuICAvKipcclxuICAgKiAjc3dhZ2dlci50YWdzID0gW1wiTWVzc2FnZXNcIl1cclxuICAgICAjc3dhZ2dlci5hdXRvQm9keT1mYWxzZVxyXG4gICAgICNzd2FnZ2VyLnNlY3VyaXR5ID0gW3tcclxuICAgICAgICAgICAgXCJiZWFyZXJBdXRoXCI6IFtdXHJcbiAgICAgfV1cclxuICAgICAjc3dhZ2dlci5wYXJhbWV0ZXJzW1wic2Vzc2lvblwiXSA9IHtcclxuICAgICAgc2NoZW1hOiAnTkVSRFdIQVRTX0FNRVJJQ0EnXHJcbiAgICAgfVxyXG4gICAgIFxyXG4gICAgICNzd2FnZ2VyLnJlcXVlc3RCb2R5ID0ge1xyXG4gICAgICByZXF1aXJlZDogZmFsc2UsXHJcbiAgICAgIFwiQGNvbnRlbnRcIjoge1xyXG4gICAgICAgIFwiYXBwbGljYXRpb24vanNvblwiOiB7XHJcbiAgICAgICAgICBzY2hlbWE6IHtcclxuICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgIHBob25lOiB7IHR5cGU6IFwic3RyaW5nXCIgfSxcclxuICAgICAgICAgICAgICBpc0dyb3VwOiB7IHR5cGU6IFwiYm9vbGVhblwiIH0sXHJcbiAgICAgICAgICAgICAgbWVzc2FnZUlkOiB7IHR5cGU6IFwic3RyaW5nXCIgfSxcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIGV4YW1wbGVzOiB7XHJcbiAgICAgICAgICAgIFwiRGVmYXVsdFwiOiB7XHJcbiAgICAgICAgICAgICAgdmFsdWU6IHtcclxuICAgICAgICAgICAgICAgIHBob25lOiBcIjU1MjE5OTk5OTk5OTlcIixcclxuICAgICAgICAgICAgICAgIGlzR3JvdXA6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgbWVzc2FnZUlkOiBcIjxtZXNzYWdlSWQ+XCIsXHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgIH1cclxuICAgKi9cclxuICBjb25zdCB7IHBob25lLCBtZXNzYWdlSWQgfSA9IHJlcS5ib2R5O1xyXG5cclxuICB0cnkge1xyXG4gICAgYXdhaXQgcmVxLmNsaWVudC5kZWxldGVNZXNzYWdlKGAke3Bob25lfWAsIFttZXNzYWdlSWRdKTtcclxuXHJcbiAgICByZXR1cm4gcmVzXHJcbiAgICAgIC5zdGF0dXMoMjAwKVxyXG4gICAgICAuanNvbih7IHN0YXR1czogJ3N1Y2Nlc3MnLCByZXNwb25zZTogeyBtZXNzYWdlOiAnTWVzc2FnZSBkZWxldGVkJyB9IH0pO1xyXG4gIH0gY2F0Y2ggKGUpIHtcclxuICAgIHJlcS5sb2dnZXIuZXJyb3IoZSk7XHJcbiAgICByZXR1cm4gcmVzXHJcbiAgICAgIC5zdGF0dXMoNTAwKVxyXG4gICAgICAuanNvbih7IHN0YXR1czogJ2Vycm9yJywgbWVzc2FnZTogJ0Vycm9yIG9uIGRlbGV0ZSBtZXNzYWdlJywgZXJyb3I6IGUgfSk7XHJcbiAgfVxyXG59XHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZWFjdE1lc3NhZ2UocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKSB7XHJcbiAgLyoqXHJcbiAgICogI3N3YWdnZXIudGFncyA9IFtcIk1lc3NhZ2VzXCJdXHJcbiAgICAgI3N3YWdnZXIuYXV0b0JvZHk9ZmFsc2VcclxuICAgICAjc3dhZ2dlci5zZWN1cml0eSA9IFt7XHJcbiAgICAgICAgICAgIFwiYmVhcmVyQXV0aFwiOiBbXVxyXG4gICAgIH1dXHJcbiAgICAgI3N3YWdnZXIucGFyYW1ldGVyc1tcInNlc3Npb25cIl0gPSB7XHJcbiAgICAgIHNjaGVtYTogJ05FUkRXSEFUU19BTUVSSUNBJ1xyXG4gICAgIH1cclxuICAgICAjc3dhZ2dlci5yZXF1ZXN0Qm9keSA9IHtcclxuICAgICAgcmVxdWlyZWQ6IGZhbHNlLFxyXG4gICAgICBcIkBjb250ZW50XCI6IHtcclxuICAgICAgICBcImFwcGxpY2F0aW9uL2pzb25cIjoge1xyXG4gICAgICAgICAgc2NoZW1hOiB7XHJcbiAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICBtc2dJZDogeyB0eXBlOiBcInN0cmluZ1wiIH0sXHJcbiAgICAgICAgICAgICAgcmVhY3Rpb246IHsgdHlwZTogXCJzdHJpbmdcIiB9LFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgZXhhbXBsZXM6IHtcclxuICAgICAgICAgICAgXCJEZWZhdWx0XCI6IHtcclxuICAgICAgICAgICAgICB2YWx1ZToge1xyXG4gICAgICAgICAgICAgICAgbXNnSWQ6IFwiPG1lc3NhZ2VJZD5cIixcclxuICAgICAgICAgICAgICAgIHJlYWN0aW9uOiBcIvCfmJxcIixcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgfVxyXG4gICAqL1xyXG4gIGNvbnN0IHsgbXNnSWQsIHJlYWN0aW9uIH0gPSByZXEuYm9keTtcclxuXHJcbiAgdHJ5IHtcclxuICAgIGF3YWl0IHJlcS5jbGllbnQuc2VuZFJlYWN0aW9uVG9NZXNzYWdlKG1zZ0lkLCByZWFjdGlvbik7XHJcblxyXG4gICAgcmV0dXJuIHJlc1xyXG4gICAgICAuc3RhdHVzKDIwMClcclxuICAgICAgLmpzb24oeyBzdGF0dXM6ICdzdWNjZXNzJywgcmVzcG9uc2U6IHsgbWVzc2FnZTogJ1JlYWN0aW9uIHNlbmRlZCcgfSB9KTtcclxuICB9IGNhdGNoIChlKSB7XHJcbiAgICByZXEubG9nZ2VyLmVycm9yKGUpO1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgc3RhdHVzOiAnZXJyb3InLFxyXG4gICAgICBtZXNzYWdlOiAnRXJyb3Igb24gc2VuZCByZWFjdGlvbiB0byBtZXNzYWdlJyxcclxuICAgICAgZXJyb3I6IGUsXHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZXBseShyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpIHtcclxuICAvKipcclxuICAgKiAjc3dhZ2dlci5kZXByZWNhdGVkPXRydWVcclxuICAgICAjc3dhZ2dlci50YWdzID0gW1wiTWVzc2FnZXNcIl1cclxuICAgICAjc3dhZ2dlci5hdXRvQm9keT1mYWxzZVxyXG4gICAgICNzd2FnZ2VyLnNlY3VyaXR5ID0gW3tcclxuICAgICAgICAgICAgXCJiZWFyZXJBdXRoXCI6IFtdXHJcbiAgICAgfV1cclxuICAgICAjc3dhZ2dlci5wYXJhbWV0ZXJzW1wic2Vzc2lvblwiXSA9IHtcclxuICAgICAgc2NoZW1hOiAnTkVSRFdIQVRTX0FNRVJJQ0EnXHJcbiAgICAgfVxyXG4gICAgICNzd2FnZ2VyLnJlcXVlc3RCb2R5ID0ge1xyXG4gICAgICByZXF1aXJlZDogdHJ1ZSxcclxuICAgICAgXCJAY29udGVudFwiOiB7XHJcbiAgICAgICAgXCJhcHBsaWNhdGlvbi9qc29uXCI6IHtcclxuICAgICAgICAgIHNjaGVtYToge1xyXG4gICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgcGhvbmU6IHsgdHlwZTogXCJzdHJpbmdcIiB9LFxyXG4gICAgICAgICAgICAgIGlzR3JvdXA6IHsgdHlwZTogXCJib29sZWFuXCIgfSxcclxuICAgICAgICAgICAgICBtZXNzYWdlaWQ6IHsgdHlwZTogXCJzdHJpbmdcIiB9LFxyXG4gICAgICAgICAgICAgIHRleHQ6IHsgdHlwZTogXCJzdHJpbmdcIiB9LFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgZXhhbXBsZXM6IHtcclxuICAgICAgICAgICAgXCJEZWZhdWx0XCI6IHtcclxuICAgICAgICAgICAgICB2YWx1ZToge1xyXG4gICAgICAgICAgICAgIHBob25lOiBcIjU1MjE5OTk5OTk5OTlcIixcclxuICAgICAgICAgICAgICBpc0dyb3VwOiBmYWxzZSxcclxuICAgICAgICAgICAgICBtZXNzYWdlaWQ6IFwiPG1lc3NhZ2VJZD5cIixcclxuICAgICAgICAgICAgICB0ZXh0OiBcIlRleHQgdG8gcmVwbHlcIixcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgfVxyXG4gICAqL1xyXG4gIGNvbnN0IHsgcGhvbmUsIHRleHQsIG1lc3NhZ2VpZCB9ID0gcmVxLmJvZHk7XHJcblxyXG4gIHRyeSB7XHJcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHJlcS5jbGllbnQucmVwbHkoYCR7cGhvbmV9QGMudXNgLCB0ZXh0LCBtZXNzYWdlaWQpO1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHsgc3RhdHVzOiAnc3VjY2VzcycsIHJlc3BvbnNlOiByZXNwb25zZSB9KTtcclxuICB9IGNhdGNoIChlKSB7XHJcbiAgICByZXEubG9nZ2VyLmVycm9yKGUpO1xyXG4gICAgcmV0dXJuIHJlc1xyXG4gICAgICAuc3RhdHVzKDUwMClcclxuICAgICAgLmpzb24oeyBzdGF0dXM6ICdlcnJvcicsIG1lc3NhZ2U6ICdFcnJvciByZXBseWluZyBtZXNzYWdlJywgZXJyb3I6IGUgfSk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZm9yd2FyZE1lc3NhZ2VzKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSkge1xyXG4gIC8qKlxyXG4gICAgICNzd2FnZ2VyLnRhZ3MgPSBbXCJNZXNzYWdlc1wiXVxyXG4gICAgICNzd2FnZ2VyLmF1dG9Cb2R5PWZhbHNlXHJcbiAgICAgI3N3YWdnZXIuc2VjdXJpdHkgPSBbe1xyXG4gICAgICAgICAgICBcImJlYXJlckF1dGhcIjogW11cclxuICAgICB9XVxyXG4gICAgICNzd2FnZ2VyLnBhcmFtZXRlcnNbXCJzZXNzaW9uXCJdID0ge1xyXG4gICAgICBzY2hlbWE6ICdORVJEV0hBVFNfQU1FUklDQSdcclxuICAgICB9XHJcbiAgICAgI3N3YWdnZXIucmVxdWVzdEJvZHkgPSB7XHJcbiAgICAgIHJlcXVpcmVkOiB0cnVlLFxyXG4gICAgICBcIkBjb250ZW50XCI6IHtcclxuICAgICAgICBcImFwcGxpY2F0aW9uL2pzb25cIjoge1xyXG4gICAgICAgICAgc2NoZW1hOiB7XHJcbiAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICBwaG9uZTogeyB0eXBlOiBcInN0cmluZ1wiIH0sXHJcbiAgICAgICAgICAgICAgaXNHcm91cDogeyB0eXBlOiBcImJvb2xlYW5cIiB9LFxyXG4gICAgICAgICAgICAgIG1lc3NhZ2VpZDogeyB0eXBlOiBcInN0cmluZ1wiIH0sXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICBleGFtcGxlczoge1xyXG4gICAgICAgICAgICBcIkRlZmF1bHRcIjoge1xyXG4gICAgICAgICAgICAgIHZhbHVlOiB7XHJcbiAgICAgICAgICAgICAgICBwaG9uZTogXCI1NTIxOTk5OTk5OTk5XCIsXHJcbiAgICAgICAgICAgICAgICBpc0dyb3VwOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgIG1lc3NhZ2VpZDogXCI8bWVzc2FnZUlkPlwiLFxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICB9XHJcbiAgICovXHJcbiAgY29uc3QgeyBwaG9uZSwgbWVzc2FnZUlkLCBpc0dyb3VwID0gZmFsc2UgfSA9IHJlcS5ib2R5O1xyXG5cclxuICB0cnkge1xyXG4gICAgbGV0IHJlc3BvbnNlO1xyXG5cclxuICAgIGlmICghaXNHcm91cCkge1xyXG4gICAgICByZXNwb25zZSA9IGF3YWl0IHJlcS5jbGllbnQuZm9yd2FyZE1lc3NhZ2UoYCR7cGhvbmV9YCwgW21lc3NhZ2VJZF0pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmVzcG9uc2UgPSBhd2FpdCByZXEuY2xpZW50LmZvcndhcmRNZXNzYWdlKGAke3Bob25lfWAsIFttZXNzYWdlSWRdKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cygyMDEpLmpzb24oeyBzdGF0dXM6ICdzdWNjZXNzJywgcmVzcG9uc2U6IHJlc3BvbnNlIH0pO1xyXG4gIH0gY2F0Y2ggKGUpIHtcclxuICAgIHJlcS5sb2dnZXIuZXJyb3IoZSk7XHJcbiAgICByZXR1cm4gcmVzXHJcbiAgICAgIC5zdGF0dXMoNTAwKVxyXG4gICAgICAuanNvbih7IHN0YXR1czogJ2Vycm9yJywgbWVzc2FnZTogJ0Vycm9yIGZvcndhcmRpbmcgbWVzc2FnZScsIGVycm9yOiBlIH0pO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIG1hcmtVbnNlZW5NZXNzYWdlKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSkge1xyXG4gIC8qKlxyXG4gICAgICNzd2FnZ2VyLnRhZ3MgPSBbXCJNZXNzYWdlc1wiXVxyXG4gICAgICNzd2FnZ2VyLmF1dG9Cb2R5PWZhbHNlXHJcbiAgICAgI3N3YWdnZXIuc2VjdXJpdHkgPSBbe1xyXG4gICAgICAgICAgICBcImJlYXJlckF1dGhcIjogW11cclxuICAgICB9XVxyXG4gICAgICNzd2FnZ2VyLnBhcmFtZXRlcnNbXCJzZXNzaW9uXCJdID0ge1xyXG4gICAgICBzY2hlbWE6ICdORVJEV0hBVFNfQU1FUklDQSdcclxuICAgICB9XHJcbiAgICAgI3N3YWdnZXIucmVxdWVzdEJvZHkgPSB7XHJcbiAgICAgIHJlcXVpcmVkOiB0cnVlLFxyXG4gICAgICBcIkBjb250ZW50XCI6IHtcclxuICAgICAgICBcImFwcGxpY2F0aW9uL2pzb25cIjoge1xyXG4gICAgICAgICAgc2NoZW1hOiB7XHJcbiAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICBwaG9uZTogeyB0eXBlOiBcInN0cmluZ1wiIH0sXHJcbiAgICAgICAgICAgICAgaXNHcm91cDogeyB0eXBlOiBcImJvb2xlYW5cIiB9LFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgZXhhbXBsZXM6IHtcclxuICAgICAgICAgICAgXCJEZWZhdWx0XCI6IHtcclxuICAgICAgICAgICAgICB2YWx1ZToge1xyXG4gICAgICAgICAgICAgICAgcGhvbmU6IFwiNTUyMTk5OTk5OTk5OVwiLFxyXG4gICAgICAgICAgICAgICAgaXNHcm91cDogZmFsc2UsXHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgIH1cclxuICAgKi9cclxuICBjb25zdCB7IHBob25lIH0gPSByZXEuYm9keTtcclxuXHJcbiAgdHJ5IHtcclxuICAgIGF3YWl0IHJlcS5jbGllbnQubWFya1Vuc2Vlbk1lc3NhZ2UoYCR7cGhvbmV9YCk7XHJcbiAgICByZXR1cm4gcmVzXHJcbiAgICAgIC5zdGF0dXMoMjAwKVxyXG4gICAgICAuanNvbih7IHN0YXR1czogJ3N1Y2Nlc3MnLCByZXNwb25zZTogeyBtZXNzYWdlOiAndW5zZWVuIGNoZWNrZWQnIH0gfSk7XHJcbiAgfSBjYXRjaCAoZSkge1xyXG4gICAgcmVxLmxvZ2dlci5lcnJvcihlKTtcclxuICAgIHJldHVybiByZXNcclxuICAgICAgLnN0YXR1cyg1MDApXHJcbiAgICAgIC5qc29uKHsgc3RhdHVzOiAnZXJyb3InLCBtZXNzYWdlOiAnRXJyb3Igb24gbWFyayB1bnNlZW4nLCBlcnJvcjogZSB9KTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBibG9ja0NvbnRhY3QocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKSB7XHJcbiAgLyoqXHJcbiAgICAgI3N3YWdnZXIudGFncyA9IFtcIk1pc2NcIl1cclxuICAgICAjc3dhZ2dlci5hdXRvQm9keT1mYWxzZVxyXG4gICAgICNzd2FnZ2VyLnNlY3VyaXR5ID0gW3tcclxuICAgICAgICAgICAgXCJiZWFyZXJBdXRoXCI6IFtdXHJcbiAgICAgfV1cclxuICAgICAjc3dhZ2dlci5wYXJhbWV0ZXJzW1wic2Vzc2lvblwiXSA9IHtcclxuICAgICAgc2NoZW1hOiAnTkVSRFdIQVRTX0FNRVJJQ0EnXHJcbiAgICAgfVxyXG4gICAgICNzd2FnZ2VyLnJlcXVlc3RCb2R5ID0ge1xyXG4gICAgICByZXF1aXJlZDogdHJ1ZSxcclxuICAgICAgXCJAY29udGVudFwiOiB7XHJcbiAgICAgICAgXCJhcHBsaWNhdGlvbi9qc29uXCI6IHtcclxuICAgICAgICAgIHNjaGVtYToge1xyXG4gICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgcGhvbmU6IHsgdHlwZTogXCJzdHJpbmdcIiB9LFxyXG4gICAgICAgICAgICAgIGlzR3JvdXA6IHsgdHlwZTogXCJib29sZWFuXCIgfSxcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIGV4YW1wbGVzOiB7XHJcbiAgICAgICAgICAgIFwiRGVmYXVsdFwiOiB7XHJcbiAgICAgICAgICAgICAgdmFsdWU6IHtcclxuICAgICAgICAgICAgICBwaG9uZTogXCI1NTIxOTk5OTk5OTk5XCIsXHJcbiAgICAgICAgICAgICAgaXNHcm91cDogZmFsc2UsXHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgIH1cclxuICAgKi9cclxuICBjb25zdCB7IHBob25lIH0gPSByZXEuYm9keTtcclxuXHJcbiAgdHJ5IHtcclxuICAgIGF3YWl0IHJlcS5jbGllbnQuYmxvY2tDb250YWN0KGAke3Bob25lfWApO1xyXG4gICAgcmV0dXJuIHJlc1xyXG4gICAgICAuc3RhdHVzKDIwMClcclxuICAgICAgLmpzb24oeyBzdGF0dXM6ICdzdWNjZXNzJywgcmVzcG9uc2U6IHsgbWVzc2FnZTogJ0NvbnRhY3QgYmxvY2tlZCcgfSB9KTtcclxuICB9IGNhdGNoIChlKSB7XHJcbiAgICByZXEubG9nZ2VyLmVycm9yKGUpO1xyXG4gICAgcmV0dXJuIHJlc1xyXG4gICAgICAuc3RhdHVzKDUwMClcclxuICAgICAgLmpzb24oeyBzdGF0dXM6ICdlcnJvcicsIG1lc3NhZ2U6ICdFcnJvciBvbiBibG9jayBjb250YWN0JywgZXJyb3I6IGUgfSk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdW5ibG9ja0NvbnRhY3QocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKSB7XHJcbiAgLyoqXHJcbiAgICAgI3N3YWdnZXIudGFncyA9IFtcIk1pc2NcIl1cclxuICAgICAjc3dhZ2dlci5hdXRvQm9keT1mYWxzZVxyXG4gICAgICNzd2FnZ2VyLnNlY3VyaXR5ID0gW3tcclxuICAgICAgICAgICAgXCJiZWFyZXJBdXRoXCI6IFtdXHJcbiAgICAgfV1cclxuICAgICAjc3dhZ2dlci5wYXJhbWV0ZXJzW1wic2Vzc2lvblwiXSA9IHtcclxuICAgICAgc2NoZW1hOiAnTkVSRFdIQVRTX0FNRVJJQ0EnXHJcbiAgICAgfVxyXG4gICAgICNzd2FnZ2VyLnJlcXVlc3RCb2R5ID0ge1xyXG4gICAgICByZXF1aXJlZDogdHJ1ZSxcclxuICAgICAgXCJAY29udGVudFwiOiB7XHJcbiAgICAgICAgXCJhcHBsaWNhdGlvbi9qc29uXCI6IHtcclxuICAgICAgICAgIHNjaGVtYToge1xyXG4gICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgcGhvbmU6IHsgdHlwZTogXCJzdHJpbmdcIiB9LFxyXG4gICAgICAgICAgICAgIGlzR3JvdXA6IHsgdHlwZTogXCJib29sZWFuXCIgfSxcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIGV4YW1wbGVzOiB7XHJcbiAgICAgICAgICAgIFwiRGVmYXVsdFwiOiB7XHJcbiAgICAgICAgICAgICAgdmFsdWU6IHtcclxuICAgICAgICAgICAgICBwaG9uZTogXCI1NTIxOTk5OTk5OTk5XCIsXHJcbiAgICAgICAgICAgICAgaXNHcm91cDogZmFsc2UsXHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgIH1cclxuICAgKi9cclxuICBjb25zdCB7IHBob25lIH0gPSByZXEuYm9keTtcclxuXHJcbiAgdHJ5IHtcclxuICAgIGF3YWl0IHJlcS5jbGllbnQudW5ibG9ja0NvbnRhY3QoYCR7cGhvbmV9YCk7XHJcbiAgICByZXR1cm4gcmVzXHJcbiAgICAgIC5zdGF0dXMoMjAwKVxyXG4gICAgICAuanNvbih7IHN0YXR1czogJ3N1Y2Nlc3MnLCByZXNwb25zZTogeyBtZXNzYWdlOiAnQ29udGFjdCBVbkJsb2NrZWQnIH0gfSk7XHJcbiAgfSBjYXRjaCAoZSkge1xyXG4gICAgcmVxLmxvZ2dlci5lcnJvcihlKTtcclxuICAgIHJldHVybiByZXNcclxuICAgICAgLnN0YXR1cyg1MDApXHJcbiAgICAgIC5qc29uKHsgc3RhdHVzOiAnZXJyb3InLCBtZXNzYWdlOiAnRXJyb3Igb24gdW5sb2NrIGNvbnRhY3QnLCBlcnJvcjogZSB9KTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBwaW5DaGF0KHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSkge1xyXG4gIC8qKlxyXG4gICAgICNzd2FnZ2VyLnRhZ3MgPSBbXCJDaGF0XCJdXHJcbiAgICAgI3N3YWdnZXIuYXV0b0JvZHk9ZmFsc2VcclxuICAgICAjc3dhZ2dlci5zZWN1cml0eSA9IFt7XHJcbiAgICAgICAgICAgIFwiYmVhcmVyQXV0aFwiOiBbXVxyXG4gICAgIH1dXHJcbiAgICAgI3N3YWdnZXIucGFyYW1ldGVyc1tcInNlc3Npb25cIl0gPSB7XHJcbiAgICAgIHNjaGVtYTogJ05FUkRXSEFUU19BTUVSSUNBJ1xyXG4gICAgIH1cclxuICAgICAjc3dhZ2dlci5wYXJhbWV0ZXJzW1wib2JqXCJdID0ge1xyXG4gICAgICBpbjogJ2JvZHknLFxyXG4gICAgICBzY2hlbWE6IHtcclxuICAgICAgICAkcGhvbmU6ICc1NTIxOTk5OTk5OTk5JyxcclxuICAgICAgICAkaXNHcm91cDogZmFsc2UsXHJcbiAgICAgICAgJHN0YXRlOiB0cnVlLFxyXG4gICAgICB9XHJcbiAgICAgfVxyXG4gICAgICNzd2FnZ2VyLnJlcXVlc3RCb2R5ID0ge1xyXG4gICAgICByZXF1aXJlZDogdHJ1ZSxcclxuICAgICAgXCJAY29udGVudFwiOiB7XHJcbiAgICAgICAgXCJhcHBsaWNhdGlvbi9qc29uXCI6IHtcclxuICAgICAgICAgIHNjaGVtYToge1xyXG4gICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgcGhvbmU6IHsgdHlwZTogXCJzdHJpbmdcIiB9LFxyXG4gICAgICAgICAgICAgIGlzR3JvdXA6IHsgdHlwZTogXCJib29sZWFuXCIgfSxcclxuICAgICAgICAgICAgICBzdGF0ZTogeyB0eXBlOiBcImJvb2xlYW5cIiB9LFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgZXhhbXBsZXM6IHtcclxuICAgICAgICAgICAgXCJEZWZhdWx0XCI6IHtcclxuICAgICAgICAgICAgICB2YWx1ZToge1xyXG4gICAgICAgICAgICAgIHBob25lOiBcIjU1MjE5OTk5OTk5OTlcIixcclxuICAgICAgICAgICAgICBzdGF0ZTogdHJ1ZSxcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgfVxyXG4gICAqL1xyXG4gIGNvbnN0IHsgcGhvbmUsIHN0YXRlIH0gPSByZXEuYm9keTtcclxuXHJcbiAgdHJ5IHtcclxuICAgIGZvciAoY29uc3QgY29udGF0byBvZiBwaG9uZSkge1xyXG4gICAgICBhd2FpdCByZXEuY2xpZW50LnBpbkNoYXQoY29udGF0bywgc3RhdGUgPT09ICd0cnVlJywgZmFsc2UpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiByZXNcclxuICAgICAgLnN0YXR1cygyMDApXHJcbiAgICAgIC5qc29uKHsgc3RhdHVzOiAnc3VjY2VzcycsIHJlc3BvbnNlOiB7IG1lc3NhZ2U6ICdDaGF0IGZpeGVkJyB9IH0pO1xyXG4gIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgcmVxLmxvZ2dlci5lcnJvcihlKTtcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7XHJcbiAgICAgIHN0YXR1czogJ2Vycm9yJyxcclxuICAgICAgbWVzc2FnZTogZS50ZXh0IHx8ICdFcnJvciBvbiBwaW4gY2hhdCcsXHJcbiAgICAgIGVycm9yOiBlLFxyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2V0UHJvZmlsZVBpYyhyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpIHtcclxuICAvKipcclxuICAgICAjc3dhZ2dlci50YWdzID0gW1wiUHJvZmlsZVwiXVxyXG4gICAgICNzd2FnZ2VyLmF1dG9Cb2R5PWZhbHNlXHJcbiAgICAgI3N3YWdnZXIuc2VjdXJpdHkgPSBbe1xyXG4gICAgICAgICAgICBcImJlYXJlckF1dGhcIjogW11cclxuICAgICB9XVxyXG4gICAgICNzd2FnZ2VyLnBhcmFtZXRlcnNbXCJzZXNzaW9uXCJdID0ge1xyXG4gICAgICBzY2hlbWE6ICdORVJEV0hBVFNfQU1FUklDQSdcclxuICAgICB9XHJcbiAgICAgI3N3YWdnZXIuY29uc3VtZXMgPSBbJ211bHRpcGFydC9mb3JtLWRhdGEnXSAgXHJcbiAgICAgICNzd2FnZ2VyLnBhcmFtZXRlcnNbJ2ZpbGUnXSA9IHtcclxuICAgICAgICAgIGluOiAnZm9ybURhdGEnLFxyXG4gICAgICAgICAgdHlwZTogJ2ZpbGUnLFxyXG4gICAgICAgICAgcmVxdWlyZWQ6ICd0cnVlJyxcclxuICAgICAgfVxyXG4gICAqL1xyXG4gIGlmICghcmVxLmZpbGUpXHJcbiAgICByZXR1cm4gcmVzXHJcbiAgICAgIC5zdGF0dXMoNDAwKVxyXG4gICAgICAuanNvbih7IHN0YXR1czogJ0Vycm9yJywgbWVzc2FnZTogJ0ZpbGUgcGFyYW1ldGVyIGlzIHJlcXVpcmVkIScgfSk7XHJcblxyXG4gIHRyeSB7XHJcbiAgICBjb25zdCB7IHBhdGg6IHBhdGhGaWxlIH0gPSByZXEuZmlsZTtcclxuXHJcbiAgICBhd2FpdCByZXEuY2xpZW50LnNldFByb2ZpbGVQaWMocGF0aEZpbGUpO1xyXG4gICAgYXdhaXQgdW5saW5rQXN5bmMocGF0aEZpbGUpO1xyXG5cclxuICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7XHJcbiAgICAgIHN0YXR1czogJ3N1Y2Nlc3MnLFxyXG4gICAgICByZXNwb25zZTogeyBtZXNzYWdlOiAnUHJvZmlsZSBwaG90byBzdWNjZXNzZnVsbHkgY2hhbmdlZCcgfSxcclxuICAgIH0pO1xyXG4gIH0gY2F0Y2ggKGUpIHtcclxuICAgIHJlcS5sb2dnZXIuZXJyb3IoZSk7XHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oe1xyXG4gICAgICBzdGF0dXM6ICdlcnJvcicsXHJcbiAgICAgIG1lc3NhZ2U6ICdFcnJvciBjaGFuZ2luZyBwcm9maWxlIHBob3RvJyxcclxuICAgICAgZXJyb3I6IGUsXHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRVbnJlYWRNZXNzYWdlcyhyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpIHtcclxuICAvKipcclxuICAgICAjc3dhZ2dlci5kZXByZWNhdGVkPXRydWVcclxuICAgICAjc3dhZ2dlci50YWdzID0gW1wiTWVzc2FnZXNcIl1cclxuICAgICAjc3dhZ2dlci5hdXRvQm9keT1mYWxzZVxyXG4gICAgICNzd2FnZ2VyLnNlY3VyaXR5ID0gW3tcclxuICAgICAgICAgICAgXCJiZWFyZXJBdXRoXCI6IFtdXHJcbiAgICAgfV1cclxuICAgICAjc3dhZ2dlci5wYXJhbWV0ZXJzW1wic2Vzc2lvblwiXSA9IHtcclxuICAgICAgc2NoZW1hOiAnTkVSRFdIQVRTX0FNRVJJQ0EnXHJcbiAgICAgfVxyXG4gICAqL1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHJlcS5jbGllbnQuZ2V0VW5yZWFkTWVzc2FnZXMoZmFsc2UsIGZhbHNlLCB0cnVlKTtcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7IHN0YXR1czogJ3N1Y2Nlc3MnLCByZXNwb25zZTogcmVzcG9uc2UgfSk7XHJcbiAgfSBjYXRjaCAoZSkge1xyXG4gICAgcmVxLmxvZ2dlci5lcnJvcihlKTtcclxuICAgIHJldHVybiByZXNcclxuICAgICAgLnN0YXR1cyg1MDApXHJcbiAgICAgIC5qc29uKHsgc3RhdHVzOiAnZXJyb3InLCByZXNwb25zZTogJ0Vycm9yIG9uIG9wZW4gbGlzdCcsIGVycm9yOiBlIH0pO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldENoYXRJc09ubGluZShyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpIHtcclxuICAvKipcclxuICAgICAjc3dhZ2dlci50YWdzID0gW1wiQ2hhdFwiXVxyXG4gICAgICNzd2FnZ2VyLmF1dG9Cb2R5PWZhbHNlXHJcbiAgICAgI3N3YWdnZXIuc2VjdXJpdHkgPSBbe1xyXG4gICAgICAgICAgICBcImJlYXJlckF1dGhcIjogW11cclxuICAgICB9XVxyXG4gICAgICNzd2FnZ2VyLnBhcmFtZXRlcnNbXCJzZXNzaW9uXCJdID0ge1xyXG4gICAgICBzY2hlbWE6ICdORVJEV0hBVFNfQU1FUklDQSdcclxuICAgICB9XHJcbiAgICAgI3N3YWdnZXIucGFyYW1ldGVyc1tcInBob25lXCJdID0ge1xyXG4gICAgICBzY2hlbWE6ICc1NTIxOTk5OTk5OTk5JyxcclxuICAgICB9XHJcbiAgICovXHJcbiAgY29uc3QgeyBwaG9uZSB9ID0gcmVxLnBhcmFtcztcclxuICB0cnkge1xyXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCByZXEuY2xpZW50LmdldENoYXRJc09ubGluZShgJHtwaG9uZX1AYy51c2ApO1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHsgc3RhdHVzOiAnc3VjY2VzcycsIHJlc3BvbnNlOiByZXNwb25zZSB9KTtcclxuICB9IGNhdGNoIChlKSB7XHJcbiAgICByZXEubG9nZ2VyLmVycm9yKGUpO1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgc3RhdHVzOiAnZXJyb3InLFxyXG4gICAgICByZXNwb25zZTogJ0Vycm9yIG9uIGdldCBjaGF0IGlzIG9ubGluZScsXHJcbiAgICAgIGVycm9yOiBlLFxyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0TGFzdFNlZW4ocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKSB7XHJcbiAgLyoqXHJcbiAgICAgI3N3YWdnZXIudGFncyA9IFtcIkNoYXRcIl1cclxuICAgICAjc3dhZ2dlci5hdXRvQm9keT1mYWxzZVxyXG4gICAgICNzd2FnZ2VyLnNlY3VyaXR5ID0gW3tcclxuICAgICAgICAgICAgXCJiZWFyZXJBdXRoXCI6IFtdXHJcbiAgICAgfV1cclxuICAgICAjc3dhZ2dlci5wYXJhbWV0ZXJzW1wic2Vzc2lvblwiXSA9IHtcclxuICAgICAgc2NoZW1hOiAnTkVSRFdIQVRTX0FNRVJJQ0EnXHJcbiAgICAgfVxyXG4gICAgICNzd2FnZ2VyLnBhcmFtZXRlcnNbXCJwaG9uZVwiXSA9IHtcclxuICAgICAgc2NoZW1hOiAnNTUyMTk5OTk5OTk5OScsXHJcbiAgICAgfVxyXG4gICAqL1xyXG4gIGNvbnN0IHsgcGhvbmUgfSA9IHJlcS5wYXJhbXM7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgcmVxLmNsaWVudC5nZXRMYXN0U2VlbihgJHtwaG9uZX1AYy51c2ApO1xyXG5cclxuICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7IHN0YXR1czogJ3N1Y2Nlc3MnLCByZXNwb25zZTogcmVzcG9uc2UgfSk7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIHJlcS5sb2dnZXIuZXJyb3IoZXJyb3IpO1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgc3RhdHVzOiAnZXJyb3InLFxyXG4gICAgICByZXNwb25zZTogJ0Vycm9yIG9uIGdldCBjaGF0IGxhc3Qgc2VlbicsXHJcbiAgICAgIGVycm9yOiBlcnJvcixcclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldExpc3RNdXRlcyhyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpIHtcclxuICAvKipcclxuICAgICAjc3dhZ2dlci50YWdzID0gW1wiQ2hhdFwiXVxyXG4gICAgICNzd2FnZ2VyLmF1dG9Cb2R5PWZhbHNlXHJcbiAgICAgI3N3YWdnZXIuc2VjdXJpdHkgPSBbe1xyXG4gICAgICAgICAgICBcImJlYXJlckF1dGhcIjogW11cclxuICAgICB9XVxyXG4gICAgICNzd2FnZ2VyLnBhcmFtZXRlcnNbXCJzZXNzaW9uXCJdID0ge1xyXG4gICAgICBzY2hlbWE6ICdORVJEV0hBVFNfQU1FUklDQSdcclxuICAgICB9XHJcbiAgICAgI3N3YWdnZXIucGFyYW1ldGVyc1tcInR5cGVcIl0gPSB7XHJcbiAgICAgIHNjaGVtYTogJ2FsbCcsXHJcbiAgICAgfVxyXG4gICAqL1xyXG4gIGNvbnN0IHsgdHlwZSA9ICdhbGwnIH0gPSByZXEucGFyYW1zO1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHJlcS5jbGllbnQuZ2V0TGlzdE11dGVzKHR5cGUpO1xyXG5cclxuICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7IHN0YXR1czogJ3N1Y2Nlc3MnLCByZXNwb25zZTogcmVzcG9uc2UgfSk7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIHJlcS5sb2dnZXIuZXJyb3IoZXJyb3IpO1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgc3RhdHVzOiAnZXJyb3InLFxyXG4gICAgICByZXNwb25zZTogJ0Vycm9yIG9uIGdldCBsaXN0IG11dGVzJyxcclxuICAgICAgZXJyb3I6IGVycm9yLFxyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbG9hZEFuZEdldEFsbE1lc3NhZ2VzSW5DaGF0KHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSkge1xyXG4gIC8qKlxyXG4gICAgICNzd2FnZ2VyLmRlcHJlY2F0ZWQ9dHJ1ZVxyXG4gICAgICNzd2FnZ2VyLnRhZ3MgPSBbXCJDaGF0XCJdXHJcbiAgICAgI3N3YWdnZXIuYXV0b0JvZHk9ZmFsc2VcclxuICAgICAjc3dhZ2dlci5zZWN1cml0eSA9IFt7XHJcbiAgICAgICAgICAgIFwiYmVhcmVyQXV0aFwiOiBbXVxyXG4gICAgIH1dXHJcbiAgICAgI3N3YWdnZXIucGFyYW1ldGVyc1tcInNlc3Npb25cIl0gPSB7XHJcbiAgICAgIHNjaGVtYTogJ05FUkRXSEFUU19BTUVSSUNBJ1xyXG4gICAgIH1cclxuICAgICAjc3dhZ2dlci5wYXJhbWV0ZXJzW1wicGhvbmVcIl0gPSB7XHJcbiAgICAgIHNjaGVtYTogJzU1MjE5OTk5OTk5OTknXHJcbiAgICAgfVxyXG4gICAgICNzd2FnZ2VyLnBhcmFtZXRlcnNbXCJpbmNsdWRlTWVcIl0gPSB7XHJcbiAgICAgIHNjaGVtYTogJ3RydWUnXHJcbiAgICAgfVxyXG4gICAgICNzd2FnZ2VyLnBhcmFtZXRlcnNbXCJpbmNsdWRlTm90aWZpY2F0aW9uc1wiXSA9IHtcclxuICAgICAgc2NoZW1hOiAnZmFsc2UnXHJcbiAgICAgfVxyXG4gICAqL1xyXG4gIGNvbnN0IHsgcGhvbmUsIGluY2x1ZGVNZSA9IHRydWUsIGluY2x1ZGVOb3RpZmljYXRpb25zID0gZmFsc2UgfSA9IHJlcS5wYXJhbXM7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgcmVxLmNsaWVudC5sb2FkQW5kR2V0QWxsTWVzc2FnZXNJbkNoYXQoXHJcbiAgICAgIGAke3Bob25lfUBjLnVzYCxcclxuICAgICAgaW5jbHVkZU1lIGFzIGJvb2xlYW4sXHJcbiAgICAgIGluY2x1ZGVOb3RpZmljYXRpb25zIGFzIGJvb2xlYW5cclxuICAgICk7XHJcblxyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHsgc3RhdHVzOiAnc3VjY2VzcycsIHJlc3BvbnNlOiByZXNwb25zZSB9KTtcclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgcmVxLmxvZ2dlci5lcnJvcihlcnJvcik7XHJcbiAgICByZXR1cm4gcmVzXHJcbiAgICAgIC5zdGF0dXMoNTAwKVxyXG4gICAgICAuanNvbih7IHN0YXR1czogJ2Vycm9yJywgcmVzcG9uc2U6ICdFcnJvciBvbiBvcGVuIGxpc3QnLCBlcnJvcjogZXJyb3IgfSk7XHJcbiAgfVxyXG59XHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRNZXNzYWdlcyhyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpIHtcclxuICAvKipcclxuICAgICAjc3dhZ2dlci50YWdzID0gW1wiTWVzc2FnZXNcIl1cclxuICAgICAjc3dhZ2dlci5hdXRvQm9keT1mYWxzZVxyXG4gICAgICNzd2FnZ2VyLnNlY3VyaXR5ID0gW3tcclxuICAgICAgICAgICAgXCJiZWFyZXJBdXRoXCI6IFtdXHJcbiAgICAgfV1cclxuICAgICAjc3dhZ2dlci5wYXJhbWV0ZXJzW1wic2Vzc2lvblwiXSA9IHtcclxuICAgICAgc2NoZW1hOiAnTkVSRFdIQVRTX0FNRVJJQ0EnXHJcbiAgICAgfVxyXG4gICAgICNzd2FnZ2VyLnBhcmFtZXRlcnNbXCJwaG9uZVwiXSA9IHtcclxuICAgICAgc2NoZW1hOiAnNTUyMTk5OTk5OTk5OUBjLnVzJ1xyXG4gICAgIH1cclxuICAgICAjc3dhZ2dlci5wYXJhbWV0ZXJzW1wiY291bnRcIl0gPSB7XHJcbiAgICAgIHNjaGVtYTogJzIwJ1xyXG4gICAgIH1cclxuICAgICAjc3dhZ2dlci5wYXJhbWV0ZXJzW1wiZGlyZWN0aW9uXCJdID0ge1xyXG4gICAgICBzY2hlbWE6ICdiZWZvcmUnXHJcbiAgICAgfVxyXG4gICAgICNzd2FnZ2VyLnBhcmFtZXRlcnNbXCJpZFwiXSA9IHtcclxuICAgICAgc2NoZW1hOiAnPG1lc3NhZ2VfaWRfdG9fdXNlX2RpcmVjdGlvbj4nXHJcbiAgICAgfVxyXG4gICAqL1xyXG4gIGNvbnN0IHsgcGhvbmUgfSA9IHJlcS5wYXJhbXM7XHJcbiAgY29uc3QgeyBjb3VudCA9IDIwLCBkaXJlY3Rpb24gPSAnYmVmb3JlJywgaWQgPSBudWxsIH0gPSByZXEucXVlcnk7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgcmVxLmNsaWVudC5nZXRNZXNzYWdlcyhgJHtwaG9uZX1gLCB7XHJcbiAgICAgIGNvdW50OiBwYXJzZUludChjb3VudCBhcyBzdHJpbmcpLFxyXG4gICAgICBkaXJlY3Rpb246IGRpcmVjdGlvbi50b1N0cmluZygpIGFzIGFueSxcclxuICAgICAgaWQ6IGlkIGFzIHN0cmluZyxcclxuICAgIH0pO1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHsgc3RhdHVzOiAnc3VjY2VzcycsIHJlc3BvbnNlOiByZXNwb25zZSB9KTtcclxuICB9IGNhdGNoIChlKSB7XHJcbiAgICByZXEubG9nZ2VyLmVycm9yKGUpO1xyXG4gICAgcmV0dXJuIHJlc1xyXG4gICAgICAuc3RhdHVzKDQwMSlcclxuICAgICAgLmpzb24oeyBzdGF0dXM6ICdlcnJvcicsIHJlc3BvbnNlOiAnRXJyb3Igb24gb3BlbiBsaXN0JywgZXJyb3I6IGUgfSk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2VuZENvbnRhY3RWY2FyZChyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpIHtcclxuICAvKipcclxuICAgICAjc3dhZ2dlci50YWdzID0gW1wiTWVzc2FnZXNcIl1cclxuICAgICAjc3dhZ2dlci5hdXRvQm9keT1mYWxzZVxyXG4gICAgICNzd2FnZ2VyLnNlY3VyaXR5ID0gW3tcclxuICAgICAgICAgICAgXCJiZWFyZXJBdXRoXCI6IFtdXHJcbiAgICAgfV1cclxuICAgICAjc3dhZ2dlci5wYXJhbWV0ZXJzW1wic2Vzc2lvblwiXSA9IHtcclxuICAgICAgc2NoZW1hOiAnTkVSRFdIQVRTX0FNRVJJQ0EnXHJcbiAgICAgfVxyXG4gICAgICNzd2FnZ2VyLnJlcXVlc3RCb2R5ID0ge1xyXG4gICAgICByZXF1aXJlZDogdHJ1ZSxcclxuICAgICAgXCJAY29udGVudFwiOiB7XHJcbiAgICAgICAgXCJhcHBsaWNhdGlvbi9qc29uXCI6IHtcclxuICAgICAgICAgIHNjaGVtYToge1xyXG4gICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgcGhvbmU6IHsgdHlwZTogXCJzdHJpbmdcIiB9LFxyXG4gICAgICAgICAgICAgIGlzR3JvdXA6IHsgdHlwZTogXCJib29sZWFuXCIgfSxcclxuICAgICAgICAgICAgICBuYW1lOiB7IHR5cGU6IFwic3RyaW5nXCIgfSxcclxuICAgICAgICAgICAgICBjb250YWN0c0lkOiB7IHR5cGU6IFwiYXJyYXlcIiB9LFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgZXhhbXBsZXM6IHtcclxuICAgICAgICAgICAgXCJEZWZhdWx0XCI6IHtcclxuICAgICAgICAgICAgICB2YWx1ZToge1xyXG4gICAgICAgICAgICAgICAgcGhvbmU6IFwiNTUyMTk5OTk5OTk5OVwiLFxyXG4gICAgICAgICAgICAgICAgaXNHcm91cDogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICBuYW1lOiAnTmFtZSBvZiBjb250YWN0JyxcclxuICAgICAgICAgICAgICAgIGNvbnRhY3RzSWQ6IFsnNTUyMTk5OTk5OTk5OSddLFxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICB9XHJcbiAgICovXHJcbiAgY29uc3QgeyBwaG9uZSwgY29udGFjdHNJZCwgbmFtZSA9IG51bGwsIGlzR3JvdXAgPSBmYWxzZSB9ID0gcmVxLmJvZHk7XHJcbiAgdHJ5IHtcclxuICAgIGxldCByZXNwb25zZTtcclxuICAgIGZvciAoY29uc3QgY29udGF0byBvZiBjb250YWN0VG9BcnJheShwaG9uZSwgaXNHcm91cCkpIHtcclxuICAgICAgcmVzcG9uc2UgPSBhd2FpdCByZXEuY2xpZW50LnNlbmRDb250YWN0VmNhcmQoXHJcbiAgICAgICAgYCR7Y29udGF0b31gLFxyXG4gICAgICAgIGNvbnRhY3RzSWQsXHJcbiAgICAgICAgbmFtZVxyXG4gICAgICApO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7IHN0YXR1czogJ3N1Y2Nlc3MnLCByZXNwb25zZTogcmVzcG9uc2UgfSk7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIHJlcS5sb2dnZXIuZXJyb3IoZXJyb3IpO1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgc3RhdHVzOiAnZXJyb3InLFxyXG4gICAgICBtZXNzYWdlOiAnRXJyb3Igb24gc2VuZCBjb250YWN0IHZjYXJkJyxcclxuICAgICAgZXJyb3I6IGVycm9yLFxyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2VuZE11dGUocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKSB7XHJcbiAgLyoqXHJcbiAgICAgI3N3YWdnZXIudGFncyA9IFtcIkNoYXRcIl1cclxuICAgICAjc3dhZ2dlci5hdXRvQm9keT1mYWxzZVxyXG4gICAgICNzd2FnZ2VyLnNlY3VyaXR5ID0gW3tcclxuICAgICAgICAgICAgXCJiZWFyZXJBdXRoXCI6IFtdXHJcbiAgICAgfV1cclxuICAgICAjc3dhZ2dlci5wYXJhbWV0ZXJzW1wic2Vzc2lvblwiXSA9IHtcclxuICAgICAgc2NoZW1hOiAnTkVSRFdIQVRTX0FNRVJJQ0EnXHJcbiAgICAgfVxyXG4gICAgI3N3YWdnZXIucmVxdWVzdEJvZHkgPSB7XHJcbiAgICAgIHJlcXVpcmVkOiB0cnVlLFxyXG4gICAgICBcIkBjb250ZW50XCI6IHtcclxuICAgICAgICBcImFwcGxpY2F0aW9uL2pzb25cIjoge1xyXG4gICAgICAgICAgc2NoZW1hOiB7XHJcbiAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICBwaG9uZTogeyB0eXBlOiBcInN0cmluZ1wiIH0sXHJcbiAgICAgICAgICAgICAgaXNHcm91cDogeyB0eXBlOiBcImJvb2xlYW5cIiB9LFxyXG4gICAgICAgICAgICAgIHRpbWU6IHsgdHlwZTogXCJudW1iZXJcIiB9LFxyXG4gICAgICAgICAgICAgIHR5cGU6IHsgdHlwZTogXCJzdHJpbmdcIiB9LFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgZXhhbXBsZXM6IHtcclxuICAgICAgICAgICAgXCJEZWZhdWx0XCI6IHtcclxuICAgICAgICAgICAgICB2YWx1ZToge1xyXG4gICAgICAgICAgICAgICAgcGhvbmU6IFwiNTUyMTk5OTk5OTk5OVwiLFxyXG4gICAgICAgICAgICAgICAgaXNHcm91cDogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICB0aW1lOiAxLFxyXG4gICAgICAgICAgICAgICAgdHlwZTogJ2hvdXJzJyxcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgfVxyXG4gICAqL1xyXG4gIGNvbnN0IHsgcGhvbmUsIHRpbWUsIHR5cGUgPSAnaG91cnMnLCBpc0dyb3VwID0gZmFsc2UgfSA9IHJlcS5ib2R5O1xyXG5cclxuICB0cnkge1xyXG4gICAgbGV0IHJlc3BvbnNlO1xyXG4gICAgZm9yIChjb25zdCBjb250YXRvIG9mIGNvbnRhY3RUb0FycmF5KHBob25lLCBpc0dyb3VwKSkge1xyXG4gICAgICByZXNwb25zZSA9IGF3YWl0IHJlcS5jbGllbnQuc2VuZE11dGUoYCR7Y29udGF0b31gLCB0aW1lLCB0eXBlKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oeyBzdGF0dXM6ICdzdWNjZXNzJywgcmVzcG9uc2U6IHJlc3BvbnNlIH0pO1xyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICByZXEubG9nZ2VyLmVycm9yKGVycm9yKTtcclxuICAgIHJldHVybiByZXNcclxuICAgICAgLnN0YXR1cyg1MDApXHJcbiAgICAgIC5qc29uKHsgc3RhdHVzOiAnZXJyb3InLCBtZXNzYWdlOiAnRXJyb3Igb24gc2VuZCBtdXRlJywgZXJyb3I6IGVycm9yIH0pO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNlbmRTZWVuKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSkge1xyXG4gIC8qKlxyXG4gICAgICNzd2FnZ2VyLnRhZ3MgPSBbXCJDaGF0XCJdXHJcbiAgICAgI3N3YWdnZXIuYXV0b0JvZHk9ZmFsc2VcclxuICAgICAjc3dhZ2dlci5zZWN1cml0eSA9IFt7XHJcbiAgICAgICAgICAgIFwiYmVhcmVyQXV0aFwiOiBbXVxyXG4gICAgIH1dXHJcbiAgICAgI3N3YWdnZXIucGFyYW1ldGVyc1tcInNlc3Npb25cIl0gPSB7XHJcbiAgICAgIHNjaGVtYTogJ05FUkRXSEFUU19BTUVSSUNBJ1xyXG4gICAgIH1cclxuICAgICAjc3dhZ2dlci5yZXF1ZXN0Qm9keSA9IHtcclxuICAgICAgcmVxdWlyZWQ6IHRydWUsXHJcbiAgICAgIFwiQGNvbnRlbnRcIjoge1xyXG4gICAgICAgIFwiYXBwbGljYXRpb24vanNvblwiOiB7XHJcbiAgICAgICAgICBzY2hlbWE6IHtcclxuICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgIHBob25lOiB7IHR5cGU6IFwic3RyaW5nXCIgfSxcclxuICAgICAgICAgICAgICBpc0dyb3VwOiB7IHR5cGU6IFwiYm9vbGVhblwiIH0sXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICBleGFtcGxlczoge1xyXG4gICAgICAgICAgICBcIkRlZmF1bHRcIjoge1xyXG4gICAgICAgICAgICAgIHZhbHVlOiB7XHJcbiAgICAgICAgICAgICAgICBwaG9uZTogXCI1NTIxOTk5OTk5OTk5XCIsXHJcbiAgICAgICAgICAgICAgICBpc0dyb3VwOiBmYWxzZSxcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgfVxyXG4gICAqL1xyXG4gIGNvbnN0IHsgcGhvbmUgfSA9IHJlcS5ib2R5O1xyXG4gIGNvbnN0IHNlc3Npb24gPSByZXEuc2Vzc2lvbjtcclxuXHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHJlc3VsdHM6IGFueSA9IFtdO1xyXG4gICAgZm9yIChjb25zdCBjb250YXRvIG9mIHBob25lKSB7XHJcbiAgICAgIHJlc3VsdHMucHVzaChhd2FpdCByZXEuY2xpZW50LnNlbmRTZWVuKGNvbnRhdG8pKTtcclxuICAgIH1cclxuICAgIHJldHVyblN1Y2VzcyhyZXMsIHNlc3Npb24sIHBob25lLCByZXN1bHRzKTtcclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgcmV0dXJuRXJyb3IocmVxLCByZXMsIHNlc3Npb24sIGVycm9yKTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzZXRDaGF0U3RhdGUocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKSB7XHJcbiAgLyoqXHJcbiAgICAgI3N3YWdnZXIuZGVwcmVjYXRlZD10cnVlXHJcbiAgICAgI3N3YWdnZXIudGFncyA9IFtcIkNoYXRcIl1cclxuICAgICAjc3dhZ2dlci5hdXRvQm9keT1mYWxzZVxyXG4gICAgICNzd2FnZ2VyLnNlY3VyaXR5ID0gW3tcclxuICAgICAgICAgICAgXCJiZWFyZXJBdXRoXCI6IFtdXHJcbiAgICAgfV1cclxuICAgICAjc3dhZ2dlci5wYXJhbWV0ZXJzW1wic2Vzc2lvblwiXSA9IHtcclxuICAgICAgc2NoZW1hOiAnTkVSRFdIQVRTX0FNRVJJQ0EnXHJcbiAgICAgfVxyXG4gICAgICNzd2FnZ2VyLnJlcXVlc3RCb2R5ID0ge1xyXG4gICAgICByZXF1aXJlZDogdHJ1ZSxcclxuICAgICAgXCJAY29udGVudFwiOiB7XHJcbiAgICAgICAgXCJhcHBsaWNhdGlvbi9qc29uXCI6IHtcclxuICAgICAgICAgIHNjaGVtYToge1xyXG4gICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgcGhvbmU6IHsgdHlwZTogXCJzdHJpbmdcIiB9LFxyXG4gICAgICAgICAgICAgIGlzR3JvdXA6IHsgdHlwZTogXCJib29sZWFuXCIgfSxcclxuICAgICAgICAgICAgICBjaGF0c3RhdGU6IHsgdHlwZTogXCJzdHJpbmdcIiB9LFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgZXhhbXBsZXM6IHtcclxuICAgICAgICAgICAgXCJEZWZhdWx0XCI6IHtcclxuICAgICAgICAgICAgICB2YWx1ZToge1xyXG4gICAgICAgICAgICAgICAgcGhvbmU6IFwiNTUyMTk5OTk5OTk5OVwiLFxyXG4gICAgICAgICAgICAgICAgaXNHcm91cDogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICBjaGF0c3RhdGU6IFwiMVwiLFxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICB9XHJcbiAgICovXHJcbiAgY29uc3QgeyBwaG9uZSwgY2hhdHN0YXRlLCBpc0dyb3VwID0gZmFsc2UgfSA9IHJlcS5ib2R5O1xyXG5cclxuICB0cnkge1xyXG4gICAgbGV0IHJlc3BvbnNlO1xyXG4gICAgZm9yIChjb25zdCBjb250YXRvIG9mIGNvbnRhY3RUb0FycmF5KHBob25lLCBpc0dyb3VwKSkge1xyXG4gICAgICByZXNwb25zZSA9IGF3YWl0IHJlcS5jbGllbnQuc2V0Q2hhdFN0YXRlKGAke2NvbnRhdG99YCwgY2hhdHN0YXRlKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oeyBzdGF0dXM6ICdzdWNjZXNzJywgcmVzcG9uc2U6IHJlc3BvbnNlIH0pO1xyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICByZXEubG9nZ2VyLmVycm9yKGVycm9yKTtcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7XHJcbiAgICAgIHN0YXR1czogJ2Vycm9yJyxcclxuICAgICAgbWVzc2FnZTogJ0Vycm9yIG9uIHNlbmQgY2hhdCBzdGF0ZScsXHJcbiAgICAgIGVycm9yOiBlcnJvcixcclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNldFRlbXBvcmFyeU1lc3NhZ2VzKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSkge1xyXG4gIC8qKlxyXG4gICAgICNzd2FnZ2VyLnRhZ3MgPSBbXCJNZXNzYWdlc1wiXVxyXG4gICAgICNzd2FnZ2VyLmF1dG9Cb2R5PWZhbHNlXHJcbiAgICAgI3N3YWdnZXIuc2VjdXJpdHkgPSBbe1xyXG4gICAgICAgICAgICBcImJlYXJlckF1dGhcIjogW11cclxuICAgICB9XVxyXG4gICAgICNzd2FnZ2VyLnBhcmFtZXRlcnNbXCJzZXNzaW9uXCJdID0ge1xyXG4gICAgICBzY2hlbWE6ICdORVJEV0hBVFNfQU1FUklDQSdcclxuICAgICB9XHJcbiAgICAgI3N3YWdnZXIucmVxdWVzdEJvZHkgPSB7XHJcbiAgICAgIHJlcXVpcmVkOiB0cnVlLFxyXG4gICAgICBcIkBjb250ZW50XCI6IHtcclxuICAgICAgICBcImFwcGxpY2F0aW9uL2pzb25cIjoge1xyXG4gICAgICAgICAgc2NoZW1hOiB7XHJcbiAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICBwaG9uZTogeyB0eXBlOiBcInN0cmluZ1wiIH0sXHJcbiAgICAgICAgICAgICAgaXNHcm91cDogeyB0eXBlOiBcImJvb2xlYW5cIiB9LFxyXG4gICAgICAgICAgICAgIHZhbHVlOiB7IHR5cGU6IFwiYm9vbGVhblwiIH0sXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICBleGFtcGxlczoge1xyXG4gICAgICAgICAgICBcIkRlZmF1bHRcIjoge1xyXG4gICAgICAgICAgICAgIHZhbHVlOiB7XHJcbiAgICAgICAgICAgICAgICBwaG9uZTogXCI1NTIxOTk5OTk5OTk5XCIsXHJcbiAgICAgICAgICAgICAgICBpc0dyb3VwOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgIHZhbHVlOiB0cnVlLFxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICB9XHJcbiAgICovXHJcbiAgY29uc3QgeyBwaG9uZSwgdmFsdWUgPSB0cnVlLCBpc0dyb3VwID0gZmFsc2UgfSA9IHJlcS5ib2R5O1xyXG5cclxuICB0cnkge1xyXG4gICAgbGV0IHJlc3BvbnNlO1xyXG4gICAgZm9yIChjb25zdCBjb250YXRvIG9mIGNvbnRhY3RUb0FycmF5KHBob25lLCBpc0dyb3VwKSkge1xyXG4gICAgICByZXNwb25zZSA9IGF3YWl0IHJlcS5jbGllbnQuc2V0VGVtcG9yYXJ5TWVzc2FnZXMoYCR7Y29udGF0b31gLCB2YWx1ZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHsgc3RhdHVzOiAnc3VjY2VzcycsIHJlc3BvbnNlOiByZXNwb25zZSB9KTtcclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgcmVxLmxvZ2dlci5lcnJvcihlcnJvcik7XHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oe1xyXG4gICAgICBzdGF0dXM6ICdlcnJvcicsXHJcbiAgICAgIG1lc3NhZ2U6ICdFcnJvciBvbiBzZXQgdGVtcG9yYXJ5IG1lc3NhZ2VzJyxcclxuICAgICAgZXJyb3I6IGVycm9yLFxyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2V0VHlwaW5nKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSkge1xyXG4gIC8qKlxyXG4gICAgICNzd2FnZ2VyLnRhZ3MgPSBbXCJDaGF0XCJdXHJcbiAgICAgI3N3YWdnZXIuYXV0b0JvZHk9ZmFsc2VcclxuICAgICAjc3dhZ2dlci5zZWN1cml0eSA9IFt7XHJcbiAgICAgICAgICAgIFwiYmVhcmVyQXV0aFwiOiBbXVxyXG4gICAgIH1dXHJcbiAgICAgI3N3YWdnZXIucGFyYW1ldGVyc1tcInNlc3Npb25cIl0gPSB7XHJcbiAgICAgIHNjaGVtYTogJ05FUkRXSEFUU19BTUVSSUNBJ1xyXG4gICAgIH1cclxuICAgICAjc3dhZ2dlci5yZXF1ZXN0Qm9keSA9IHtcclxuICAgICAgcmVxdWlyZWQ6IHRydWUsXHJcbiAgICAgIFwiQGNvbnRlbnRcIjoge1xyXG4gICAgICAgIFwiYXBwbGljYXRpb24vanNvblwiOiB7XHJcbiAgICAgICAgICBzY2hlbWE6IHtcclxuICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgIHBob25lOiB7IHR5cGU6IFwic3RyaW5nXCIgfSxcclxuICAgICAgICAgICAgICBpc0dyb3VwOiB7IHR5cGU6IFwiYm9vbGVhblwiIH0sXHJcbiAgICAgICAgICAgICAgdmFsdWU6IHsgdHlwZTogXCJib29sZWFuXCIgfSxcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIGV4YW1wbGVzOiB7XHJcbiAgICAgICAgICAgIFwiRGVmYXVsdFwiOiB7XHJcbiAgICAgICAgICAgICAgdmFsdWU6IHtcclxuICAgICAgICAgICAgICAgIHBob25lOiBcIjU1MjE5OTk5OTk5OTlcIixcclxuICAgICAgICAgICAgICAgIGlzR3JvdXA6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgdmFsdWU6IHRydWUsXHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgIH1cclxuICAgKi9cclxuICBjb25zdCB7IHBob25lLCB2YWx1ZSA9IHRydWUsIGlzR3JvdXAgPSBmYWxzZSB9ID0gcmVxLmJvZHk7XHJcbiAgdHJ5IHtcclxuICAgIGxldCByZXNwb25zZTtcclxuICAgIGZvciAoY29uc3QgY29udGF0byBvZiBjb250YWN0VG9BcnJheShwaG9uZSwgaXNHcm91cCkpIHtcclxuICAgICAgaWYgKHZhbHVlKSByZXNwb25zZSA9IGF3YWl0IHJlcS5jbGllbnQuc3RhcnRUeXBpbmcoY29udGF0byk7XHJcbiAgICAgIGVsc2UgcmVzcG9uc2UgPSBhd2FpdCByZXEuY2xpZW50LnN0b3BUeXBpbmcoY29udGF0byk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHsgc3RhdHVzOiAnc3VjY2VzcycsIHJlc3BvbnNlOiByZXNwb25zZSB9KTtcclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgcmVxLmxvZ2dlci5lcnJvcihlcnJvcik7XHJcbiAgICByZXR1cm4gcmVzXHJcbiAgICAgIC5zdGF0dXMoNTAwKVxyXG4gICAgICAuanNvbih7IHN0YXR1czogJ2Vycm9yJywgbWVzc2FnZTogJ0Vycm9yIG9uIHNldCB0eXBpbmcnLCBlcnJvcjogZXJyb3IgfSk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2V0UmVjb3JkaW5nKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSkge1xyXG4gIC8qKlxyXG4gICAgICNzd2FnZ2VyLnRhZ3MgPSBbXCJDaGF0XCJdXHJcbiAgICAgI3N3YWdnZXIuYXV0b0JvZHk9ZmFsc2VcclxuICAgICAjc3dhZ2dlci5zZWN1cml0eSA9IFt7XHJcbiAgICAgICAgICAgIFwiYmVhcmVyQXV0aFwiOiBbXVxyXG4gICAgIH1dXHJcbiAgICAgI3N3YWdnZXIucGFyYW1ldGVyc1tcInNlc3Npb25cIl0gPSB7XHJcbiAgICAgIHNjaGVtYTogJ05FUkRXSEFUU19BTUVSSUNBJ1xyXG4gICAgIH1cclxuICAgICBcclxuICAgICAjc3dhZ2dlci5yZXF1ZXN0Qm9keSA9IHtcclxuICAgICAgcmVxdWlyZWQ6IHRydWUsXHJcbiAgICAgIFwiQGNvbnRlbnRcIjoge1xyXG4gICAgICAgIFwiYXBwbGljYXRpb24vanNvblwiOiB7XHJcbiAgICAgICAgICBzY2hlbWE6IHtcclxuICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgIHBob25lOiB7IHR5cGU6IFwic3RyaW5nXCIgfSxcclxuICAgICAgICAgICAgICBpc0dyb3VwOiB7IHR5cGU6IFwiYm9vbGVhblwiIH0sXHJcbiAgICAgICAgICAgICAgZHVyYXRpb246IHsgdHlwZTogXCJudW1iZXJcIiB9LFxyXG4gICAgICAgICAgICAgIHZhbHVlOiB7IHR5cGU6IFwiYm9vbGVhblwiIH0sXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICBleGFtcGxlczoge1xyXG4gICAgICAgICAgICBcIkRlZmF1bHRcIjoge1xyXG4gICAgICAgICAgICAgIHZhbHVlOiB7XHJcbiAgICAgICAgICAgICAgICBwaG9uZTogXCI1NTIxOTk5OTk5OTk5XCIsXHJcbiAgICAgICAgICAgICAgICBpc0dyb3VwOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgIGR1cmF0aW9uOiA1LFxyXG4gICAgICAgICAgICAgICAgdmFsdWU6IHRydWUsXHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgIH1cclxuICAgKi9cclxuICBjb25zdCB7IHBob25lLCB2YWx1ZSA9IHRydWUsIGR1cmF0aW9uLCBpc0dyb3VwID0gZmFsc2UgfSA9IHJlcS5ib2R5O1xyXG4gIHRyeSB7XHJcbiAgICBsZXQgcmVzcG9uc2U7XHJcbiAgICBmb3IgKGNvbnN0IGNvbnRhdG8gb2YgY29udGFjdFRvQXJyYXkocGhvbmUsIGlzR3JvdXApKSB7XHJcbiAgICAgIGlmICh2YWx1ZSkgcmVzcG9uc2UgPSBhd2FpdCByZXEuY2xpZW50LnN0YXJ0UmVjb3JkaW5nKGNvbnRhdG8sIGR1cmF0aW9uKTtcclxuICAgICAgZWxzZSByZXNwb25zZSA9IGF3YWl0IHJlcS5jbGllbnQuc3RvcFJlY29yaW5nKGNvbnRhdG8pO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7IHN0YXR1czogJ3N1Y2Nlc3MnLCByZXNwb25zZTogcmVzcG9uc2UgfSk7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIHJlcS5sb2dnZXIuZXJyb3IoZXJyb3IpO1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgc3RhdHVzOiAnZXJyb3InLFxyXG4gICAgICBtZXNzYWdlOiAnRXJyb3Igb24gc2V0IHJlY29yZGluZycsXHJcbiAgICAgIGVycm9yOiBlcnJvcixcclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNoZWNrTnVtYmVyU3RhdHVzKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSkge1xyXG4gIC8qKlxyXG4gICAgICNzd2FnZ2VyLnRhZ3MgPSBbXCJNaXNjXCJdXHJcbiAgICAgI3N3YWdnZXIuYXV0b0JvZHk9ZmFsc2VcclxuICAgICAjc3dhZ2dlci5zZWN1cml0eSA9IFt7XHJcbiAgICAgICAgICAgIFwiYmVhcmVyQXV0aFwiOiBbXVxyXG4gICAgIH1dXHJcbiAgICAgI3N3YWdnZXIucGFyYW1ldGVyc1tcInNlc3Npb25cIl0gPSB7XHJcbiAgICAgIHNjaGVtYTogJ05FUkRXSEFUU19BTUVSSUNBJ1xyXG4gICAgIH1cclxuICAgICAjc3dhZ2dlci5wYXJhbWV0ZXJzW1wicGhvbmVcIl0gPSB7XHJcbiAgICAgIHNjaGVtYTogJzU1MjE5OTk5OTk5OTknXHJcbiAgICAgfVxyXG4gICAqL1xyXG4gIGNvbnN0IHsgcGhvbmUgfSA9IHJlcS5wYXJhbXM7XHJcbiAgdHJ5IHtcclxuICAgIGxldCByZXNwb25zZTtcclxuICAgIGZvciAoY29uc3QgY29udGF0byBvZiBjb250YWN0VG9BcnJheShwaG9uZSwgZmFsc2UpKSB7XHJcbiAgICAgIHJlc3BvbnNlID0gYXdhaXQgcmVxLmNsaWVudC5jaGVja051bWJlclN0YXR1cyhgJHtjb250YXRvfWApO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7IHN0YXR1czogJ3N1Y2Nlc3MnLCByZXNwb25zZTogcmVzcG9uc2UgfSk7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIHJlcS5sb2dnZXIuZXJyb3IoZXJyb3IpO1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgc3RhdHVzOiAnZXJyb3InLFxyXG4gICAgICBtZXNzYWdlOiAnRXJyb3Igb24gY2hlY2sgbnVtYmVyIHN0YXR1cycsXHJcbiAgICAgIGVycm9yOiBlcnJvcixcclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldENvbnRhY3QocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKSB7XHJcbiAgLyoqXHJcbiAgICAgI3N3YWdnZXIudGFncyA9IFtcIkNoYXRcIl1cclxuICAgICAjc3dhZ2dlci5hdXRvQm9keT1mYWxzZVxyXG4gICAgICNzd2FnZ2VyLnNlY3VyaXR5ID0gW3tcclxuICAgICAgICAgICAgXCJiZWFyZXJBdXRoXCI6IFtdXHJcbiAgICAgfV1cclxuICAgICAjc3dhZ2dlci5wYXJhbWV0ZXJzW1wic2Vzc2lvblwiXSA9IHtcclxuICAgICAgc2NoZW1hOiAnTkVSRFdIQVRTX0FNRVJJQ0EnXHJcbiAgICAgfVxyXG4gICAgICNzd2FnZ2VyLnBhcmFtZXRlcnNbXCJwaG9uZVwiXSA9IHtcclxuICAgICAgc2NoZW1hOiAnNTUyMTk5OTk5OTk5OSdcclxuICAgICB9XHJcbiAgICovXHJcbiAgY29uc3QgeyBwaG9uZSA9IHRydWUgfSA9IHJlcS5wYXJhbXM7XHJcbiAgdHJ5IHtcclxuICAgIGxldCByZXNwb25zZTtcclxuICAgIGZvciAoY29uc3QgY29udGF0byBvZiBjb250YWN0VG9BcnJheShwaG9uZSBhcyBzdHJpbmcsIGZhbHNlKSkge1xyXG4gICAgICByZXNwb25zZSA9IGF3YWl0IHJlcS5jbGllbnQuZ2V0Q29udGFjdChjb250YXRvKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oeyBzdGF0dXM6ICdzdWNjZXNzJywgcmVzcG9uc2U6IHJlc3BvbnNlIH0pO1xyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICByZXEubG9nZ2VyLmVycm9yKGVycm9yKTtcclxuICAgIHJldHVybiByZXNcclxuICAgICAgLnN0YXR1cyg1MDApXHJcbiAgICAgIC5qc29uKHsgc3RhdHVzOiAnZXJyb3InLCBtZXNzYWdlOiAnRXJyb3Igb24gZ2V0IGNvbnRhY3QnLCBlcnJvcjogZXJyb3IgfSk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0QWxsQ29udGFjdHMocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKSB7XHJcbiAgLyoqXHJcbiAgICogI3N3YWdnZXIudGFncyA9IFtcIkNvbnRhY3RcIl1cclxuICAgICAjc3dhZ2dlci5hdXRvQm9keT1mYWxzZVxyXG4gICAgICNzd2FnZ2VyLnNlY3VyaXR5ID0gW3tcclxuICAgICAgICAgICAgXCJiZWFyZXJBdXRoXCI6IFtdXHJcbiAgICAgfV1cclxuICAgICAjc3dhZ2dlci5wYXJhbWV0ZXJzW1wic2Vzc2lvblwiXSA9IHtcclxuICAgICAgc2NoZW1hOiAnTkVSRFdIQVRTX0FNRVJJQ0EnXHJcbiAgICAgfVxyXG4gICAqL1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHJlcS5jbGllbnQuZ2V0QWxsQ29udGFjdHMoKTtcclxuXHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oeyBzdGF0dXM6ICdzdWNjZXNzJywgcmVzcG9uc2U6IHJlc3BvbnNlIH0pO1xyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICByZXEubG9nZ2VyLmVycm9yKGVycm9yKTtcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7XHJcbiAgICAgIHN0YXR1czogJ2Vycm9yJyxcclxuICAgICAgbWVzc2FnZTogJ0Vycm9yIG9uIGdldCBhbGwgY29uc3RhY3RzJyxcclxuICAgICAgZXJyb3I6IGVycm9yLFxyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0TnVtYmVyUHJvZmlsZShyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpIHtcclxuICAvKipcclxuICAgICAjc3dhZ2dlci5kZXByZWNhdGVkPXRydWVcclxuICAgICAjc3dhZ2dlci50YWdzID0gW1wiQ2hhdFwiXVxyXG4gICAgICNzd2FnZ2VyLmF1dG9Cb2R5PWZhbHNlXHJcbiAgICAgI3N3YWdnZXIuc2VjdXJpdHkgPSBbe1xyXG4gICAgICAgICAgICBcImJlYXJlckF1dGhcIjogW11cclxuICAgICB9XVxyXG4gICAgICNzd2FnZ2VyLnBhcmFtZXRlcnNbXCJzZXNzaW9uXCJdID0ge1xyXG4gICAgICBzY2hlbWE6ICdORVJEV0hBVFNfQU1FUklDQSdcclxuICAgICB9XHJcbiAgICAgI3N3YWdnZXIucGFyYW1ldGVyc1tcInBob25lXCJdID0ge1xyXG4gICAgICBzY2hlbWE6ICc1NTIxOTk5OTk5OTk5J1xyXG4gICAgIH1cclxuICAgKi9cclxuICBjb25zdCB7IHBob25lID0gdHJ1ZSB9ID0gcmVxLnBhcmFtcztcclxuICB0cnkge1xyXG4gICAgbGV0IHJlc3BvbnNlO1xyXG4gICAgZm9yIChjb25zdCBjb250YXRvIG9mIGNvbnRhY3RUb0FycmF5KHBob25lIGFzIHN0cmluZywgZmFsc2UpKSB7XHJcbiAgICAgIHJlc3BvbnNlID0gYXdhaXQgcmVxLmNsaWVudC5nZXROdW1iZXJQcm9maWxlKGNvbnRhdG8pO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7IHN0YXR1czogJ3N1Y2Nlc3MnLCByZXNwb25zZTogcmVzcG9uc2UgfSk7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIHJlcS5sb2dnZXIuZXJyb3IoZXJyb3IpO1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgc3RhdHVzOiAnZXJyb3InLFxyXG4gICAgICBtZXNzYWdlOiAnRXJyb3Igb24gZ2V0IG51bWJlciBwcm9maWxlJyxcclxuICAgICAgZXJyb3I6IGVycm9yLFxyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0UHJvZmlsZVBpY0Zyb21TZXJ2ZXIocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKSB7XHJcbiAgLyoqXHJcbiAgICAgI3N3YWdnZXIudGFncyA9IFtcIkNvbnRhY3RcIl1cclxuICAgICAjc3dhZ2dlci5hdXRvQm9keT1mYWxzZVxyXG4gICAgICNzd2FnZ2VyLnNlY3VyaXR5ID0gW3tcclxuICAgICAgICAgICAgXCJiZWFyZXJBdXRoXCI6IFtdXHJcbiAgICAgfV1cclxuICAgICAjc3dhZ2dlci5wYXJhbWV0ZXJzW1wic2Vzc2lvblwiXSA9IHtcclxuICAgICAgc2NoZW1hOiAnTkVSRFdIQVRTX0FNRVJJQ0EnXHJcbiAgICAgfVxyXG4gICAgICNzd2FnZ2VyLnBhcmFtZXRlcnNbXCJwaG9uZVwiXSA9IHtcclxuICAgICAgc2NoZW1hOiAnNTUyMTk5OTk5OTk5OSdcclxuICAgICB9XHJcbiAgICovXHJcbiAgY29uc3QgeyBwaG9uZSA9IHRydWUgfSA9IHJlcS5wYXJhbXM7XHJcbiAgY29uc3QgeyBpc0dyb3VwID0gZmFsc2UgfSA9IHJlcS5xdWVyeTtcclxuICB0cnkge1xyXG4gICAgbGV0IHJlc3BvbnNlO1xyXG4gICAgZm9yIChjb25zdCBjb250YXRvIG9mIGNvbnRhY3RUb0FycmF5KHBob25lIGFzIHN0cmluZywgaXNHcm91cCBhcyBib29sZWFuKSkge1xyXG4gICAgICByZXNwb25zZSA9IGF3YWl0IHJlcS5jbGllbnQuZ2V0UHJvZmlsZVBpY0Zyb21TZXJ2ZXIoY29udGF0byk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHsgc3RhdHVzOiAnc3VjY2VzcycsIHJlc3BvbnNlOiByZXNwb25zZSB9KTtcclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgcmVxLmxvZ2dlci5lcnJvcihlcnJvcik7XHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oe1xyXG4gICAgICBzdGF0dXM6ICdlcnJvcicsXHJcbiAgICAgIG1lc3NhZ2U6ICdFcnJvciBvbiAgZ2V0IHByb2ZpbGUgcGljJyxcclxuICAgICAgZXJyb3I6IGVycm9yLFxyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0U3RhdHVzKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSkge1xyXG4gIC8qKlxyXG4gICAgICNzd2FnZ2VyLnRhZ3MgPSBbXCJDb250YWN0XCJdXHJcbiAgICAgI3N3YWdnZXIuYXV0b0JvZHk9ZmFsc2VcclxuICAgICAjc3dhZ2dlci5zZWN1cml0eSA9IFt7XHJcbiAgICAgICAgICAgIFwiYmVhcmVyQXV0aFwiOiBbXVxyXG4gICAgIH1dXHJcbiAgICAgI3N3YWdnZXIucGFyYW1ldGVyc1tcInNlc3Npb25cIl0gPSB7XHJcbiAgICAgIHNjaGVtYTogJ05FUkRXSEFUU19BTUVSSUNBJ1xyXG4gICAgIH1cclxuICAgICAjc3dhZ2dlci5wYXJhbWV0ZXJzW1wicGhvbmVcIl0gPSB7XHJcbiAgICAgIHNjaGVtYTogJzU1MjE5OTk5OTk5OTknXHJcbiAgICAgfVxyXG4gICAqL1xyXG4gIGNvbnN0IHsgcGhvbmUgPSB0cnVlIH0gPSByZXEucGFyYW1zO1xyXG4gIHRyeSB7XHJcbiAgICBsZXQgcmVzcG9uc2U7XHJcbiAgICBmb3IgKGNvbnN0IGNvbnRhdG8gb2YgY29udGFjdFRvQXJyYXkocGhvbmUgYXMgc3RyaW5nLCBmYWxzZSkpIHtcclxuICAgICAgcmVzcG9uc2UgPSBhd2FpdCByZXEuY2xpZW50LmdldFN0YXR1cyhjb250YXRvKTtcclxuICAgIH1cclxuICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7IHN0YXR1czogJ3N1Y2Nlc3MnLCByZXNwb25zZTogcmVzcG9uc2UgfSk7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIHJlcS5sb2dnZXIuZXJyb3IoZXJyb3IpO1xyXG4gICAgcmV0dXJuIHJlc1xyXG4gICAgICAuc3RhdHVzKDUwMClcclxuICAgICAgLmpzb24oeyBzdGF0dXM6ICdlcnJvcicsIG1lc3NhZ2U6ICdFcnJvciBvbiAgZ2V0IHN0YXR1cycsIGVycm9yOiBlcnJvciB9KTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzZXRQcm9maWxlU3RhdHVzKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSkge1xyXG4gIC8qKlxyXG4gICAgICNzd2FnZ2VyLnRhZ3MgPSBbXCJQcm9maWxlXCJdXHJcbiAgICAgI3N3YWdnZXIuYXV0b0JvZHk9ZmFsc2VcclxuICAgICAjc3dhZ2dlci5zZWN1cml0eSA9IFt7XHJcbiAgICAgICAgICAgIFwiYmVhcmVyQXV0aFwiOiBbXVxyXG4gICAgIH1dXHJcbiAgICAgI3N3YWdnZXIucGFyYW1ldGVyc1tcInNlc3Npb25cIl0gPSB7XHJcbiAgICAgIHNjaGVtYTogJ05FUkRXSEFUU19BTUVSSUNBJ1xyXG4gICAgIH1cclxuICAgICAjc3dhZ2dlci5wYXJhbWV0ZXJzW1wib2JqXCJdID0ge1xyXG4gICAgICBpbjogJ2JvZHknLFxyXG4gICAgICBzY2hlbWE6IHtcclxuICAgICAgICAkc3RhdHVzOiAnTXkgbmV3IHN0YXR1cycsXHJcbiAgICAgIH1cclxuICAgICB9XHJcbiAgICAgXHJcbiAgICAgI3N3YWdnZXIucmVxdWVzdEJvZHkgPSB7XHJcbiAgICAgIHJlcXVpcmVkOiB0cnVlLFxyXG4gICAgICBcIkBjb250ZW50XCI6IHtcclxuICAgICAgICBcImFwcGxpY2F0aW9uL2pzb25cIjoge1xyXG4gICAgICAgICAgc2NoZW1hOiB7XHJcbiAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICBzdGF0dXM6IHsgdHlwZTogXCJzdHJpbmdcIiB9LFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgZXhhbXBsZXM6IHtcclxuICAgICAgICAgICAgXCJEZWZhdWx0XCI6IHtcclxuICAgICAgICAgICAgICB2YWx1ZToge1xyXG4gICAgICAgICAgICAgICAgc3RhdHVzOiBcIk15IG5ldyBzdGF0dXNcIixcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgfVxyXG4gICAqL1xyXG4gIGNvbnN0IHsgc3RhdHVzIH0gPSByZXEuYm9keTtcclxuICB0cnkge1xyXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCByZXEuY2xpZW50LnNldFByb2ZpbGVTdGF0dXMoc3RhdHVzKTtcclxuXHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oeyBzdGF0dXM6ICdzdWNjZXNzJywgcmVzcG9uc2U6IHJlc3BvbnNlIH0pO1xyXG4gIH0gY2F0Y2ggKGUpIHtcclxuICAgIHJlcS5sb2dnZXIuZXJyb3IoZSk7XHJcbiAgICByZXR1cm4gcmVzXHJcbiAgICAgIC5zdGF0dXMoNTAwKVxyXG4gICAgICAuanNvbih7IHN0YXR1czogJ2Vycm9yJywgbWVzc2FnZTogJ0Vycm9yIG9uIHNldCBwcm9maWxlIHN0YXR1cycgfSk7XHJcbiAgfVxyXG59XHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZWplY3RDYWxsKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSkge1xyXG4gIC8qKlxyXG4gICAgICNzd2FnZ2VyLnRhZ3MgPSBbXCJNaXNjXCJdXHJcbiAgICAgI3N3YWdnZXIuYXV0b0JvZHk9ZmFsc2VcclxuICAgICAjc3dhZ2dlci5zZWN1cml0eSA9IFt7XHJcbiAgICAgICAgICAgIFwiYmVhcmVyQXV0aFwiOiBbXVxyXG4gICAgIH1dXHJcbiAgICAgI3N3YWdnZXIucGFyYW1ldGVyc1tcInNlc3Npb25cIl0gPSB7XHJcbiAgICAgIHNjaGVtYTogJ05FUkRXSEFUU19BTUVSSUNBJ1xyXG4gICAgIH1cclxuICAgICBcclxuICAgICAjc3dhZ2dlci5yZXF1ZXN0Qm9keSA9IHtcclxuICAgICAgcmVxdWlyZWQ6IHRydWUsXHJcbiAgICAgIFwiQGNvbnRlbnRcIjoge1xyXG4gICAgICAgIFwiYXBwbGljYXRpb24vanNvblwiOiB7XHJcbiAgICAgICAgICBzY2hlbWE6IHtcclxuICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgIGNhbGxJZDogeyB0eXBlOiBcInN0cmluZ1wiIH0sXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICBleGFtcGxlczoge1xyXG4gICAgICAgICAgICBcIkRlZmF1bHRcIjoge1xyXG4gICAgICAgICAgICAgIHZhbHVlOiB7XHJcbiAgICAgICAgICAgICAgICBjYWxsSWQ6IFwiPGNhbGxpZD5cIixcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgfVxyXG4gICAqL1xyXG4gIGNvbnN0IHsgY2FsbElkIH0gPSByZXEuYm9keTtcclxuICB0cnkge1xyXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCByZXEuY2xpZW50LnJlamVjdENhbGwoY2FsbElkKTtcclxuXHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oeyBzdGF0dXM6ICdzdWNjZXNzJywgcmVzcG9uc2U6IHJlc3BvbnNlIH0pO1xyXG4gIH0gY2F0Y2ggKGUpIHtcclxuICAgIHJlcS5sb2dnZXIuZXJyb3IoZSk7XHJcbiAgICByZXR1cm4gcmVzXHJcbiAgICAgIC5zdGF0dXMoNTAwKVxyXG4gICAgICAuanNvbih7IHN0YXR1czogJ2Vycm9yJywgbWVzc2FnZTogJ0Vycm9yIG9uIHJlamVjdENhbGwnLCBlcnJvcjogZSB9KTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzdGFyTWVzc2FnZShyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpIHtcclxuICAvKipcclxuICAgICAjc3dhZ2dlci50YWdzID0gW1wiTWVzc2FnZXNcIl1cclxuICAgICAjc3dhZ2dlci5hdXRvQm9keT1mYWxzZVxyXG4gICAgICNzd2FnZ2VyLnNlY3VyaXR5ID0gW3tcclxuICAgICAgICAgICAgXCJiZWFyZXJBdXRoXCI6IFtdXHJcbiAgICAgfV1cclxuICAgICAjc3dhZ2dlci5wYXJhbWV0ZXJzW1wic2Vzc2lvblwiXSA9IHtcclxuICAgICAgc2NoZW1hOiAnTkVSRFdIQVRTX0FNRVJJQ0EnXHJcbiAgICAgfVxyXG4gICAgICNzd2FnZ2VyLnJlcXVlc3RCb2R5ID0ge1xyXG4gICAgICByZXF1aXJlZDogdHJ1ZSxcclxuICAgICAgXCJAY29udGVudFwiOiB7XHJcbiAgICAgICAgXCJhcHBsaWNhdGlvbi9qc29uXCI6IHtcclxuICAgICAgICAgIHNjaGVtYToge1xyXG4gICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgbWVzc2FnZUlkOiB7IHR5cGU6IFwic3RyaW5nXCIgfSxcclxuICAgICAgICAgICAgICBzdGFyOiB7IHR5cGU6IFwiYm9vbGVhblwiIH0sXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICBleGFtcGxlczoge1xyXG4gICAgICAgICAgICBcIkRlZmF1bHRcIjoge1xyXG4gICAgICAgICAgICAgIHZhbHVlOiB7XHJcbiAgICAgICAgICAgICAgICBtZXNzYWdlSWQ6IFwiNTUyMTk5OTk5OTk5OVwiLFxyXG4gICAgICAgICAgICAgICAgc3RhcjogdHJ1ZSxcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgfVxyXG4gICAqL1xyXG4gIGNvbnN0IHsgbWVzc2FnZUlkLCBzdGFyID0gdHJ1ZSB9ID0gcmVxLmJvZHk7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgcmVxLmNsaWVudC5zdGFyTWVzc2FnZShtZXNzYWdlSWQsIHN0YXIpO1xyXG5cclxuICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7IHN0YXR1czogJ3N1Y2Nlc3MnLCByZXNwb25zZTogcmVzcG9uc2UgfSk7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIHJlcS5sb2dnZXIuZXJyb3IoZXJyb3IpO1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgc3RhdHVzOiAnZXJyb3InLFxyXG4gICAgICBtZXNzYWdlOiAnRXJyb3Igb24gIHN0YXJ0IG1lc3NhZ2UnLFxyXG4gICAgICBlcnJvcjogZXJyb3IsXHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRSZWFjdGlvbnMocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKSB7XHJcbiAgLyoqXHJcbiAgICAgI3N3YWdnZXIudGFncyA9IFtcIk1lc3NhZ2VzXCJdXHJcbiAgICAgI3N3YWdnZXIuYXV0b0JvZHk9ZmFsc2VcclxuICAgICAjc3dhZ2dlci5zZWN1cml0eSA9IFt7XHJcbiAgICAgICAgICAgIFwiYmVhcmVyQXV0aFwiOiBbXVxyXG4gICAgIH1dXHJcbiAgICAgI3N3YWdnZXIucGFyYW1ldGVyc1tcInNlc3Npb25cIl0gPSB7XHJcbiAgICAgIHNjaGVtYTogJ05FUkRXSEFUU19BTUVSSUNBJ1xyXG4gICAgIH1cclxuICAgICAjc3dhZ2dlci5wYXJhbWV0ZXJzW1wibWVzc2FnZUlkXCJdID0ge1xyXG4gICAgICBzY2hlbWE6ICc8bWVzc2FnZUlkPidcclxuICAgICB9XHJcbiAgICovXHJcbiAgY29uc3QgbWVzc2FnZUlkID0gcmVxLnBhcmFtcy5pZDtcclxuICB0cnkge1xyXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCByZXEuY2xpZW50LmdldFJlYWN0aW9ucyhtZXNzYWdlSWQpO1xyXG5cclxuICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7IHN0YXR1czogJ3N1Y2Nlc3MnLCByZXNwb25zZTogcmVzcG9uc2UgfSk7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIHJlcS5sb2dnZXIuZXJyb3IoZXJyb3IpO1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgc3RhdHVzOiAnZXJyb3InLFxyXG4gICAgICBtZXNzYWdlOiAnRXJyb3Igb24gZ2V0IHJlYWN0aW9ucycsXHJcbiAgICAgIGVycm9yOiBlcnJvcixcclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldFZvdGVzKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSkge1xyXG4gIC8qKlxyXG4gICAgICNzd2FnZ2VyLnRhZ3MgPSBbXCJNZXNzYWdlc1wiXVxyXG4gICAgICNzd2FnZ2VyLmF1dG9Cb2R5PWZhbHNlXHJcbiAgICAgI3N3YWdnZXIuc2VjdXJpdHkgPSBbe1xyXG4gICAgICAgICAgICBcImJlYXJlckF1dGhcIjogW11cclxuICAgICB9XVxyXG4gICAgICNzd2FnZ2VyLnBhcmFtZXRlcnNbXCJzZXNzaW9uXCJdID0ge1xyXG4gICAgICBzY2hlbWE6ICdORVJEV0hBVFNfQU1FUklDQSdcclxuICAgICB9XHJcbiAgICAgI3N3YWdnZXIucGFyYW1ldGVyc1tcIm1lc3NhZ2VJZFwiXSA9IHtcclxuICAgICAgc2NoZW1hOiAnPG1lc3NhZ2VJZD4nXHJcbiAgICAgfVxyXG4gICAqL1xyXG4gIGNvbnN0IG1lc3NhZ2VJZCA9IHJlcS5wYXJhbXMuaWQ7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgcmVxLmNsaWVudC5nZXRWb3RlcyhtZXNzYWdlSWQpO1xyXG5cclxuICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7IHN0YXR1czogJ3N1Y2Nlc3MnLCByZXNwb25zZTogcmVzcG9uc2UgfSk7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIHJlcS5sb2dnZXIuZXJyb3IoZXJyb3IpO1xyXG4gICAgcmV0dXJuIHJlc1xyXG4gICAgICAuc3RhdHVzKDUwMClcclxuICAgICAgLmpzb24oeyBzdGF0dXM6ICdlcnJvcicsIG1lc3NhZ2U6ICdFcnJvciBvbiBnZXQgdm90ZXMnLCBlcnJvcjogZXJyb3IgfSk7XHJcbiAgfVxyXG59XHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjaGF0V29vdChyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpIHtcclxuICAvKipcclxuICAgICAjc3dhZ2dlci50YWdzID0gW1wiTWlzY1wiXVxyXG4gICAgICNzd2FnZ2VyLmRlc2NyaXB0aW9uID0gJ1lvdSBjYW4gcG9pbnQgeW91ciBDaGF0d29vdCB0byB0aGlzIHJvdXRlIHNvIHRoYXQgaXQgY2FuIHBlcmZvcm0gZnVuY3Rpb25zLidcclxuICAgICAjc3dhZ2dlci5hdXRvQm9keT1mYWxzZVxyXG4gICAgICNzd2FnZ2VyLnNlY3VyaXR5ID0gW3tcclxuICAgICAgICAgICAgXCJiZWFyZXJBdXRoXCI6IFtdXHJcbiAgICAgfV1cclxuICAgICAjc3dhZ2dlci5wYXJhbWV0ZXJzW1wic2Vzc2lvblwiXSA9IHtcclxuICAgICAgc2NoZW1hOiAnTkVSRFdIQVRTX0FNRVJJQ0EnXHJcbiAgICAgfVxyXG4gICAgICNzd2FnZ2VyLnJlcXVlc3RCb2R5ID0ge1xyXG4gICAgICByZXF1aXJlZDogdHJ1ZSxcclxuICAgICAgXCJAY29udGVudFwiOiB7XHJcbiAgICAgICAgXCJhcHBsaWNhdGlvbi9qc29uXCI6IHtcclxuICAgICAgICAgIHNjaGVtYToge1xyXG4gICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgZXZlbnQ6IHsgdHlwZTogXCJzdHJpbmdcIiB9LFxyXG4gICAgICAgICAgICAgIHByaXZhdGU6IHsgdHlwZTogXCJzdHJpbmdcIiB9LFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgZXhhbXBsZXM6IHtcclxuICAgICAgICAgICAgXCJEZWZhdWx0XCI6IHtcclxuICAgICAgICAgICAgICB2YWx1ZToge1xyXG4gICAgICAgICAgICAgICAgbWVzc2FnZUlkOiBcImNvbnZlcnNhdGlvbl9zdGF0dXNfY2hhbmdlZFwiLFxyXG4gICAgICAgICAgICAgICAgcHJpdmF0ZTogXCJmYWxzZVwiLFxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICB9XHJcbiAgICovXHJcbiAgY29uc3QgeyBzZXNzaW9uIH0gPSByZXEucGFyYW1zO1xyXG4gIGNvbnN0IGNsaWVudDogYW55ID0gY2xpZW50c0FycmF5W3Nlc3Npb25dO1xyXG4gIGlmIChjbGllbnQgPT0gbnVsbCB8fCBjbGllbnQuc3RhdHVzICE9PSAnQ09OTkVDVEVEJykgcmV0dXJuO1xyXG4gIHRyeSB7XHJcbiAgICBpZiAoYXdhaXQgY2xpZW50LmlzQ29ubmVjdGVkKCkpIHtcclxuICAgICAgY29uc3QgZXZlbnQgPSByZXEuYm9keS5ldmVudDtcclxuXHJcbiAgICAgIGlmIChcclxuICAgICAgICBldmVudCA9PSAnY29udmVyc2F0aW9uX3N0YXR1c19jaGFuZ2VkJyB8fFxyXG4gICAgICAgIGV2ZW50ID09ICdjb252ZXJzYXRpb25fcmVzb2x2ZWQnIHx8XHJcbiAgICAgICAgcmVxLmJvZHkucHJpdmF0ZVxyXG4gICAgICApIHtcclxuICAgICAgICByZXR1cm4gcmVzXHJcbiAgICAgICAgICAuc3RhdHVzKDIwMClcclxuICAgICAgICAgIC5qc29uKHsgc3RhdHVzOiAnc3VjY2VzcycsIG1lc3NhZ2U6ICdTdWNjZXNzIG9uIHJlY2VpdmUgY2hhdHdvb3QnIH0pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCB7XHJcbiAgICAgICAgbWVzc2FnZV90eXBlLFxyXG4gICAgICAgIHBob25lID0gcmVxLmJvZHkuY29udmVyc2F0aW9uLm1ldGEuc2VuZGVyLnBob25lX251bWJlci5yZXBsYWNlKCcrJywgJycpLFxyXG4gICAgICAgIG1lc3NhZ2UgPSByZXEuYm9keS5jb252ZXJzYXRpb24ubWVzc2FnZXNbMF0sXHJcbiAgICAgIH0gPSByZXEuYm9keTtcclxuXHJcbiAgICAgIGlmIChldmVudCAhPSAnbWVzc2FnZV9jcmVhdGVkJyAmJiBtZXNzYWdlX3R5cGUgIT0gJ291dGdvaW5nJylcclxuICAgICAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApO1xyXG4gICAgICBmb3IgKGNvbnN0IGNvbnRhdG8gb2YgY29udGFjdFRvQXJyYXkocGhvbmUsIGZhbHNlKSkge1xyXG4gICAgICAgIGlmIChtZXNzYWdlX3R5cGUgPT0gJ291dGdvaW5nJykge1xyXG4gICAgICAgICAgaWYgKG1lc3NhZ2UuYXR0YWNobWVudHMpIHtcclxuICAgICAgICAgICAgY29uc3QgYmFzZV91cmwgPSBgJHtcclxuICAgICAgICAgICAgICBjbGllbnQuY29uZmlnLmNoYXRXb290LmJhc2VVUkxcclxuICAgICAgICAgICAgfS8ke21lc3NhZ2UuYXR0YWNobWVudHNbMF0uZGF0YV91cmwuc3Vic3RyaW5nKFxyXG4gICAgICAgICAgICAgIG1lc3NhZ2UuYXR0YWNobWVudHNbMF0uZGF0YV91cmwuaW5kZXhPZignL3JhaWxzLycpICsgMVxyXG4gICAgICAgICAgICApfWA7XHJcbiAgICAgICAgICAgIGF3YWl0IGNsaWVudC5zZW5kRmlsZShcclxuICAgICAgICAgICAgICBgJHtjb250YXRvfWAsXHJcbiAgICAgICAgICAgICAgYmFzZV91cmwsXHJcbiAgICAgICAgICAgICAgJ2ZpbGUnLFxyXG4gICAgICAgICAgICAgIG1lc3NhZ2UuY29udGVudFxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgYXdhaXQgY2xpZW50LnNlbmRUZXh0KGNvbnRhdG8sIG1lc3NhZ2UuY29udGVudCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiByZXNcclxuICAgICAgICAuc3RhdHVzKDIwMClcclxuICAgICAgICAuanNvbih7IHN0YXR1czogJ3N1Y2Nlc3MnLCBtZXNzYWdlOiAnU3VjY2VzcyBvbiAgcmVjZWl2ZSBjaGF0d29vdCcgfSk7XHJcbiAgICB9XHJcbiAgfSBjYXRjaCAoZSkge1xyXG4gICAgY29uc29sZS5sb2coZSk7XHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oe1xyXG4gICAgICBzdGF0dXM6ICdlcnJvcicsXHJcbiAgICAgIG1lc3NhZ2U6ICdFcnJvciBvbiAgcmVjZWl2ZSBjaGF0d29vdCcsXHJcbiAgICAgIGVycm9yOiBlLFxyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRQbGF0Zm9ybUZyb21NZXNzYWdlKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSkge1xyXG4gIC8qKlxyXG4gICAqICNzd2FnZ2VyLnRhZ3MgPSBbXCJNaXNjXCJdXHJcbiAgICAgI3N3YWdnZXIuYXV0b0JvZHk9ZmFsc2VcclxuICAgICAjc3dhZ2dlci5zZWN1cml0eSA9IFt7XHJcbiAgICAgICAgICAgIFwiYmVhcmVyQXV0aFwiOiBbXVxyXG4gICAgIH1dXHJcbiAgICAgI3N3YWdnZXIucGFyYW1ldGVyc1tcInNlc3Npb25cIl0gPSB7XHJcbiAgICAgIHNjaGVtYTogJ05FUkRXSEFUU19BTUVSSUNBJ1xyXG4gICAgIH1cclxuICAgICAjc3dhZ2dlci5wYXJhbWV0ZXJzW1wibWVzc2FnZUlkXCJdID0ge1xyXG4gICAgICBzY2hlbWE6ICc8bWVzc2FnZUlkPidcclxuICAgICB9XHJcbiAgICovXHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHJlcS5jbGllbnQuZ2V0UGxhdGZvcm1Gcm9tTWVzc2FnZShcclxuICAgICAgcmVxLnBhcmFtcy5tZXNzYWdlSWRcclxuICAgICk7XHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24ocmVzdWx0KTtcclxuICB9IGNhdGNoIChlKSB7XHJcbiAgICByZXEubG9nZ2VyLmVycm9yKGUpO1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgc3RhdHVzOiAnZXJyb3InLFxyXG4gICAgICBtZXNzYWdlOiAnRXJyb3Igb24gZ2V0IGdldCBwbGF0Zm9ybSBmcm9tIG1lc3NhZ2UnLFxyXG4gICAgICBlcnJvcjogZSxcclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWtCQSxJQUFBQSxVQUFBLEdBQUFDLE9B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