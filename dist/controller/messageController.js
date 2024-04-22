"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.replyMessage = replyMessage;exports.sendButtons = sendButtons;exports.sendFile = sendFile;exports.sendImageAsSticker = sendImageAsSticker;exports.sendImageAsStickerGif = sendImageAsStickerGif;exports.sendLinkPreview = sendLinkPreview;exports.sendListMessage = sendListMessage;exports.sendLocation = sendLocation;exports.sendMentioned = sendMentioned;exports.sendMessage = sendMessage;exports.sendMessages = sendMessages;exports.sendPollMessage = sendPollMessage;exports.sendStatusText = sendStatusText;exports.sendVoice = sendVoice;exports.sendVoice64 = sendVoice64;

















var _functions = require("../util/functions"); /*
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
 */function returnError(req, res, error) {req.logger.error(error);res.status(500).json({ status: 'Error', message: 'Erro ao enviar a mensagem.', error: error });}async function returnSucess(res, data) {res.status(201).json({ status: 'success', response: data, mapper: 'return' });}
async function sendMessage(req, res) {
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
        required: true,
        "@content": {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                $phone: { type: "string" },
                $isGroup: { type: "boolean" },
                $message: { type: "string" }
                $options: { type: "object" }
              }
            },
            examples: {
              "Default": {
                value: {
                  phone: '5521999999999',
                  isGroup: false,
                  message: 'Hello, welcome to WPPConnect'
                  options: {
                    linkPreview: {
                      title: 'Another text',
                      description: 'Another description'
                    },
                    markIsRead: true,
                    mentionedList: [],
                  },
                },
              },
            },
          }
        }
      }
   */
  const { phone, message } = req.body;

  const options = req.body.options || {};

  try {
    const results = [];
    for (const contato of phone) {
      results.push(await req.client.sendText(contato, message, options));
    }

    if (results.length === 0)
    return res.status(400).json('Error sending message');
    req.io.emit('mensagem-enviada', results);
    returnSucess(res, results);
  } catch (error) {
    returnError(req, res, error);
  }
}
async function sendMessages(req, res) {
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
        required: true,
        "@content": {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                $phone: { type: "string" },
                $isGroup: { type: "boolean" },
                $message: { type: "string" }
                $options: { type: "object" }
              }
            },
            examples: {
              "Default": {
                value: {
                  phone: '5521999999999',
                  isGroup: false,
                  message: 'Hello, welcome to WPPConnect'
                  options: {
                    linkPreview: {
                      title: 'Another text',
                      description: 'Another description'
                    },
                    markIsRead: true,
                    mentionedList: [],
                  },
                },
              },
            },
          }
        }
      }
   */
  const { messages } = req.body;

  const options = req.body.options || {};

  try {
    const results = [];
    for (const messageResult of messages) {
      const numbers = [];
      const localArr = (0, _functions.contactToArray)(messageResult.phone, false);
      let index = 0;
      for (const contact of localArr) {
        if (req.body.isGroup) {
          localArr[index] = contact;
        } else if (numbers.indexOf(contact) < 0) {
          const profile = await req.client.
          checkNumberStatus(contact).
          catch((error) => console.log(error));
          if (!profile?.numberExists) {
            const num = contact.split('@')[0];
            return res.status(400).json({
              response: {
                error: 'notExists',
                phone: num,
                nome: req.body.name
              },
              status: 'Connected',
              message: `O número ${num} não existe.`
            });
          } else {
            if (numbers.indexOf(profile.id._serialized) < 0) {
              numbers.push(profile.id._serialized);
            }
            localArr[index] = profile.id._serialized;
          }
        }
        index++;
      }
      for (const contact of localArr) {
        results.push(
          await req.client.sendText(contact, messageResult.message, options)
        );
      }
    }

    if (results.length === 0)
    return res.status(400).json('Error sending message');
    req.io.emit('mensagem-enviada', results);
    returnSucess(res, results);
  } catch (error) {
    returnError(req, res, error);
  }
}

async function sendFile(req, res) {
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
      required: true,
      "@content": {
        "application/json": {
            schema: {
                type: "object",
                properties: {
                    "phone": { type: "string" },
                    "isGroup": { type: "boolean" },
                    "filename": { type: "string" },
                    "caption": { type: "string" },
                    "base64": { type: "string" }
                }
            },
            examples: {
                "Default": {
                    value: {
                        "phone": "5521999999999",
                        "isGroup": false,
                        "filename": "file name lol",
                        "caption": "caption for my file",
                        "base64": "<base64> string"
                    }
                }
            }
        }
      }
    }
   */
  const { phone, path, base64, filename = 'file', message, caption } = req.body;

  const options = req.body.options || {};

  if (!path && !req.file && !base64)
  return res.status(401).send({
    message: 'Sending the file is mandatory'
  });

  const pathFile = path || base64 || req.file?.path;
  const msg = message || caption;

  try {
    const results = [];
    for (const contact of phone) {
      results.push(
        await req.client.sendFile(contact, pathFile, {
          filename: filename,
          caption: msg,
          ...options
        })
      );
    }

    if (results.length === 0)
    return res.status(400).json('Error sending message');
    if (req.file) await (0, _functions.unlinkAsync)(pathFile);
    returnSucess(res, results);
  } catch (error) {
    returnError(req, res, error);
  }
}

async function sendVoice(req, res) {
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
        required: true,
        "@content": {
            "application/json": {
                schema: {
                    type: "object",
                    properties: {
                        "phone": { type: "string" },
                        "isGroup": { type: "boolean" },
                        "path": { type: "string" },
                        "quotedMessageId": { type: "string" }
                    }
                },
                examples: {
                    "Default": {
                        value: {
                            "phone": "5521999999999",
                            "isGroup": false,
                            "path": "<path_file>",
                            "quotedMessageId": "message Id"
                        }
                    }
                }
            }
        }
    }
   */
  const {
    phone,
    path,
    filename = 'Voice Audio',
    message,
    quotedMessageId
  } = req.body;

  try {
    const results = [];
    for (const contato of phone) {
      results.push(
        await req.client.sendPtt(
          contato,
          path,
          filename,
          message,
          quotedMessageId
        )
      );
    }

    if (results.length === 0)
    return res.status(400).json('Error sending message');
    returnSucess(res, results);
  } catch (error) {
    returnError(req, res, error);
  }
}

async function sendVoice64(req, res) {
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
        required: true,
        "@content": {
            "application/json": {
                schema: {
                    type: "object",
                    properties: {
                        "phone": { type: "string" },
                        "isGroup": { type: "boolean" },
                        "base64Ptt": { type: "string" }
                    }
                },
                examples: {
                    "Default": {
                        value: {
                            "phone": "5521999999999",
                            "isGroup": false,
                            "base64Ptt": "<base64_string>"
                        }
                    }
                }
            }
        }
    }
   */
  const { phone, base64Ptt } = req.body;

  try {
    const results = [];
    for (const contato of phone) {
      results.push(
        await req.client.sendPttFromBase64(contato, base64Ptt, 'Voice Audio')
      );
    }

    if (results.length === 0)
    return res.status(400).json('Error sending message');
    returnSucess(res, results);
  } catch (error) {
    returnError(req, res, error);
  }
}

async function sendLinkPreview(req, res) {
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
        required: true,
        "@content": {
            "application/json": {
                schema: {
                    type: "object",
                    properties: {
                        "phone": { type: "string" },
                        "isGroup": { type: "boolean" },
                        "url": { type: "string" },
                        "caption": { type: "string" }
                    }
                },
                examples: {
                    "Default": {
                        value: {
                            "phone": "5521999999999",
                            "isGroup": false,
                            "url": "http://www.link.com",
                            "caption": "Text for describe link"
                        }
                    }
                }
            }
        }
    }
   */
  const { phone, url, caption } = req.body;

  try {
    const results = [];
    for (const contato of phone) {
      results.push(
        await req.client.sendLinkPreview(`${contato}`, url, caption)
      );
    }

    if (results.length === 0)
    return res.status(400).json('Error sending message');
    returnSucess(res, results);
  } catch (error) {
    returnError(req, res, error);
  }
}

async function sendLocation(req, res) {
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
        required: true,
        "@content": {
            "application/json": {
                schema: {
                    type: "object",
                    properties: {
                        "phone": { type: "string" },
                        "isGroup": { type: "boolean" },
                        "lat": { type: "string" },
                        "lng": { type: "string" },
                        "title": { type: "string" },
                        "address": { type: "string" }
                    }
                },
                examples: {
                    "Default": {
                        value: {
                            "phone": "5521999999999",
                            "isGroup": false,
                            "lat": "-89898322",
                            "lng": "-545454",
                            "title": "Rio de Janeiro",
                            "address": "Av. N. S. de Copacabana, 25, Copacabana"
                        }
                    }
                }
            }
        }
    }
   */
  const { phone, lat, lng, title, address } = req.body;

  try {
    const results = [];
    for (const contato of phone) {
      results.push(
        await req.client.sendLocation(contato, {
          lat: lat,
          lng: lng,
          address: address,
          name: title
        })
      );
    }

    if (results.length === 0)
    return res.status(400).json('Error sending message');
    returnSucess(res, results);
  } catch (error) {
    returnError(req, res, error);
  }
}

async function sendButtons(req, res) {
  /**
   * #swagger.tags = ["Messages"]
     #swagger.autoBody=false
     #swagger.security = [{
            "bearerAuth": []
     }]
     #swagger.parameters["session"] = {
      schema: 'NERDWHATS_AMERICA',
     }
     #swagger.deprecated=true
   */
  const { phone, message, options } = req.body;

  try {
    const results = [];

    for (const contact of phone) {
      results.push(await req.client.sendText(contact, message, options));
    }

    if (results.length === 0)
    return returnError(req, res, 'Error sending message with buttons');

    returnSucess(res, phone);
  } catch (error) {
    returnError(req, res, error);
  }
}

async function sendListMessage(req, res) {
  /**
   * #swagger.tags = ["Messages"]
     #swagger.autoBody=false
     #swagger.security = [{
            "bearerAuth": []
     }]
     #swagger.parameters["session"] = {
      schema: 'NERDWHATS_AMERICA',
     }
     #swagger.deprecated=true
   */
  const {
    phone,
    description = '',
    sections,
    buttonText = 'SELECIONE UMA OPÇÃO'
  } = req.body;

  try {
    const results = [];

    for (const contact of phone) {
      results.push(
        await req.client.sendListMessage(contact, {
          buttonText: buttonText,
          description: description,
          sections: sections
        })
      );
    }

    if (results.length === 0)
    return returnError(req, res, 'Error sending list buttons');

    returnSucess(res, results);
  } catch (error) {
    returnError(req, res, error);
  }
}

async function sendPollMessage(req, res) {
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
        required: true,
        "@content": {
            "application/json": {
                schema: {
                    type: "object",
                    properties: {
                        phone: { type: "string" },
                        isGroup: { type: "boolean" },
                        name: { type: "string" },
                        choices: { type: "array" },
                        options: { type: "object" },
                    }
                },
                examples: {
                    "Default": {
                        value: {
                          phone: '5521999999999',
                          isGroup: false,
                          name: 'Poll name',
                          choices: ['Option 1', 'Option 2', 'Option 3'],
                          options: {
                            selectableCount: 1,
                          }
                        }
                    },
                }
            }
        }
    }
   */
  const { phone, name, choices, options } = req.body;

  try {
    const results = [];

    for (const contact of phone) {
      results.push(
        await req.client.sendPollMessage(contact, name, choices, options)
      );
    }

    if (results.length === 0)
    return returnError(req, res, 'Error sending poll message');

    returnSucess(res, results);
  } catch (error) {
    returnError(req, res, error);
  }
}

async function sendStatusText(req, res) {
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
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              phone: { type: 'string' },
              isGroup: { type: 'boolean' },
              message: { type: 'string' },
              messageId: { type: 'string' }
            },
            required: ['phone', 'isGroup', 'message']
          },
          examples: {
            Default: {
              value: {
                phone: '5521999999999',
                isGroup: false,
                message: 'Reply to message',
                messageId: '<id_message>'
              }
            }
          }
        }
      }
    }
   */
  const { message } = req.body;

  try {
    const results = [];
    results.push(await req.client.sendText('status@broadcast', message));

    if (results.length === 0)
    return res.status(400).json('Error sending message');
    returnSucess(res, results);
  } catch (error) {
    returnError(req, res, error);
  }
}

async function replyMessage(req, res) {
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
      required: true,
      "@content": {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              "phone": { type: "string" },
              "isGroup": { type: "boolean" },
              "message": { type: "string" },
              "messageId": { type: "string" }
            }
          },
          examples: {
            "Default": {
              value: {
                "phone": "5521999999999",
                "isGroup": false,
                "message": "Reply to message",
                "messageId": "<id_message>"
              }
            }
          }
        }
      }
    }
   */
  const { phone, message, messageId } = req.body;

  try {
    const results = [];
    for (const contato of phone) {
      results.push(await req.client.reply(contato, message, messageId));
    }

    if (results.length === 0)
    return res.status(400).json('Error sending message');
    req.io.emit('mensagem-enviada', { message: message, to: phone });
    returnSucess(res, results);
  } catch (error) {
    returnError(req, res, error);
  }
}

async function sendMentioned(req, res) {
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
  required: true,
  "@content": {
    "application/json": {
      schema: {
        type: "object",
        properties: {
          "phone": { type: "string" },
          "isGroup": { type: "boolean" },
          "message": { type: "string" },
          "mentioned": { type: "array", items: { type: "string" } }
        },
        required: ["phone", "message", "mentioned"]
      },
      examples: {
        "Default": {
          value: {
            "phone": "5521999999999",
            "isGroup": true,
            "message": "Your text message",
            "mentioned": ["@556593077171@c.us"]
          }
        }
      }
    }
  }
  }
   */
  const { phone, message, mentioned } = req.body;

  try {
    let response;
    for (const contato of phone) {
      response = await req.client.sendMentioned(
        `${contato}`,
        message,
        mentioned
      );
    }

    return res.status(201).json({ status: 'success', response: response });
  } catch (error) {
    req.logger.error(error);
    return res.status(500).json({
      status: 'error',
      message: 'Error on send message mentioned',
      error: error
    });
  }
}
async function sendImageAsSticker(req, res) {
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
      required: true,
      "@content": {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              "phone": { type: "string" },
              "isGroup": { type: "boolean" },
              "path": { type: "string" }
            },
            required: ["phone", "path"]
          },
          examples: {
            "Default": {
              value: {
                "phone": "5521999999999",
                "isGroup": true,
                "path": "<path_file>"
              }
            }
          }
        }
      }
    }
   */
  const { phone, path } = req.body;

  if (!path && !req.file)
  return res.status(401).send({
    message: 'Sending the file is mandatory'
  });

  const pathFile = path || req.file?.path;

  try {
    const results = [];
    for (const contato of phone) {
      results.push(await req.client.sendImageAsSticker(contato, pathFile));
    }

    if (results.length === 0)
    return res.status(400).json('Error sending message');
    if (req.file) await (0, _functions.unlinkAsync)(pathFile);
    returnSucess(res, results);
  } catch (error) {
    returnError(req, res, error);
  }
}
async function sendImageAsStickerGif(req, res) {
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
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              phone: { type: 'string' },
              isGroup: { type: 'boolean' },
              path: { type: 'string' },
            },
            required: ['phone', 'path'],
          },
          examples: {
            'Default': {
              value: {
                phone: '5521999999999',
                isGroup: true,
                path: '<path_file>',
              },
            },
          },
        },
      },
    }
   */
  const { phone, path } = req.body;

  if (!path && !req.file)
  return res.status(401).send({
    message: 'Sending the file is mandatory'
  });

  const pathFile = path || req.file?.path;

  try {
    const results = [];
    for (const contato of phone) {
      results.push(await req.client.sendImageAsStickerGif(contato, pathFile));
    }

    if (results.length === 0)
    return res.status(400).json('Error sending message');
    if (req.file) await (0, _functions.unlinkAsync)(pathFile);
    returnSucess(res, results);
  } catch (error) {
    returnError(req, res, error);
  }
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfZnVuY3Rpb25zIiwicmVxdWlyZSIsInJldHVybkVycm9yIiwicmVxIiwicmVzIiwiZXJyb3IiLCJsb2dnZXIiLCJzdGF0dXMiLCJqc29uIiwibWVzc2FnZSIsInJldHVyblN1Y2VzcyIsImRhdGEiLCJyZXNwb25zZSIsIm1hcHBlciIsInNlbmRNZXNzYWdlIiwicGhvbmUiLCJib2R5Iiwib3B0aW9ucyIsInJlc3VsdHMiLCJjb250YXRvIiwicHVzaCIsImNsaWVudCIsInNlbmRUZXh0IiwibGVuZ3RoIiwiaW8iLCJlbWl0Iiwic2VuZE1lc3NhZ2VzIiwibWVzc2FnZXMiLCJtZXNzYWdlUmVzdWx0IiwibnVtYmVycyIsImxvY2FsQXJyIiwiY29udGFjdFRvQXJyYXkiLCJpbmRleCIsImNvbnRhY3QiLCJpc0dyb3VwIiwiaW5kZXhPZiIsInByb2ZpbGUiLCJjaGVja051bWJlclN0YXR1cyIsImNhdGNoIiwiY29uc29sZSIsImxvZyIsIm51bWJlckV4aXN0cyIsIm51bSIsInNwbGl0Iiwibm9tZSIsIm5hbWUiLCJpZCIsIl9zZXJpYWxpemVkIiwic2VuZEZpbGUiLCJwYXRoIiwiYmFzZTY0IiwiZmlsZW5hbWUiLCJjYXB0aW9uIiwiZmlsZSIsInNlbmQiLCJwYXRoRmlsZSIsIm1zZyIsInVubGlua0FzeW5jIiwic2VuZFZvaWNlIiwicXVvdGVkTWVzc2FnZUlkIiwic2VuZFB0dCIsInNlbmRWb2ljZTY0IiwiYmFzZTY0UHR0Iiwic2VuZFB0dEZyb21CYXNlNjQiLCJzZW5kTGlua1ByZXZpZXciLCJ1cmwiLCJzZW5kTG9jYXRpb24iLCJsYXQiLCJsbmciLCJ0aXRsZSIsImFkZHJlc3MiLCJzZW5kQnV0dG9ucyIsInNlbmRMaXN0TWVzc2FnZSIsImRlc2NyaXB0aW9uIiwic2VjdGlvbnMiLCJidXR0b25UZXh0Iiwic2VuZFBvbGxNZXNzYWdlIiwiY2hvaWNlcyIsInNlbmRTdGF0dXNUZXh0IiwicmVwbHlNZXNzYWdlIiwibWVzc2FnZUlkIiwicmVwbHkiLCJ0byIsInNlbmRNZW50aW9uZWQiLCJtZW50aW9uZWQiLCJzZW5kSW1hZ2VBc1N0aWNrZXIiLCJzZW5kSW1hZ2VBc1N0aWNrZXJHaWYiXSwic291cmNlcyI6WyIuLi8uLi9zcmMvY29udHJvbGxlci9tZXNzYWdlQ29udHJvbGxlci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKlxyXG4gKiBDb3B5cmlnaHQgMjAyMSBXUFBDb25uZWN0IFRlYW1cclxuICpcclxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcclxuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxyXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcclxuICpcclxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxyXG4gKlxyXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXHJcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcclxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXHJcbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcclxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXHJcbiAqL1xyXG5cclxuaW1wb3J0IHsgUmVxdWVzdCwgUmVzcG9uc2UgfSBmcm9tICdleHByZXNzJztcclxuXHJcbmltcG9ydCB7IGNvbnRhY3RUb0FycmF5LCB1bmxpbmtBc3luYyB9IGZyb20gJy4uL3V0aWwvZnVuY3Rpb25zJztcclxuXHJcbmZ1bmN0aW9uIHJldHVybkVycm9yKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSwgZXJyb3I6IGFueSkge1xyXG4gIHJlcS5sb2dnZXIuZXJyb3IoZXJyb3IpO1xyXG4gIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgIHN0YXR1czogJ0Vycm9yJyxcclxuICAgIG1lc3NhZ2U6ICdFcnJvIGFvIGVudmlhciBhIG1lbnNhZ2VtLicsXHJcbiAgICBlcnJvcjogZXJyb3IsXHJcbiAgfSk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHJldHVyblN1Y2VzcyhyZXM6IGFueSwgZGF0YTogYW55KSB7XHJcbiAgcmVzLnN0YXR1cygyMDEpLmpzb24oeyBzdGF0dXM6ICdzdWNjZXNzJywgcmVzcG9uc2U6IGRhdGEsIG1hcHBlcjogJ3JldHVybicgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzZW5kTWVzc2FnZShyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpIHtcclxuICAvKipcclxuICAgKiAjc3dhZ2dlci50YWdzID0gW1wiTWVzc2FnZXNcIl1cclxuICAgICAjc3dhZ2dlci5hdXRvQm9keT1mYWxzZVxyXG4gICAgICNzd2FnZ2VyLnNlY3VyaXR5ID0gW3tcclxuICAgICAgICAgICAgXCJiZWFyZXJBdXRoXCI6IFtdXHJcbiAgICAgfV1cclxuICAgICAjc3dhZ2dlci5wYXJhbWV0ZXJzW1wic2Vzc2lvblwiXSA9IHtcclxuICAgICAgc2NoZW1hOiAnTkVSRFdIQVRTX0FNRVJJQ0EnXHJcbiAgICAgfVxyXG4gICAgICNzd2FnZ2VyLnJlcXVlc3RCb2R5ID0ge1xyXG4gICAgICAgIHJlcXVpcmVkOiB0cnVlLFxyXG4gICAgICAgIFwiQGNvbnRlbnRcIjoge1xyXG4gICAgICAgICAgXCJhcHBsaWNhdGlvbi9qc29uXCI6IHtcclxuICAgICAgICAgICAgc2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAkcGhvbmU6IHsgdHlwZTogXCJzdHJpbmdcIiB9LFxyXG4gICAgICAgICAgICAgICAgJGlzR3JvdXA6IHsgdHlwZTogXCJib29sZWFuXCIgfSxcclxuICAgICAgICAgICAgICAgICRtZXNzYWdlOiB7IHR5cGU6IFwic3RyaW5nXCIgfVxyXG4gICAgICAgICAgICAgICAgJG9wdGlvbnM6IHsgdHlwZTogXCJvYmplY3RcIiB9XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBleGFtcGxlczoge1xyXG4gICAgICAgICAgICAgIFwiRGVmYXVsdFwiOiB7XHJcbiAgICAgICAgICAgICAgICB2YWx1ZToge1xyXG4gICAgICAgICAgICAgICAgICBwaG9uZTogJzU1MjE5OTk5OTk5OTknLFxyXG4gICAgICAgICAgICAgICAgICBpc0dyb3VwOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgbWVzc2FnZTogJ0hlbGxvLCB3ZWxjb21lIHRvIFdQUENvbm5lY3QnXHJcbiAgICAgICAgICAgICAgICAgIG9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgICAgICBsaW5rUHJldmlldzoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgdGl0bGU6ICdBbm90aGVyIHRleHQnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdBbm90aGVyIGRlc2NyaXB0aW9uJ1xyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgbWFya0lzUmVhZDogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICBtZW50aW9uZWRMaXN0OiBbXSxcclxuICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgKi9cclxuICBjb25zdCB7IHBob25lLCBtZXNzYWdlIH0gPSByZXEuYm9keTtcclxuXHJcbiAgY29uc3Qgb3B0aW9ucyA9IHJlcS5ib2R5Lm9wdGlvbnMgfHwge307XHJcblxyXG4gIHRyeSB7XHJcbiAgICBjb25zdCByZXN1bHRzOiBhbnkgPSBbXTtcclxuICAgIGZvciAoY29uc3QgY29udGF0byBvZiBwaG9uZSkge1xyXG4gICAgICByZXN1bHRzLnB1c2goYXdhaXQgcmVxLmNsaWVudC5zZW5kVGV4dChjb250YXRvLCBtZXNzYWdlLCBvcHRpb25zKSk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHJlc3VsdHMubGVuZ3RoID09PSAwKVxyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oJ0Vycm9yIHNlbmRpbmcgbWVzc2FnZScpO1xyXG4gICAgcmVxLmlvLmVtaXQoJ21lbnNhZ2VtLWVudmlhZGEnLCByZXN1bHRzKTtcclxuICAgIHJldHVyblN1Y2VzcyhyZXMsIHJlc3VsdHMpO1xyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICByZXR1cm5FcnJvcihyZXEsIHJlcywgZXJyb3IpO1xyXG4gIH1cclxufVxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2VuZE1lc3NhZ2VzKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSkge1xyXG4gIC8qKlxyXG4gICAqICNzd2FnZ2VyLnRhZ3MgPSBbXCJNZXNzYWdlc1wiXVxyXG4gICAgICNzd2FnZ2VyLmF1dG9Cb2R5PWZhbHNlXHJcbiAgICAgI3N3YWdnZXIuc2VjdXJpdHkgPSBbe1xyXG4gICAgICAgICAgICBcImJlYXJlckF1dGhcIjogW11cclxuICAgICB9XVxyXG4gICAgICNzd2FnZ2VyLnBhcmFtZXRlcnNbXCJzZXNzaW9uXCJdID0ge1xyXG4gICAgICBzY2hlbWE6ICdORVJEV0hBVFNfQU1FUklDQSdcclxuICAgICB9XHJcbiAgICAgI3N3YWdnZXIucmVxdWVzdEJvZHkgPSB7XHJcbiAgICAgICAgcmVxdWlyZWQ6IHRydWUsXHJcbiAgICAgICAgXCJAY29udGVudFwiOiB7XHJcbiAgICAgICAgICBcImFwcGxpY2F0aW9uL2pzb25cIjoge1xyXG4gICAgICAgICAgICBzY2hlbWE6IHtcclxuICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICRwaG9uZTogeyB0eXBlOiBcInN0cmluZ1wiIH0sXHJcbiAgICAgICAgICAgICAgICAkaXNHcm91cDogeyB0eXBlOiBcImJvb2xlYW5cIiB9LFxyXG4gICAgICAgICAgICAgICAgJG1lc3NhZ2U6IHsgdHlwZTogXCJzdHJpbmdcIiB9XHJcbiAgICAgICAgICAgICAgICAkb3B0aW9uczogeyB0eXBlOiBcIm9iamVjdFwiIH1cclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGV4YW1wbGVzOiB7XHJcbiAgICAgICAgICAgICAgXCJEZWZhdWx0XCI6IHtcclxuICAgICAgICAgICAgICAgIHZhbHVlOiB7XHJcbiAgICAgICAgICAgICAgICAgIHBob25lOiAnNTUyMTk5OTk5OTk5OScsXHJcbiAgICAgICAgICAgICAgICAgIGlzR3JvdXA6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICBtZXNzYWdlOiAnSGVsbG8sIHdlbGNvbWUgdG8gV1BQQ29ubmVjdCdcclxuICAgICAgICAgICAgICAgICAgb3B0aW9uczoge1xyXG4gICAgICAgICAgICAgICAgICAgIGxpbmtQcmV2aWV3OiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICB0aXRsZTogJ0Fub3RoZXIgdGV4dCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0Fub3RoZXIgZGVzY3JpcHRpb24nXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICBtYXJrSXNSZWFkOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgIG1lbnRpb25lZExpc3Q6IFtdLFxyXG4gICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAqL1xyXG4gIGNvbnN0IHsgbWVzc2FnZXMgfSA9IHJlcS5ib2R5O1xyXG5cclxuICBjb25zdCBvcHRpb25zID0gcmVxLmJvZHkub3B0aW9ucyB8fCB7fTtcclxuXHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHJlc3VsdHM6IGFueSA9IFtdO1xyXG4gICAgZm9yIChjb25zdCBtZXNzYWdlUmVzdWx0IG9mIG1lc3NhZ2VzKSB7XHJcbiAgICAgIGNvbnN0IG51bWJlcnM6IGFueSA9IFtdO1xyXG4gICAgICBjb25zdCBsb2NhbEFyciA9IGNvbnRhY3RUb0FycmF5KG1lc3NhZ2VSZXN1bHQucGhvbmUsIGZhbHNlKTtcclxuICAgICAgbGV0IGluZGV4ID0gMDtcclxuICAgICAgZm9yIChjb25zdCBjb250YWN0IG9mIGxvY2FsQXJyKSB7XHJcbiAgICAgICAgaWYgKHJlcS5ib2R5LmlzR3JvdXApIHtcclxuICAgICAgICAgIGxvY2FsQXJyW2luZGV4XSA9IGNvbnRhY3Q7XHJcbiAgICAgICAgfSBlbHNlIGlmIChudW1iZXJzLmluZGV4T2YoY29udGFjdCkgPCAwKSB7XHJcbiAgICAgICAgICBjb25zdCBwcm9maWxlOiBhbnkgPSBhd2FpdCByZXEuY2xpZW50XHJcbiAgICAgICAgICAgIC5jaGVja051bWJlclN0YXR1cyhjb250YWN0KVxyXG4gICAgICAgICAgICAuY2F0Y2goKGVycm9yKSA9PiBjb25zb2xlLmxvZyhlcnJvcikpO1xyXG4gICAgICAgICAgaWYgKCFwcm9maWxlPy5udW1iZXJFeGlzdHMpIHtcclxuICAgICAgICAgICAgY29uc3QgbnVtID0gKGNvbnRhY3QgYXMgYW55KS5zcGxpdCgnQCcpWzBdO1xyXG4gICAgICAgICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oe1xyXG4gICAgICAgICAgICAgIHJlc3BvbnNlOiB7XHJcbiAgICAgICAgICAgICAgICBlcnJvcjogJ25vdEV4aXN0cycsXHJcbiAgICAgICAgICAgICAgICBwaG9uZTogbnVtLFxyXG4gICAgICAgICAgICAgICAgbm9tZTogcmVxLmJvZHkubmFtZSxcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgIHN0YXR1czogJ0Nvbm5lY3RlZCcsXHJcbiAgICAgICAgICAgICAgbWVzc2FnZTogYE8gbsO6bWVybyAke251bX0gbsOjbyBleGlzdGUuYCxcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBpZiAoKG51bWJlcnMgYXMgYW55KS5pbmRleE9mKHByb2ZpbGUuaWQuX3NlcmlhbGl6ZWQpIDwgMCkge1xyXG4gICAgICAgICAgICAgIChudW1iZXJzIGFzIGFueSkucHVzaChwcm9maWxlLmlkLl9zZXJpYWxpemVkKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAobG9jYWxBcnIgYXMgYW55KVtpbmRleF0gPSBwcm9maWxlLmlkLl9zZXJpYWxpemVkO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpbmRleCsrO1xyXG4gICAgICB9XHJcbiAgICAgIGZvciAoY29uc3QgY29udGFjdCBvZiBsb2NhbEFycikge1xyXG4gICAgICAgIHJlc3VsdHMucHVzaChcclxuICAgICAgICAgIGF3YWl0IHJlcS5jbGllbnQuc2VuZFRleHQoY29udGFjdCwgbWVzc2FnZVJlc3VsdC5tZXNzYWdlLCBvcHRpb25zKVxyXG4gICAgICAgICk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAocmVzdWx0cy5sZW5ndGggPT09IDApXHJcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbignRXJyb3Igc2VuZGluZyBtZXNzYWdlJyk7XHJcbiAgICByZXEuaW8uZW1pdCgnbWVuc2FnZW0tZW52aWFkYScsIHJlc3VsdHMpO1xyXG4gICAgcmV0dXJuU3VjZXNzKHJlcywgcmVzdWx0cyk7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIHJldHVybkVycm9yKHJlcSwgcmVzLCBlcnJvcik7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2VuZEZpbGUocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKSB7XHJcbiAgLyoqXHJcbiAgICogI3N3YWdnZXIudGFncyA9IFtcIk1lc3NhZ2VzXCJdXHJcbiAgICAgI3N3YWdnZXIuYXV0b0JvZHk9ZmFsc2VcclxuICAgICAjc3dhZ2dlci5zZWN1cml0eSA9IFt7XHJcbiAgICAgICAgICAgIFwiYmVhcmVyQXV0aFwiOiBbXVxyXG4gICAgIH1dXHJcbiAgICAgI3N3YWdnZXIucGFyYW1ldGVyc1tcInNlc3Npb25cIl0gPSB7XHJcbiAgICAgIHNjaGVtYTogJ05FUkRXSEFUU19BTUVSSUNBJ1xyXG4gICAgIH1cclxuICAgICAjc3dhZ2dlci5yZXF1ZXN0Qm9keSA9IHtcclxuICAgICAgcmVxdWlyZWQ6IHRydWUsXHJcbiAgICAgIFwiQGNvbnRlbnRcIjoge1xyXG4gICAgICAgIFwiYXBwbGljYXRpb24vanNvblwiOiB7XHJcbiAgICAgICAgICAgIHNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICBcInBob25lXCI6IHsgdHlwZTogXCJzdHJpbmdcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIFwiaXNHcm91cFwiOiB7IHR5cGU6IFwiYm9vbGVhblwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgXCJmaWxlbmFtZVwiOiB7IHR5cGU6IFwic3RyaW5nXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICBcImNhcHRpb25cIjogeyB0eXBlOiBcInN0cmluZ1wiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgXCJiYXNlNjRcIjogeyB0eXBlOiBcInN0cmluZ1wiIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgZXhhbXBsZXM6IHtcclxuICAgICAgICAgICAgICAgIFwiRGVmYXVsdFwiOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJwaG9uZVwiOiBcIjU1MjE5OTk5OTk5OTlcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJpc0dyb3VwXCI6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBcImZpbGVuYW1lXCI6IFwiZmlsZSBuYW1lIGxvbFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBcImNhcHRpb25cIjogXCJjYXB0aW9uIGZvciBteSBmaWxlXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiYmFzZTY0XCI6IFwiPGJhc2U2ND4gc3RyaW5nXCJcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgKi9cclxuICBjb25zdCB7IHBob25lLCBwYXRoLCBiYXNlNjQsIGZpbGVuYW1lID0gJ2ZpbGUnLCBtZXNzYWdlLCBjYXB0aW9uIH0gPSByZXEuYm9keTtcclxuXHJcbiAgY29uc3Qgb3B0aW9ucyA9IHJlcS5ib2R5Lm9wdGlvbnMgfHwge307XHJcblxyXG4gIGlmICghcGF0aCAmJiAhcmVxLmZpbGUgJiYgIWJhc2U2NClcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDQwMSkuc2VuZCh7XHJcbiAgICAgIG1lc3NhZ2U6ICdTZW5kaW5nIHRoZSBmaWxlIGlzIG1hbmRhdG9yeScsXHJcbiAgICB9KTtcclxuXHJcbiAgY29uc3QgcGF0aEZpbGUgPSBwYXRoIHx8IGJhc2U2NCB8fCByZXEuZmlsZT8ucGF0aDtcclxuICBjb25zdCBtc2cgPSBtZXNzYWdlIHx8IGNhcHRpb247XHJcblxyXG4gIHRyeSB7XHJcbiAgICBjb25zdCByZXN1bHRzOiBhbnkgPSBbXTtcclxuICAgIGZvciAoY29uc3QgY29udGFjdCBvZiBwaG9uZSkge1xyXG4gICAgICByZXN1bHRzLnB1c2goXHJcbiAgICAgICAgYXdhaXQgcmVxLmNsaWVudC5zZW5kRmlsZShjb250YWN0LCBwYXRoRmlsZSwge1xyXG4gICAgICAgICAgZmlsZW5hbWU6IGZpbGVuYW1lLFxyXG4gICAgICAgICAgY2FwdGlvbjogbXNnLFxyXG4gICAgICAgICAgLi4ub3B0aW9ucyxcclxuICAgICAgICB9KVxyXG4gICAgICApO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChyZXN1bHRzLmxlbmd0aCA9PT0gMClcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKCdFcnJvciBzZW5kaW5nIG1lc3NhZ2UnKTtcclxuICAgIGlmIChyZXEuZmlsZSkgYXdhaXQgdW5saW5rQXN5bmMocGF0aEZpbGUpO1xyXG4gICAgcmV0dXJuU3VjZXNzKHJlcywgcmVzdWx0cyk7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIHJldHVybkVycm9yKHJlcSwgcmVzLCBlcnJvcik7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2VuZFZvaWNlKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSkge1xyXG4gIC8qKlxyXG4gICAqICNzd2FnZ2VyLnRhZ3MgPSBbXCJNZXNzYWdlc1wiXVxyXG4gICAgICNzd2FnZ2VyLmF1dG9Cb2R5PWZhbHNlXHJcbiAgICAgI3N3YWdnZXIuc2VjdXJpdHkgPSBbe1xyXG4gICAgICAgICAgICBcImJlYXJlckF1dGhcIjogW11cclxuICAgICB9XVxyXG4gICAgICNzd2FnZ2VyLnBhcmFtZXRlcnNbXCJzZXNzaW9uXCJdID0ge1xyXG4gICAgICBzY2hlbWE6ICdORVJEV0hBVFNfQU1FUklDQSdcclxuICAgICB9XHJcbiAgICAgI3N3YWdnZXIucmVxdWVzdEJvZHkgPSB7XHJcbiAgICAgICAgcmVxdWlyZWQ6IHRydWUsXHJcbiAgICAgICAgXCJAY29udGVudFwiOiB7XHJcbiAgICAgICAgICAgIFwiYXBwbGljYXRpb24vanNvblwiOiB7XHJcbiAgICAgICAgICAgICAgICBzY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJwaG9uZVwiOiB7IHR5cGU6IFwic3RyaW5nXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJpc0dyb3VwXCI6IHsgdHlwZTogXCJib29sZWFuXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJwYXRoXCI6IHsgdHlwZTogXCJzdHJpbmdcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBcInF1b3RlZE1lc3NhZ2VJZFwiOiB7IHR5cGU6IFwic3RyaW5nXCIgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBleGFtcGxlczoge1xyXG4gICAgICAgICAgICAgICAgICAgIFwiRGVmYXVsdFwiOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInBob25lXCI6IFwiNTUyMTk5OTk5OTk5OVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJpc0dyb3VwXCI6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJwYXRoXCI6IFwiPHBhdGhfZmlsZT5cIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwicXVvdGVkTWVzc2FnZUlkXCI6IFwibWVzc2FnZSBJZFwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICovXHJcbiAgY29uc3Qge1xyXG4gICAgcGhvbmUsXHJcbiAgICBwYXRoLFxyXG4gICAgZmlsZW5hbWUgPSAnVm9pY2UgQXVkaW8nLFxyXG4gICAgbWVzc2FnZSxcclxuICAgIHF1b3RlZE1lc3NhZ2VJZCxcclxuICB9ID0gcmVxLmJvZHk7XHJcblxyXG4gIHRyeSB7XHJcbiAgICBjb25zdCByZXN1bHRzOiBhbnkgPSBbXTtcclxuICAgIGZvciAoY29uc3QgY29udGF0byBvZiBwaG9uZSkge1xyXG4gICAgICByZXN1bHRzLnB1c2goXHJcbiAgICAgICAgYXdhaXQgcmVxLmNsaWVudC5zZW5kUHR0KFxyXG4gICAgICAgICAgY29udGF0byxcclxuICAgICAgICAgIHBhdGgsXHJcbiAgICAgICAgICBmaWxlbmFtZSxcclxuICAgICAgICAgIG1lc3NhZ2UsXHJcbiAgICAgICAgICBxdW90ZWRNZXNzYWdlSWRcclxuICAgICAgICApXHJcbiAgICAgICk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHJlc3VsdHMubGVuZ3RoID09PSAwKVxyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oJ0Vycm9yIHNlbmRpbmcgbWVzc2FnZScpO1xyXG4gICAgcmV0dXJuU3VjZXNzKHJlcywgcmVzdWx0cyk7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIHJldHVybkVycm9yKHJlcSwgcmVzLCBlcnJvcik7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2VuZFZvaWNlNjQocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKSB7XHJcbiAgLyoqXHJcbiAgICogI3N3YWdnZXIudGFncyA9IFtcIk1lc3NhZ2VzXCJdXHJcbiAgICAgI3N3YWdnZXIuYXV0b0JvZHk9ZmFsc2VcclxuICAgICAjc3dhZ2dlci5zZWN1cml0eSA9IFt7XHJcbiAgICAgICAgICAgIFwiYmVhcmVyQXV0aFwiOiBbXVxyXG4gICAgIH1dXHJcbiAgICAgI3N3YWdnZXIucGFyYW1ldGVyc1tcInNlc3Npb25cIl0gPSB7XHJcbiAgICAgIHNjaGVtYTogJ05FUkRXSEFUU19BTUVSSUNBJ1xyXG4gICAgIH1cclxuICAgICAjc3dhZ2dlci5yZXF1ZXN0Qm9keSA9IHtcclxuICAgICAgICByZXF1aXJlZDogdHJ1ZSxcclxuICAgICAgICBcIkBjb250ZW50XCI6IHtcclxuICAgICAgICAgICAgXCJhcHBsaWNhdGlvbi9qc29uXCI6IHtcclxuICAgICAgICAgICAgICAgIHNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBcInBob25lXCI6IHsgdHlwZTogXCJzdHJpbmdcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBcImlzR3JvdXBcIjogeyB0eXBlOiBcImJvb2xlYW5cIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBcImJhc2U2NFB0dFwiOiB7IHR5cGU6IFwic3RyaW5nXCIgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBleGFtcGxlczoge1xyXG4gICAgICAgICAgICAgICAgICAgIFwiRGVmYXVsdFwiOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInBob25lXCI6IFwiNTUyMTk5OTk5OTk5OVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJpc0dyb3VwXCI6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJiYXNlNjRQdHRcIjogXCI8YmFzZTY0X3N0cmluZz5cIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAqL1xyXG4gIGNvbnN0IHsgcGhvbmUsIGJhc2U2NFB0dCB9ID0gcmVxLmJvZHk7XHJcblxyXG4gIHRyeSB7XHJcbiAgICBjb25zdCByZXN1bHRzOiBhbnkgPSBbXTtcclxuICAgIGZvciAoY29uc3QgY29udGF0byBvZiBwaG9uZSkge1xyXG4gICAgICByZXN1bHRzLnB1c2goXHJcbiAgICAgICAgYXdhaXQgcmVxLmNsaWVudC5zZW5kUHR0RnJvbUJhc2U2NChjb250YXRvLCBiYXNlNjRQdHQsICdWb2ljZSBBdWRpbycpXHJcbiAgICAgICk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHJlc3VsdHMubGVuZ3RoID09PSAwKVxyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oJ0Vycm9yIHNlbmRpbmcgbWVzc2FnZScpO1xyXG4gICAgcmV0dXJuU3VjZXNzKHJlcywgcmVzdWx0cyk7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIHJldHVybkVycm9yKHJlcSwgcmVzLCBlcnJvcik7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2VuZExpbmtQcmV2aWV3KHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSkge1xyXG4gIC8qKlxyXG4gICAqICNzd2FnZ2VyLnRhZ3MgPSBbXCJNZXNzYWdlc1wiXVxyXG4gICAgICNzd2FnZ2VyLmF1dG9Cb2R5PWZhbHNlXHJcbiAgICAgI3N3YWdnZXIuc2VjdXJpdHkgPSBbe1xyXG4gICAgICAgICAgICBcImJlYXJlckF1dGhcIjogW11cclxuICAgICB9XVxyXG4gICAgICNzd2FnZ2VyLnBhcmFtZXRlcnNbXCJzZXNzaW9uXCJdID0ge1xyXG4gICAgICBzY2hlbWE6ICdORVJEV0hBVFNfQU1FUklDQSdcclxuICAgICB9XHJcbiAgICAgI3N3YWdnZXIucmVxdWVzdEJvZHkgPSB7XHJcbiAgICAgICAgcmVxdWlyZWQ6IHRydWUsXHJcbiAgICAgICAgXCJAY29udGVudFwiOiB7XHJcbiAgICAgICAgICAgIFwiYXBwbGljYXRpb24vanNvblwiOiB7XHJcbiAgICAgICAgICAgICAgICBzY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJwaG9uZVwiOiB7IHR5cGU6IFwic3RyaW5nXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJpc0dyb3VwXCI6IHsgdHlwZTogXCJib29sZWFuXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJ1cmxcIjogeyB0eXBlOiBcInN0cmluZ1wiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiY2FwdGlvblwiOiB7IHR5cGU6IFwic3RyaW5nXCIgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBleGFtcGxlczoge1xyXG4gICAgICAgICAgICAgICAgICAgIFwiRGVmYXVsdFwiOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInBob25lXCI6IFwiNTUyMTk5OTk5OTk5OVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJpc0dyb3VwXCI6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJ1cmxcIjogXCJodHRwOi8vd3d3LmxpbmsuY29tXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImNhcHRpb25cIjogXCJUZXh0IGZvciBkZXNjcmliZSBsaW5rXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgKi9cclxuICBjb25zdCB7IHBob25lLCB1cmwsIGNhcHRpb24gfSA9IHJlcS5ib2R5O1xyXG5cclxuICB0cnkge1xyXG4gICAgY29uc3QgcmVzdWx0czogYW55ID0gW107XHJcbiAgICBmb3IgKGNvbnN0IGNvbnRhdG8gb2YgcGhvbmUpIHtcclxuICAgICAgcmVzdWx0cy5wdXNoKFxyXG4gICAgICAgIGF3YWl0IHJlcS5jbGllbnQuc2VuZExpbmtQcmV2aWV3KGAke2NvbnRhdG99YCwgdXJsLCBjYXB0aW9uKVxyXG4gICAgICApO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChyZXN1bHRzLmxlbmd0aCA9PT0gMClcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKCdFcnJvciBzZW5kaW5nIG1lc3NhZ2UnKTtcclxuICAgIHJldHVyblN1Y2VzcyhyZXMsIHJlc3VsdHMpO1xyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICByZXR1cm5FcnJvcihyZXEsIHJlcywgZXJyb3IpO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNlbmRMb2NhdGlvbihyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpIHtcclxuICAvKipcclxuICAgKiAjc3dhZ2dlci50YWdzID0gW1wiTWVzc2FnZXNcIl1cclxuICAgICAjc3dhZ2dlci5hdXRvQm9keT1mYWxzZVxyXG4gICAgICNzd2FnZ2VyLnNlY3VyaXR5ID0gW3tcclxuICAgICAgICAgICAgXCJiZWFyZXJBdXRoXCI6IFtdXHJcbiAgICAgfV1cclxuICAgICAjc3dhZ2dlci5wYXJhbWV0ZXJzW1wic2Vzc2lvblwiXSA9IHtcclxuICAgICAgc2NoZW1hOiAnTkVSRFdIQVRTX0FNRVJJQ0EnXHJcbiAgICAgfVxyXG4gICAgICNzd2FnZ2VyLnJlcXVlc3RCb2R5ID0ge1xyXG4gICAgICAgIHJlcXVpcmVkOiB0cnVlLFxyXG4gICAgICAgIFwiQGNvbnRlbnRcIjoge1xyXG4gICAgICAgICAgICBcImFwcGxpY2F0aW9uL2pzb25cIjoge1xyXG4gICAgICAgICAgICAgICAgc2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwicGhvbmVcIjogeyB0eXBlOiBcInN0cmluZ1wiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiaXNHcm91cFwiOiB7IHR5cGU6IFwiYm9vbGVhblwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwibGF0XCI6IHsgdHlwZTogXCJzdHJpbmdcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBcImxuZ1wiOiB7IHR5cGU6IFwic3RyaW5nXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJ0aXRsZVwiOiB7IHR5cGU6IFwic3RyaW5nXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJhZGRyZXNzXCI6IHsgdHlwZTogXCJzdHJpbmdcIiB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIGV4YW1wbGVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgXCJEZWZhdWx0XCI6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwicGhvbmVcIjogXCI1NTIxOTk5OTk5OTk5XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImlzR3JvdXBcIjogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImxhdFwiOiBcIi04OTg5ODMyMlwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJsbmdcIjogXCItNTQ1NDU0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInRpdGxlXCI6IFwiUmlvIGRlIEphbmVpcm9cIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiYWRkcmVzc1wiOiBcIkF2LiBOLiBTLiBkZSBDb3BhY2FiYW5hLCAyNSwgQ29wYWNhYmFuYVwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICovXHJcbiAgY29uc3QgeyBwaG9uZSwgbGF0LCBsbmcsIHRpdGxlLCBhZGRyZXNzIH0gPSByZXEuYm9keTtcclxuXHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHJlc3VsdHM6IGFueSA9IFtdO1xyXG4gICAgZm9yIChjb25zdCBjb250YXRvIG9mIHBob25lKSB7XHJcbiAgICAgIHJlc3VsdHMucHVzaChcclxuICAgICAgICBhd2FpdCByZXEuY2xpZW50LnNlbmRMb2NhdGlvbihjb250YXRvLCB7XHJcbiAgICAgICAgICBsYXQ6IGxhdCxcclxuICAgICAgICAgIGxuZzogbG5nLFxyXG4gICAgICAgICAgYWRkcmVzczogYWRkcmVzcyxcclxuICAgICAgICAgIG5hbWU6IHRpdGxlLFxyXG4gICAgICAgIH0pXHJcbiAgICAgICk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHJlc3VsdHMubGVuZ3RoID09PSAwKVxyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oJ0Vycm9yIHNlbmRpbmcgbWVzc2FnZScpO1xyXG4gICAgcmV0dXJuU3VjZXNzKHJlcywgcmVzdWx0cyk7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIHJldHVybkVycm9yKHJlcSwgcmVzLCBlcnJvcik7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2VuZEJ1dHRvbnMocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKSB7XHJcbiAgLyoqXHJcbiAgICogI3N3YWdnZXIudGFncyA9IFtcIk1lc3NhZ2VzXCJdXHJcbiAgICAgI3N3YWdnZXIuYXV0b0JvZHk9ZmFsc2VcclxuICAgICAjc3dhZ2dlci5zZWN1cml0eSA9IFt7XHJcbiAgICAgICAgICAgIFwiYmVhcmVyQXV0aFwiOiBbXVxyXG4gICAgIH1dXHJcbiAgICAgI3N3YWdnZXIucGFyYW1ldGVyc1tcInNlc3Npb25cIl0gPSB7XHJcbiAgICAgIHNjaGVtYTogJ05FUkRXSEFUU19BTUVSSUNBJyxcclxuICAgICB9XHJcbiAgICAgI3N3YWdnZXIuZGVwcmVjYXRlZD10cnVlXHJcbiAgICovXHJcbiAgY29uc3QgeyBwaG9uZSwgbWVzc2FnZSwgb3B0aW9ucyB9ID0gcmVxLmJvZHk7XHJcblxyXG4gIHRyeSB7XHJcbiAgICBjb25zdCByZXN1bHRzOiBhbnkgPSBbXTtcclxuXHJcbiAgICBmb3IgKGNvbnN0IGNvbnRhY3Qgb2YgcGhvbmUpIHtcclxuICAgICAgcmVzdWx0cy5wdXNoKGF3YWl0IHJlcS5jbGllbnQuc2VuZFRleHQoY29udGFjdCwgbWVzc2FnZSwgb3B0aW9ucykpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChyZXN1bHRzLmxlbmd0aCA9PT0gMClcclxuICAgICAgcmV0dXJuIHJldHVybkVycm9yKHJlcSwgcmVzLCAnRXJyb3Igc2VuZGluZyBtZXNzYWdlIHdpdGggYnV0dG9ucycpO1xyXG5cclxuICAgIHJldHVyblN1Y2VzcyhyZXMsIHBob25lKTtcclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgcmV0dXJuRXJyb3IocmVxLCByZXMsIGVycm9yKTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzZW5kTGlzdE1lc3NhZ2UocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKSB7XHJcbiAgLyoqXHJcbiAgICogI3N3YWdnZXIudGFncyA9IFtcIk1lc3NhZ2VzXCJdXHJcbiAgICAgI3N3YWdnZXIuYXV0b0JvZHk9ZmFsc2VcclxuICAgICAjc3dhZ2dlci5zZWN1cml0eSA9IFt7XHJcbiAgICAgICAgICAgIFwiYmVhcmVyQXV0aFwiOiBbXVxyXG4gICAgIH1dXHJcbiAgICAgI3N3YWdnZXIucGFyYW1ldGVyc1tcInNlc3Npb25cIl0gPSB7XHJcbiAgICAgIHNjaGVtYTogJ05FUkRXSEFUU19BTUVSSUNBJyxcclxuICAgICB9XHJcbiAgICAgI3N3YWdnZXIuZGVwcmVjYXRlZD10cnVlXHJcbiAgICovXHJcbiAgY29uc3Qge1xyXG4gICAgcGhvbmUsXHJcbiAgICBkZXNjcmlwdGlvbiA9ICcnLFxyXG4gICAgc2VjdGlvbnMsXHJcbiAgICBidXR0b25UZXh0ID0gJ1NFTEVDSU9ORSBVTUEgT1DDh8ODTycsXHJcbiAgfSA9IHJlcS5ib2R5O1xyXG5cclxuICB0cnkge1xyXG4gICAgY29uc3QgcmVzdWx0czogYW55ID0gW107XHJcblxyXG4gICAgZm9yIChjb25zdCBjb250YWN0IG9mIHBob25lKSB7XHJcbiAgICAgIHJlc3VsdHMucHVzaChcclxuICAgICAgICBhd2FpdCByZXEuY2xpZW50LnNlbmRMaXN0TWVzc2FnZShjb250YWN0LCB7XHJcbiAgICAgICAgICBidXR0b25UZXh0OiBidXR0b25UZXh0LFxyXG4gICAgICAgICAgZGVzY3JpcHRpb246IGRlc2NyaXB0aW9uLFxyXG4gICAgICAgICAgc2VjdGlvbnM6IHNlY3Rpb25zLFxyXG4gICAgICAgIH0pXHJcbiAgICAgICk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHJlc3VsdHMubGVuZ3RoID09PSAwKVxyXG4gICAgICByZXR1cm4gcmV0dXJuRXJyb3IocmVxLCByZXMsICdFcnJvciBzZW5kaW5nIGxpc3QgYnV0dG9ucycpO1xyXG5cclxuICAgIHJldHVyblN1Y2VzcyhyZXMsIHJlc3VsdHMpO1xyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICByZXR1cm5FcnJvcihyZXEsIHJlcywgZXJyb3IpO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNlbmRQb2xsTWVzc2FnZShyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpIHtcclxuICAvKipcclxuICAgKiAjc3dhZ2dlci50YWdzID0gW1wiTWVzc2FnZXNcIl1cclxuICAgICAjc3dhZ2dlci5hdXRvQm9keT1mYWxzZVxyXG4gICAgICNzd2FnZ2VyLnNlY3VyaXR5ID0gW3tcclxuICAgICAgICAgICAgXCJiZWFyZXJBdXRoXCI6IFtdXHJcbiAgICAgfV1cclxuICAgICAjc3dhZ2dlci5wYXJhbWV0ZXJzW1wic2Vzc2lvblwiXSA9IHtcclxuICAgICAgc2NoZW1hOiAnTkVSRFdIQVRTX0FNRVJJQ0EnXHJcbiAgICAgfVxyXG4gICAgI3N3YWdnZXIucmVxdWVzdEJvZHkgPSB7XHJcbiAgICAgICAgcmVxdWlyZWQ6IHRydWUsXHJcbiAgICAgICAgXCJAY29udGVudFwiOiB7XHJcbiAgICAgICAgICAgIFwiYXBwbGljYXRpb24vanNvblwiOiB7XHJcbiAgICAgICAgICAgICAgICBzY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGhvbmU6IHsgdHlwZTogXCJzdHJpbmdcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpc0dyb3VwOiB7IHR5cGU6IFwiYm9vbGVhblwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IHsgdHlwZTogXCJzdHJpbmdcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjaG9pY2VzOiB7IHR5cGU6IFwiYXJyYXlcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25zOiB7IHR5cGU6IFwib2JqZWN0XCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgZXhhbXBsZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICBcIkRlZmF1bHRcIjoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHBob25lOiAnNTUyMTk5OTk5OTk5OScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaXNHcm91cDogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogJ1BvbGwgbmFtZScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY2hvaWNlczogWydPcHRpb24gMScsICdPcHRpb24gMicsICdPcHRpb24gMyddLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGVjdGFibGVDb3VudDogMSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAqL1xyXG4gIGNvbnN0IHsgcGhvbmUsIG5hbWUsIGNob2ljZXMsIG9wdGlvbnMgfSA9IHJlcS5ib2R5O1xyXG5cclxuICB0cnkge1xyXG4gICAgY29uc3QgcmVzdWx0czogYW55ID0gW107XHJcblxyXG4gICAgZm9yIChjb25zdCBjb250YWN0IG9mIHBob25lKSB7XHJcbiAgICAgIHJlc3VsdHMucHVzaChcclxuICAgICAgICBhd2FpdCByZXEuY2xpZW50LnNlbmRQb2xsTWVzc2FnZShjb250YWN0LCBuYW1lLCBjaG9pY2VzLCBvcHRpb25zKVxyXG4gICAgICApO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChyZXN1bHRzLmxlbmd0aCA9PT0gMClcclxuICAgICAgcmV0dXJuIHJldHVybkVycm9yKHJlcSwgcmVzLCAnRXJyb3Igc2VuZGluZyBwb2xsIG1lc3NhZ2UnKTtcclxuXHJcbiAgICByZXR1cm5TdWNlc3MocmVzLCByZXN1bHRzKTtcclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgcmV0dXJuRXJyb3IocmVxLCByZXMsIGVycm9yKTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzZW5kU3RhdHVzVGV4dChyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpIHtcclxuICAvKipcclxuICAgKiAjc3dhZ2dlci50YWdzID0gW1wiTWVzc2FnZXNcIl1cclxuICAgICAjc3dhZ2dlci5hdXRvQm9keT1mYWxzZVxyXG4gICAgICNzd2FnZ2VyLnNlY3VyaXR5ID0gW3tcclxuICAgICAgICAgICAgXCJiZWFyZXJBdXRoXCI6IFtdXHJcbiAgICAgfV1cclxuICAgICAjc3dhZ2dlci5wYXJhbWV0ZXJzW1wic2Vzc2lvblwiXSA9IHtcclxuICAgICAgc2NoZW1hOiAnTkVSRFdIQVRTX0FNRVJJQ0EnXHJcbiAgICAgfVxyXG4gICAgICNzd2FnZ2VyLnJlcXVlc3RCb2R5ID0ge1xyXG4gICAgICByZXF1aXJlZDogdHJ1ZSxcclxuICAgICAgY29udGVudDoge1xyXG4gICAgICAgICdhcHBsaWNhdGlvbi9qc29uJzoge1xyXG4gICAgICAgICAgc2NoZW1hOiB7XHJcbiAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxyXG4gICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgcGhvbmU6IHsgdHlwZTogJ3N0cmluZycgfSxcclxuICAgICAgICAgICAgICBpc0dyb3VwOiB7IHR5cGU6ICdib29sZWFuJyB9LFxyXG4gICAgICAgICAgICAgIG1lc3NhZ2U6IHsgdHlwZTogJ3N0cmluZycgfSxcclxuICAgICAgICAgICAgICBtZXNzYWdlSWQ6IHsgdHlwZTogJ3N0cmluZycgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICByZXF1aXJlZDogWydwaG9uZScsICdpc0dyb3VwJywgJ21lc3NhZ2UnXVxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIGV4YW1wbGVzOiB7XHJcbiAgICAgICAgICAgIERlZmF1bHQ6IHtcclxuICAgICAgICAgICAgICB2YWx1ZToge1xyXG4gICAgICAgICAgICAgICAgcGhvbmU6ICc1NTIxOTk5OTk5OTk5JyxcclxuICAgICAgICAgICAgICAgIGlzR3JvdXA6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ1JlcGx5IHRvIG1lc3NhZ2UnLFxyXG4gICAgICAgICAgICAgICAgbWVzc2FnZUlkOiAnPGlkX21lc3NhZ2U+J1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAqL1xyXG4gIGNvbnN0IHsgbWVzc2FnZSB9ID0gcmVxLmJvZHk7XHJcblxyXG4gIHRyeSB7XHJcbiAgICBjb25zdCByZXN1bHRzOiBhbnkgPSBbXTtcclxuICAgIHJlc3VsdHMucHVzaChhd2FpdCByZXEuY2xpZW50LnNlbmRUZXh0KCdzdGF0dXNAYnJvYWRjYXN0JywgbWVzc2FnZSkpO1xyXG5cclxuICAgIGlmIChyZXN1bHRzLmxlbmd0aCA9PT0gMClcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKCdFcnJvciBzZW5kaW5nIG1lc3NhZ2UnKTtcclxuICAgIHJldHVyblN1Y2VzcyhyZXMsIHJlc3VsdHMpO1xyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICByZXR1cm5FcnJvcihyZXEsIHJlcywgZXJyb3IpO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlcGx5TWVzc2FnZShyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpIHtcclxuICAvKipcclxuICAgKiAjc3dhZ2dlci50YWdzID0gW1wiTWVzc2FnZXNcIl1cclxuICAgICAjc3dhZ2dlci5hdXRvQm9keT1mYWxzZVxyXG4gICAgICNzd2FnZ2VyLnNlY3VyaXR5ID0gW3tcclxuICAgICAgICAgICAgXCJiZWFyZXJBdXRoXCI6IFtdXHJcbiAgICAgfV1cclxuICAgICAjc3dhZ2dlci5wYXJhbWV0ZXJzW1wic2Vzc2lvblwiXSA9IHtcclxuICAgICAgc2NoZW1hOiAnTkVSRFdIQVRTX0FNRVJJQ0EnXHJcbiAgICAgfVxyXG4gICAgICNzd2FnZ2VyLnJlcXVlc3RCb2R5ID0ge1xyXG4gICAgICByZXF1aXJlZDogdHJ1ZSxcclxuICAgICAgXCJAY29udGVudFwiOiB7XHJcbiAgICAgICAgXCJhcHBsaWNhdGlvbi9qc29uXCI6IHtcclxuICAgICAgICAgIHNjaGVtYToge1xyXG4gICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgXCJwaG9uZVwiOiB7IHR5cGU6IFwic3RyaW5nXCIgfSxcclxuICAgICAgICAgICAgICBcImlzR3JvdXBcIjogeyB0eXBlOiBcImJvb2xlYW5cIiB9LFxyXG4gICAgICAgICAgICAgIFwibWVzc2FnZVwiOiB7IHR5cGU6IFwic3RyaW5nXCIgfSxcclxuICAgICAgICAgICAgICBcIm1lc3NhZ2VJZFwiOiB7IHR5cGU6IFwic3RyaW5nXCIgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgZXhhbXBsZXM6IHtcclxuICAgICAgICAgICAgXCJEZWZhdWx0XCI6IHtcclxuICAgICAgICAgICAgICB2YWx1ZToge1xyXG4gICAgICAgICAgICAgICAgXCJwaG9uZVwiOiBcIjU1MjE5OTk5OTk5OTlcIixcclxuICAgICAgICAgICAgICAgIFwiaXNHcm91cFwiOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgIFwibWVzc2FnZVwiOiBcIlJlcGx5IHRvIG1lc3NhZ2VcIixcclxuICAgICAgICAgICAgICAgIFwibWVzc2FnZUlkXCI6IFwiPGlkX21lc3NhZ2U+XCJcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgKi9cclxuICBjb25zdCB7IHBob25lLCBtZXNzYWdlLCBtZXNzYWdlSWQgfSA9IHJlcS5ib2R5O1xyXG5cclxuICB0cnkge1xyXG4gICAgY29uc3QgcmVzdWx0czogYW55ID0gW107XHJcbiAgICBmb3IgKGNvbnN0IGNvbnRhdG8gb2YgcGhvbmUpIHtcclxuICAgICAgcmVzdWx0cy5wdXNoKGF3YWl0IHJlcS5jbGllbnQucmVwbHkoY29udGF0bywgbWVzc2FnZSwgbWVzc2FnZUlkKSk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHJlc3VsdHMubGVuZ3RoID09PSAwKVxyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oJ0Vycm9yIHNlbmRpbmcgbWVzc2FnZScpO1xyXG4gICAgcmVxLmlvLmVtaXQoJ21lbnNhZ2VtLWVudmlhZGEnLCB7IG1lc3NhZ2U6IG1lc3NhZ2UsIHRvOiBwaG9uZSB9KTtcclxuICAgIHJldHVyblN1Y2VzcyhyZXMsIHJlc3VsdHMpO1xyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICByZXR1cm5FcnJvcihyZXEsIHJlcywgZXJyb3IpO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNlbmRNZW50aW9uZWQocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKSB7XHJcbiAgLyoqXHJcbiAgICogI3N3YWdnZXIudGFncyA9IFtcIk1lc3NhZ2VzXCJdXHJcbiAgICAgI3N3YWdnZXIuYXV0b0JvZHk9ZmFsc2VcclxuICAgICAjc3dhZ2dlci5zZWN1cml0eSA9IFt7XHJcbiAgICAgICAgICAgIFwiYmVhcmVyQXV0aFwiOiBbXVxyXG4gICAgIH1dXHJcbiAgICAgI3N3YWdnZXIucGFyYW1ldGVyc1tcInNlc3Npb25cIl0gPSB7XHJcbiAgICAgIHNjaGVtYTogJ05FUkRXSEFUU19BTUVSSUNBJ1xyXG4gICAgIH1cclxuICAgICAjc3dhZ2dlci5yZXF1ZXN0Qm9keSA9IHtcclxuICByZXF1aXJlZDogdHJ1ZSxcclxuICBcIkBjb250ZW50XCI6IHtcclxuICAgIFwiYXBwbGljYXRpb24vanNvblwiOiB7XHJcbiAgICAgIHNjaGVtYToge1xyXG4gICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgXCJwaG9uZVwiOiB7IHR5cGU6IFwic3RyaW5nXCIgfSxcclxuICAgICAgICAgIFwiaXNHcm91cFwiOiB7IHR5cGU6IFwiYm9vbGVhblwiIH0sXHJcbiAgICAgICAgICBcIm1lc3NhZ2VcIjogeyB0eXBlOiBcInN0cmluZ1wiIH0sXHJcbiAgICAgICAgICBcIm1lbnRpb25lZFwiOiB7IHR5cGU6IFwiYXJyYXlcIiwgaXRlbXM6IHsgdHlwZTogXCJzdHJpbmdcIiB9IH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIHJlcXVpcmVkOiBbXCJwaG9uZVwiLCBcIm1lc3NhZ2VcIiwgXCJtZW50aW9uZWRcIl1cclxuICAgICAgfSxcclxuICAgICAgZXhhbXBsZXM6IHtcclxuICAgICAgICBcIkRlZmF1bHRcIjoge1xyXG4gICAgICAgICAgdmFsdWU6IHtcclxuICAgICAgICAgICAgXCJwaG9uZVwiOiBcIjU1MjE5OTk5OTk5OTlcIixcclxuICAgICAgICAgICAgXCJpc0dyb3VwXCI6IHRydWUsXHJcbiAgICAgICAgICAgIFwibWVzc2FnZVwiOiBcIllvdXIgdGV4dCBtZXNzYWdlXCIsXHJcbiAgICAgICAgICAgIFwibWVudGlvbmVkXCI6IFtcIkA1NTY1OTMwNzcxNzFAYy51c1wiXVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxufVxyXG4gICAqL1xyXG4gIGNvbnN0IHsgcGhvbmUsIG1lc3NhZ2UsIG1lbnRpb25lZCB9ID0gcmVxLmJvZHk7XHJcblxyXG4gIHRyeSB7XHJcbiAgICBsZXQgcmVzcG9uc2U7XHJcbiAgICBmb3IgKGNvbnN0IGNvbnRhdG8gb2YgcGhvbmUpIHtcclxuICAgICAgcmVzcG9uc2UgPSBhd2FpdCByZXEuY2xpZW50LnNlbmRNZW50aW9uZWQoXHJcbiAgICAgICAgYCR7Y29udGF0b31gLFxyXG4gICAgICAgIG1lc3NhZ2UsXHJcbiAgICAgICAgbWVudGlvbmVkXHJcbiAgICAgICk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAxKS5qc29uKHsgc3RhdHVzOiAnc3VjY2VzcycsIHJlc3BvbnNlOiByZXNwb25zZSB9KTtcclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgcmVxLmxvZ2dlci5lcnJvcihlcnJvcik7XHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oe1xyXG4gICAgICBzdGF0dXM6ICdlcnJvcicsXHJcbiAgICAgIG1lc3NhZ2U6ICdFcnJvciBvbiBzZW5kIG1lc3NhZ2UgbWVudGlvbmVkJyxcclxuICAgICAgZXJyb3I6IGVycm9yLFxyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzZW5kSW1hZ2VBc1N0aWNrZXIocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKSB7XHJcbiAgLyoqXHJcbiAgICogI3N3YWdnZXIudGFncyA9IFtcIk1lc3NhZ2VzXCJdXHJcbiAgICAgI3N3YWdnZXIuYXV0b0JvZHk9ZmFsc2VcclxuICAgICAjc3dhZ2dlci5zZWN1cml0eSA9IFt7XHJcbiAgICAgICAgICAgIFwiYmVhcmVyQXV0aFwiOiBbXVxyXG4gICAgIH1dXHJcbiAgICAgI3N3YWdnZXIucGFyYW1ldGVyc1tcInNlc3Npb25cIl0gPSB7XHJcbiAgICAgIHNjaGVtYTogJ05FUkRXSEFUU19BTUVSSUNBJ1xyXG4gICAgIH1cclxuICAgICAjc3dhZ2dlci5yZXF1ZXN0Qm9keSA9IHtcclxuICAgICAgcmVxdWlyZWQ6IHRydWUsXHJcbiAgICAgIFwiQGNvbnRlbnRcIjoge1xyXG4gICAgICAgIFwiYXBwbGljYXRpb24vanNvblwiOiB7XHJcbiAgICAgICAgICBzY2hlbWE6IHtcclxuICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgIFwicGhvbmVcIjogeyB0eXBlOiBcInN0cmluZ1wiIH0sXHJcbiAgICAgICAgICAgICAgXCJpc0dyb3VwXCI6IHsgdHlwZTogXCJib29sZWFuXCIgfSxcclxuICAgICAgICAgICAgICBcInBhdGhcIjogeyB0eXBlOiBcInN0cmluZ1wiIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgcmVxdWlyZWQ6IFtcInBob25lXCIsIFwicGF0aFwiXVxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIGV4YW1wbGVzOiB7XHJcbiAgICAgICAgICAgIFwiRGVmYXVsdFwiOiB7XHJcbiAgICAgICAgICAgICAgdmFsdWU6IHtcclxuICAgICAgICAgICAgICAgIFwicGhvbmVcIjogXCI1NTIxOTk5OTk5OTk5XCIsXHJcbiAgICAgICAgICAgICAgICBcImlzR3JvdXBcIjogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIFwicGF0aFwiOiBcIjxwYXRoX2ZpbGU+XCJcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgKi9cclxuICBjb25zdCB7IHBob25lLCBwYXRoIH0gPSByZXEuYm9keTtcclxuXHJcbiAgaWYgKCFwYXRoICYmICFyZXEuZmlsZSlcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDQwMSkuc2VuZCh7XHJcbiAgICAgIG1lc3NhZ2U6ICdTZW5kaW5nIHRoZSBmaWxlIGlzIG1hbmRhdG9yeScsXHJcbiAgICB9KTtcclxuXHJcbiAgY29uc3QgcGF0aEZpbGUgPSBwYXRoIHx8IHJlcS5maWxlPy5wYXRoO1xyXG5cclxuICB0cnkge1xyXG4gICAgY29uc3QgcmVzdWx0czogYW55ID0gW107XHJcbiAgICBmb3IgKGNvbnN0IGNvbnRhdG8gb2YgcGhvbmUpIHtcclxuICAgICAgcmVzdWx0cy5wdXNoKGF3YWl0IHJlcS5jbGllbnQuc2VuZEltYWdlQXNTdGlja2VyKGNvbnRhdG8sIHBhdGhGaWxlKSk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHJlc3VsdHMubGVuZ3RoID09PSAwKVxyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oJ0Vycm9yIHNlbmRpbmcgbWVzc2FnZScpO1xyXG4gICAgaWYgKHJlcS5maWxlKSBhd2FpdCB1bmxpbmtBc3luYyhwYXRoRmlsZSk7XHJcbiAgICByZXR1cm5TdWNlc3MocmVzLCByZXN1bHRzKTtcclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgcmV0dXJuRXJyb3IocmVxLCByZXMsIGVycm9yKTtcclxuICB9XHJcbn1cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNlbmRJbWFnZUFzU3RpY2tlckdpZihyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpIHtcclxuICAvKipcclxuICAgKiAjc3dhZ2dlci50YWdzID0gW1wiTWVzc2FnZXNcIl1cclxuICAgICAjc3dhZ2dlci5hdXRvQm9keT1mYWxzZVxyXG4gICAgICNzd2FnZ2VyLnNlY3VyaXR5ID0gW3tcclxuICAgICAgICAgICAgXCJiZWFyZXJBdXRoXCI6IFtdXHJcbiAgICAgfV1cclxuICAgICAjc3dhZ2dlci5wYXJhbWV0ZXJzW1wic2Vzc2lvblwiXSA9IHtcclxuICAgICAgc2NoZW1hOiAnTkVSRFdIQVRTX0FNRVJJQ0EnXHJcbiAgICAgfVxyXG4gICAgICNzd2FnZ2VyLnJlcXVlc3RCb2R5ID0ge1xyXG4gICAgICByZXF1aXJlZDogdHJ1ZSxcclxuICAgICAgY29udGVudDoge1xyXG4gICAgICAgICdhcHBsaWNhdGlvbi9qc29uJzoge1xyXG4gICAgICAgICAgc2NoZW1hOiB7XHJcbiAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxyXG4gICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgcGhvbmU6IHsgdHlwZTogJ3N0cmluZycgfSxcclxuICAgICAgICAgICAgICBpc0dyb3VwOiB7IHR5cGU6ICdib29sZWFuJyB9LFxyXG4gICAgICAgICAgICAgIHBhdGg6IHsgdHlwZTogJ3N0cmluZycgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgcmVxdWlyZWQ6IFsncGhvbmUnLCAncGF0aCddLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIGV4YW1wbGVzOiB7XHJcbiAgICAgICAgICAgICdEZWZhdWx0Jzoge1xyXG4gICAgICAgICAgICAgIHZhbHVlOiB7XHJcbiAgICAgICAgICAgICAgICBwaG9uZTogJzU1MjE5OTk5OTk5OTknLFxyXG4gICAgICAgICAgICAgICAgaXNHcm91cDogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIHBhdGg6ICc8cGF0aF9maWxlPicsXHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgIH1cclxuICAgKi9cclxuICBjb25zdCB7IHBob25lLCBwYXRoIH0gPSByZXEuYm9keTtcclxuXHJcbiAgaWYgKCFwYXRoICYmICFyZXEuZmlsZSlcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDQwMSkuc2VuZCh7XHJcbiAgICAgIG1lc3NhZ2U6ICdTZW5kaW5nIHRoZSBmaWxlIGlzIG1hbmRhdG9yeScsXHJcbiAgICB9KTtcclxuXHJcbiAgY29uc3QgcGF0aEZpbGUgPSBwYXRoIHx8IHJlcS5maWxlPy5wYXRoO1xyXG5cclxuICB0cnkge1xyXG4gICAgY29uc3QgcmVzdWx0czogYW55ID0gW107XHJcbiAgICBmb3IgKGNvbnN0IGNvbnRhdG8gb2YgcGhvbmUpIHtcclxuICAgICAgcmVzdWx0cy5wdXNoKGF3YWl0IHJlcS5jbGllbnQuc2VuZEltYWdlQXNTdGlja2VyR2lmKGNvbnRhdG8sIHBhdGhGaWxlKSk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHJlc3VsdHMubGVuZ3RoID09PSAwKVxyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oJ0Vycm9yIHNlbmRpbmcgbWVzc2FnZScpO1xyXG4gICAgaWYgKHJlcS5maWxlKSBhd2FpdCB1bmxpbmtBc3luYyhwYXRoRmlsZSk7XHJcbiAgICByZXR1cm5TdWNlc3MocmVzLCByZXN1bHRzKTtcclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgcmV0dXJuRXJyb3IocmVxLCByZXMsIGVycm9yKTtcclxuICB9XHJcbn1cclxuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFrQkEsSUFBQUEsVUFBQSxHQUFBQyxPQUFBLHNCQUFnRSxDQWxCaEU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBTUEsU0FBU0MsV0FBV0EsQ0FBQ0MsR0FBWSxFQUFFQyxHQUFhLEVBQUVDLEtBQVUsRUFBRSxDQUM1REYsR0FBRyxDQUFDRyxNQUFNLENBQUNELEtBQUssQ0FBQ0EsS0FBSyxDQUFDLENBQ3ZCRCxHQUFHLENBQUNHLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQ0MsSUFBSSxDQUFDLEVBQ25CRCxNQUFNLEVBQUUsT0FBTyxFQUNmRSxPQUFPLEVBQUUsNEJBQTRCLEVBQ3JDSixLQUFLLEVBQUVBLEtBQUssQ0FDZCxDQUFDLENBQUMsQ0FDSixDQUVBLGVBQWVLLFlBQVlBLENBQUNOLEdBQVEsRUFBRU8sSUFBUyxFQUFFLENBQy9DUCxHQUFHLENBQUNHLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQ0MsSUFBSSxDQUFDLEVBQUVELE1BQU0sRUFBRSxTQUFTLEVBQUVLLFFBQVEsRUFBRUQsSUFBSSxFQUFFRSxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUMvRTtBQUVPLGVBQWVDLFdBQVdBLENBQUNYLEdBQVksRUFBRUMsR0FBYSxFQUFFO0VBQzdEO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ0UsTUFBTSxFQUFFVyxLQUFLLEVBQUVOLE9BQU8sQ0FBQyxDQUFDLEdBQUdOLEdBQUcsQ0FBQ2EsSUFBSTs7RUFFbkMsTUFBTUMsT0FBTyxHQUFHZCxHQUFHLENBQUNhLElBQUksQ0FBQ0MsT0FBTyxJQUFJLENBQUMsQ0FBQzs7RUFFdEMsSUFBSTtJQUNGLE1BQU1DLE9BQVksR0FBRyxFQUFFO0lBQ3ZCLEtBQUssTUFBTUMsT0FBTyxJQUFJSixLQUFLLEVBQUU7TUFDM0JHLE9BQU8sQ0FBQ0UsSUFBSSxDQUFDLE1BQU1qQixHQUFHLENBQUNrQixNQUFNLENBQUNDLFFBQVEsQ0FBQ0gsT0FBTyxFQUFFVixPQUFPLEVBQUVRLE9BQU8sQ0FBQyxDQUFDO0lBQ3BFOztJQUVBLElBQUlDLE9BQU8sQ0FBQ0ssTUFBTSxLQUFLLENBQUM7SUFDdEIsT0FBT25CLEdBQUcsQ0FBQ0csTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDQyxJQUFJLENBQUMsdUJBQXVCLENBQUM7SUFDdERMLEdBQUcsQ0FBQ3FCLEVBQUUsQ0FBQ0MsSUFBSSxDQUFDLGtCQUFrQixFQUFFUCxPQUFPLENBQUM7SUFDeENSLFlBQVksQ0FBQ04sR0FBRyxFQUFFYyxPQUFPLENBQUM7RUFDNUIsQ0FBQyxDQUFDLE9BQU9iLEtBQUssRUFBRTtJQUNkSCxXQUFXLENBQUNDLEdBQUcsRUFBRUMsR0FBRyxFQUFFQyxLQUFLLENBQUM7RUFDOUI7QUFDRjtBQUNPLGVBQWVxQixZQUFZQSxDQUFDdkIsR0FBWSxFQUFFQyxHQUFhLEVBQUU7RUFDOUQ7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDRSxNQUFNLEVBQUV1QixRQUFRLENBQUMsQ0FBQyxHQUFHeEIsR0FBRyxDQUFDYSxJQUFJOztFQUU3QixNQUFNQyxPQUFPLEdBQUdkLEdBQUcsQ0FBQ2EsSUFBSSxDQUFDQyxPQUFPLElBQUksQ0FBQyxDQUFDOztFQUV0QyxJQUFJO0lBQ0YsTUFBTUMsT0FBWSxHQUFHLEVBQUU7SUFDdkIsS0FBSyxNQUFNVSxhQUFhLElBQUlELFFBQVEsRUFBRTtNQUNwQyxNQUFNRSxPQUFZLEdBQUcsRUFBRTtNQUN2QixNQUFNQyxRQUFRLEdBQUcsSUFBQUMseUJBQWMsRUFBQ0gsYUFBYSxDQUFDYixLQUFLLEVBQUUsS0FBSyxDQUFDO01BQzNELElBQUlpQixLQUFLLEdBQUcsQ0FBQztNQUNiLEtBQUssTUFBTUMsT0FBTyxJQUFJSCxRQUFRLEVBQUU7UUFDOUIsSUFBSTNCLEdBQUcsQ0FBQ2EsSUFBSSxDQUFDa0IsT0FBTyxFQUFFO1VBQ3BCSixRQUFRLENBQUNFLEtBQUssQ0FBQyxHQUFHQyxPQUFPO1FBQzNCLENBQUMsTUFBTSxJQUFJSixPQUFPLENBQUNNLE9BQU8sQ0FBQ0YsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFO1VBQ3ZDLE1BQU1HLE9BQVksR0FBRyxNQUFNakMsR0FBRyxDQUFDa0IsTUFBTTtVQUNsQ2dCLGlCQUFpQixDQUFDSixPQUFPLENBQUM7VUFDMUJLLEtBQUssQ0FBQyxDQUFDakMsS0FBSyxLQUFLa0MsT0FBTyxDQUFDQyxHQUFHLENBQUNuQyxLQUFLLENBQUMsQ0FBQztVQUN2QyxJQUFJLENBQUMrQixPQUFPLEVBQUVLLFlBQVksRUFBRTtZQUMxQixNQUFNQyxHQUFHLEdBQUlULE9BQU8sQ0FBU1UsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMxQyxPQUFPdkMsR0FBRyxDQUFDRyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUNDLElBQUksQ0FBQztjQUMxQkksUUFBUSxFQUFFO2dCQUNSUCxLQUFLLEVBQUUsV0FBVztnQkFDbEJVLEtBQUssRUFBRTJCLEdBQUc7Z0JBQ1ZFLElBQUksRUFBRXpDLEdBQUcsQ0FBQ2EsSUFBSSxDQUFDNkI7Y0FDakIsQ0FBQztjQUNEdEMsTUFBTSxFQUFFLFdBQVc7Y0FDbkJFLE9BQU8sRUFBRyxZQUFXaUMsR0FBSTtZQUMzQixDQUFDLENBQUM7VUFDSixDQUFDLE1BQU07WUFDTCxJQUFLYixPQUFPLENBQVNNLE9BQU8sQ0FBQ0MsT0FBTyxDQUFDVSxFQUFFLENBQUNDLFdBQVcsQ0FBQyxHQUFHLENBQUMsRUFBRTtjQUN2RGxCLE9BQU8sQ0FBU1QsSUFBSSxDQUFDZ0IsT0FBTyxDQUFDVSxFQUFFLENBQUNDLFdBQVcsQ0FBQztZQUMvQztZQUNDakIsUUFBUSxDQUFTRSxLQUFLLENBQUMsR0FBR0ksT0FBTyxDQUFDVSxFQUFFLENBQUNDLFdBQVc7VUFDbkQ7UUFDRjtRQUNBZixLQUFLLEVBQUU7TUFDVDtNQUNBLEtBQUssTUFBTUMsT0FBTyxJQUFJSCxRQUFRLEVBQUU7UUFDOUJaLE9BQU8sQ0FBQ0UsSUFBSTtVQUNWLE1BQU1qQixHQUFHLENBQUNrQixNQUFNLENBQUNDLFFBQVEsQ0FBQ1csT0FBTyxFQUFFTCxhQUFhLENBQUNuQixPQUFPLEVBQUVRLE9BQU87UUFDbkUsQ0FBQztNQUNIO0lBQ0Y7O0lBRUEsSUFBSUMsT0FBTyxDQUFDSyxNQUFNLEtBQUssQ0FBQztJQUN0QixPQUFPbkIsR0FBRyxDQUFDRyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUNDLElBQUksQ0FBQyx1QkFBdUIsQ0FBQztJQUN0REwsR0FBRyxDQUFDcUIsRUFBRSxDQUFDQyxJQUFJLENBQUMsa0JBQWtCLEVBQUVQLE9BQU8sQ0FBQztJQUN4Q1IsWUFBWSxDQUFDTixHQUFHLEVBQUVjLE9BQU8sQ0FBQztFQUM1QixDQUFDLENBQUMsT0FBT2IsS0FBSyxFQUFFO0lBQ2RILFdBQVcsQ0FBQ0MsR0FBRyxFQUFFQyxHQUFHLEVBQUVDLEtBQUssQ0FBQztFQUM5QjtBQUNGOztBQUVPLGVBQWUyQyxRQUFRQSxDQUFDN0MsR0FBWSxFQUFFQyxHQUFhLEVBQUU7RUFDMUQ7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFLE1BQU0sRUFBRVcsS0FBSyxFQUFFa0MsSUFBSSxFQUFFQyxNQUFNLEVBQUVDLFFBQVEsR0FBRyxNQUFNLEVBQUUxQyxPQUFPLEVBQUUyQyxPQUFPLENBQUMsQ0FBQyxHQUFHakQsR0FBRyxDQUFDYSxJQUFJOztFQUU3RSxNQUFNQyxPQUFPLEdBQUdkLEdBQUcsQ0FBQ2EsSUFBSSxDQUFDQyxPQUFPLElBQUksQ0FBQyxDQUFDOztFQUV0QyxJQUFJLENBQUNnQyxJQUFJLElBQUksQ0FBQzlDLEdBQUcsQ0FBQ2tELElBQUksSUFBSSxDQUFDSCxNQUFNO0VBQy9CLE9BQU85QyxHQUFHLENBQUNHLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQytDLElBQUksQ0FBQztJQUMxQjdDLE9BQU8sRUFBRTtFQUNYLENBQUMsQ0FBQzs7RUFFSixNQUFNOEMsUUFBUSxHQUFHTixJQUFJLElBQUlDLE1BQU0sSUFBSS9DLEdBQUcsQ0FBQ2tELElBQUksRUFBRUosSUFBSTtFQUNqRCxNQUFNTyxHQUFHLEdBQUcvQyxPQUFPLElBQUkyQyxPQUFPOztFQUU5QixJQUFJO0lBQ0YsTUFBTWxDLE9BQVksR0FBRyxFQUFFO0lBQ3ZCLEtBQUssTUFBTWUsT0FBTyxJQUFJbEIsS0FBSyxFQUFFO01BQzNCRyxPQUFPLENBQUNFLElBQUk7UUFDVixNQUFNakIsR0FBRyxDQUFDa0IsTUFBTSxDQUFDMkIsUUFBUSxDQUFDZixPQUFPLEVBQUVzQixRQUFRLEVBQUU7VUFDM0NKLFFBQVEsRUFBRUEsUUFBUTtVQUNsQkMsT0FBTyxFQUFFSSxHQUFHO1VBQ1osR0FBR3ZDO1FBQ0wsQ0FBQztNQUNILENBQUM7SUFDSDs7SUFFQSxJQUFJQyxPQUFPLENBQUNLLE1BQU0sS0FBSyxDQUFDO0lBQ3RCLE9BQU9uQixHQUFHLENBQUNHLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQ0MsSUFBSSxDQUFDLHVCQUF1QixDQUFDO0lBQ3RELElBQUlMLEdBQUcsQ0FBQ2tELElBQUksRUFBRSxNQUFNLElBQUFJLHNCQUFXLEVBQUNGLFFBQVEsQ0FBQztJQUN6QzdDLFlBQVksQ0FBQ04sR0FBRyxFQUFFYyxPQUFPLENBQUM7RUFDNUIsQ0FBQyxDQUFDLE9BQU9iLEtBQUssRUFBRTtJQUNkSCxXQUFXLENBQUNDLEdBQUcsRUFBRUMsR0FBRyxFQUFFQyxLQUFLLENBQUM7RUFDOUI7QUFDRjs7QUFFTyxlQUFlcUQsU0FBU0EsQ0FBQ3ZELEdBQVksRUFBRUMsR0FBYSxFQUFFO0VBQzNEO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFLE1BQU07SUFDSlcsS0FBSztJQUNMa0MsSUFBSTtJQUNKRSxRQUFRLEdBQUcsYUFBYTtJQUN4QjFDLE9BQU87SUFDUGtEO0VBQ0YsQ0FBQyxHQUFHeEQsR0FBRyxDQUFDYSxJQUFJOztFQUVaLElBQUk7SUFDRixNQUFNRSxPQUFZLEdBQUcsRUFBRTtJQUN2QixLQUFLLE1BQU1DLE9BQU8sSUFBSUosS0FBSyxFQUFFO01BQzNCRyxPQUFPLENBQUNFLElBQUk7UUFDVixNQUFNakIsR0FBRyxDQUFDa0IsTUFBTSxDQUFDdUMsT0FBTztVQUN0QnpDLE9BQU87VUFDUDhCLElBQUk7VUFDSkUsUUFBUTtVQUNSMUMsT0FBTztVQUNQa0Q7UUFDRjtNQUNGLENBQUM7SUFDSDs7SUFFQSxJQUFJekMsT0FBTyxDQUFDSyxNQUFNLEtBQUssQ0FBQztJQUN0QixPQUFPbkIsR0FBRyxDQUFDRyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUNDLElBQUksQ0FBQyx1QkFBdUIsQ0FBQztJQUN0REUsWUFBWSxDQUFDTixHQUFHLEVBQUVjLE9BQU8sQ0FBQztFQUM1QixDQUFDLENBQUMsT0FBT2IsS0FBSyxFQUFFO0lBQ2RILFdBQVcsQ0FBQ0MsR0FBRyxFQUFFQyxHQUFHLEVBQUVDLEtBQUssQ0FBQztFQUM5QjtBQUNGOztBQUVPLGVBQWV3RCxXQUFXQSxDQUFDMUQsR0FBWSxFQUFFQyxHQUFhLEVBQUU7RUFDN0Q7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDRSxNQUFNLEVBQUVXLEtBQUssRUFBRStDLFNBQVMsQ0FBQyxDQUFDLEdBQUczRCxHQUFHLENBQUNhLElBQUk7O0VBRXJDLElBQUk7SUFDRixNQUFNRSxPQUFZLEdBQUcsRUFBRTtJQUN2QixLQUFLLE1BQU1DLE9BQU8sSUFBSUosS0FBSyxFQUFFO01BQzNCRyxPQUFPLENBQUNFLElBQUk7UUFDVixNQUFNakIsR0FBRyxDQUFDa0IsTUFBTSxDQUFDMEMsaUJBQWlCLENBQUM1QyxPQUFPLEVBQUUyQyxTQUFTLEVBQUUsYUFBYTtNQUN0RSxDQUFDO0lBQ0g7O0lBRUEsSUFBSTVDLE9BQU8sQ0FBQ0ssTUFBTSxLQUFLLENBQUM7SUFDdEIsT0FBT25CLEdBQUcsQ0FBQ0csTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDQyxJQUFJLENBQUMsdUJBQXVCLENBQUM7SUFDdERFLFlBQVksQ0FBQ04sR0FBRyxFQUFFYyxPQUFPLENBQUM7RUFDNUIsQ0FBQyxDQUFDLE9BQU9iLEtBQUssRUFBRTtJQUNkSCxXQUFXLENBQUNDLEdBQUcsRUFBRUMsR0FBRyxFQUFFQyxLQUFLLENBQUM7RUFDOUI7QUFDRjs7QUFFTyxlQUFlMkQsZUFBZUEsQ0FBQzdELEdBQVksRUFBRUMsR0FBYSxFQUFFO0VBQ2pFO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFLE1BQU0sRUFBRVcsS0FBSyxFQUFFa0QsR0FBRyxFQUFFYixPQUFPLENBQUMsQ0FBQyxHQUFHakQsR0FBRyxDQUFDYSxJQUFJOztFQUV4QyxJQUFJO0lBQ0YsTUFBTUUsT0FBWSxHQUFHLEVBQUU7SUFDdkIsS0FBSyxNQUFNQyxPQUFPLElBQUlKLEtBQUssRUFBRTtNQUMzQkcsT0FBTyxDQUFDRSxJQUFJO1FBQ1YsTUFBTWpCLEdBQUcsQ0FBQ2tCLE1BQU0sQ0FBQzJDLGVBQWUsQ0FBRSxHQUFFN0MsT0FBUSxFQUFDLEVBQUU4QyxHQUFHLEVBQUViLE9BQU87TUFDN0QsQ0FBQztJQUNIOztJQUVBLElBQUlsQyxPQUFPLENBQUNLLE1BQU0sS0FBSyxDQUFDO0lBQ3RCLE9BQU9uQixHQUFHLENBQUNHLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQ0MsSUFBSSxDQUFDLHVCQUF1QixDQUFDO0lBQ3RERSxZQUFZLENBQUNOLEdBQUcsRUFBRWMsT0FBTyxDQUFDO0VBQzVCLENBQUMsQ0FBQyxPQUFPYixLQUFLLEVBQUU7SUFDZEgsV0FBVyxDQUFDQyxHQUFHLEVBQUVDLEdBQUcsRUFBRUMsS0FBSyxDQUFDO0VBQzlCO0FBQ0Y7O0FBRU8sZUFBZTZELFlBQVlBLENBQUMvRCxHQUFZLEVBQUVDLEdBQWEsRUFBRTtFQUM5RDtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFLE1BQU0sRUFBRVcsS0FBSyxFQUFFb0QsR0FBRyxFQUFFQyxHQUFHLEVBQUVDLEtBQUssRUFBRUMsT0FBTyxDQUFDLENBQUMsR0FBR25FLEdBQUcsQ0FBQ2EsSUFBSTs7RUFFcEQsSUFBSTtJQUNGLE1BQU1FLE9BQVksR0FBRyxFQUFFO0lBQ3ZCLEtBQUssTUFBTUMsT0FBTyxJQUFJSixLQUFLLEVBQUU7TUFDM0JHLE9BQU8sQ0FBQ0UsSUFBSTtRQUNWLE1BQU1qQixHQUFHLENBQUNrQixNQUFNLENBQUM2QyxZQUFZLENBQUMvQyxPQUFPLEVBQUU7VUFDckNnRCxHQUFHLEVBQUVBLEdBQUc7VUFDUkMsR0FBRyxFQUFFQSxHQUFHO1VBQ1JFLE9BQU8sRUFBRUEsT0FBTztVQUNoQnpCLElBQUksRUFBRXdCO1FBQ1IsQ0FBQztNQUNILENBQUM7SUFDSDs7SUFFQSxJQUFJbkQsT0FBTyxDQUFDSyxNQUFNLEtBQUssQ0FBQztJQUN0QixPQUFPbkIsR0FBRyxDQUFDRyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUNDLElBQUksQ0FBQyx1QkFBdUIsQ0FBQztJQUN0REUsWUFBWSxDQUFDTixHQUFHLEVBQUVjLE9BQU8sQ0FBQztFQUM1QixDQUFDLENBQUMsT0FBT2IsS0FBSyxFQUFFO0lBQ2RILFdBQVcsQ0FBQ0MsR0FBRyxFQUFFQyxHQUFHLEVBQUVDLEtBQUssQ0FBQztFQUM5QjtBQUNGOztBQUVPLGVBQWVrRSxXQUFXQSxDQUFDcEUsR0FBWSxFQUFFQyxHQUFhLEVBQUU7RUFDN0Q7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFLE1BQU0sRUFBRVcsS0FBSyxFQUFFTixPQUFPLEVBQUVRLE9BQU8sQ0FBQyxDQUFDLEdBQUdkLEdBQUcsQ0FBQ2EsSUFBSTs7RUFFNUMsSUFBSTtJQUNGLE1BQU1FLE9BQVksR0FBRyxFQUFFOztJQUV2QixLQUFLLE1BQU1lLE9BQU8sSUFBSWxCLEtBQUssRUFBRTtNQUMzQkcsT0FBTyxDQUFDRSxJQUFJLENBQUMsTUFBTWpCLEdBQUcsQ0FBQ2tCLE1BQU0sQ0FBQ0MsUUFBUSxDQUFDVyxPQUFPLEVBQUV4QixPQUFPLEVBQUVRLE9BQU8sQ0FBQyxDQUFDO0lBQ3BFOztJQUVBLElBQUlDLE9BQU8sQ0FBQ0ssTUFBTSxLQUFLLENBQUM7SUFDdEIsT0FBT3JCLFdBQVcsQ0FBQ0MsR0FBRyxFQUFFQyxHQUFHLEVBQUUsb0NBQW9DLENBQUM7O0lBRXBFTSxZQUFZLENBQUNOLEdBQUcsRUFBRVcsS0FBSyxDQUFDO0VBQzFCLENBQUMsQ0FBQyxPQUFPVixLQUFLLEVBQUU7SUFDZEgsV0FBVyxDQUFDQyxHQUFHLEVBQUVDLEdBQUcsRUFBRUMsS0FBSyxDQUFDO0VBQzlCO0FBQ0Y7O0FBRU8sZUFBZW1FLGVBQWVBLENBQUNyRSxHQUFZLEVBQUVDLEdBQWEsRUFBRTtFQUNqRTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ0UsTUFBTTtJQUNKVyxLQUFLO0lBQ0wwRCxXQUFXLEdBQUcsRUFBRTtJQUNoQkMsUUFBUTtJQUNSQyxVQUFVLEdBQUc7RUFDZixDQUFDLEdBQUd4RSxHQUFHLENBQUNhLElBQUk7O0VBRVosSUFBSTtJQUNGLE1BQU1FLE9BQVksR0FBRyxFQUFFOztJQUV2QixLQUFLLE1BQU1lLE9BQU8sSUFBSWxCLEtBQUssRUFBRTtNQUMzQkcsT0FBTyxDQUFDRSxJQUFJO1FBQ1YsTUFBTWpCLEdBQUcsQ0FBQ2tCLE1BQU0sQ0FBQ21ELGVBQWUsQ0FBQ3ZDLE9BQU8sRUFBRTtVQUN4QzBDLFVBQVUsRUFBRUEsVUFBVTtVQUN0QkYsV0FBVyxFQUFFQSxXQUFXO1VBQ3hCQyxRQUFRLEVBQUVBO1FBQ1osQ0FBQztNQUNILENBQUM7SUFDSDs7SUFFQSxJQUFJeEQsT0FBTyxDQUFDSyxNQUFNLEtBQUssQ0FBQztJQUN0QixPQUFPckIsV0FBVyxDQUFDQyxHQUFHLEVBQUVDLEdBQUcsRUFBRSw0QkFBNEIsQ0FBQzs7SUFFNURNLFlBQVksQ0FBQ04sR0FBRyxFQUFFYyxPQUFPLENBQUM7RUFDNUIsQ0FBQyxDQUFDLE9BQU9iLEtBQUssRUFBRTtJQUNkSCxXQUFXLENBQUNDLEdBQUcsRUFBRUMsR0FBRyxFQUFFQyxLQUFLLENBQUM7RUFDOUI7QUFDRjs7QUFFTyxlQUFldUUsZUFBZUEsQ0FBQ3pFLEdBQVksRUFBRUMsR0FBYSxFQUFFO0VBQ2pFO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ0UsTUFBTSxFQUFFVyxLQUFLLEVBQUU4QixJQUFJLEVBQUVnQyxPQUFPLEVBQUU1RCxPQUFPLENBQUMsQ0FBQyxHQUFHZCxHQUFHLENBQUNhLElBQUk7O0VBRWxELElBQUk7SUFDRixNQUFNRSxPQUFZLEdBQUcsRUFBRTs7SUFFdkIsS0FBSyxNQUFNZSxPQUFPLElBQUlsQixLQUFLLEVBQUU7TUFDM0JHLE9BQU8sQ0FBQ0UsSUFBSTtRQUNWLE1BQU1qQixHQUFHLENBQUNrQixNQUFNLENBQUN1RCxlQUFlLENBQUMzQyxPQUFPLEVBQUVZLElBQUksRUFBRWdDLE9BQU8sRUFBRTVELE9BQU87TUFDbEUsQ0FBQztJQUNIOztJQUVBLElBQUlDLE9BQU8sQ0FBQ0ssTUFBTSxLQUFLLENBQUM7SUFDdEIsT0FBT3JCLFdBQVcsQ0FBQ0MsR0FBRyxFQUFFQyxHQUFHLEVBQUUsNEJBQTRCLENBQUM7O0lBRTVETSxZQUFZLENBQUNOLEdBQUcsRUFBRWMsT0FBTyxDQUFDO0VBQzVCLENBQUMsQ0FBQyxPQUFPYixLQUFLLEVBQUU7SUFDZEgsV0FBVyxDQUFDQyxHQUFHLEVBQUVDLEdBQUcsRUFBRUMsS0FBSyxDQUFDO0VBQzlCO0FBQ0Y7O0FBRU8sZUFBZXlFLGNBQWNBLENBQUMzRSxHQUFZLEVBQUVDLEdBQWEsRUFBRTtFQUNoRTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFLE1BQU0sRUFBRUssT0FBTyxDQUFDLENBQUMsR0FBR04sR0FBRyxDQUFDYSxJQUFJOztFQUU1QixJQUFJO0lBQ0YsTUFBTUUsT0FBWSxHQUFHLEVBQUU7SUFDdkJBLE9BQU8sQ0FBQ0UsSUFBSSxDQUFDLE1BQU1qQixHQUFHLENBQUNrQixNQUFNLENBQUNDLFFBQVEsQ0FBQyxrQkFBa0IsRUFBRWIsT0FBTyxDQUFDLENBQUM7O0lBRXBFLElBQUlTLE9BQU8sQ0FBQ0ssTUFBTSxLQUFLLENBQUM7SUFDdEIsT0FBT25CLEdBQUcsQ0FBQ0csTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDQyxJQUFJLENBQUMsdUJBQXVCLENBQUM7SUFDdERFLFlBQVksQ0FBQ04sR0FBRyxFQUFFYyxPQUFPLENBQUM7RUFDNUIsQ0FBQyxDQUFDLE9BQU9iLEtBQUssRUFBRTtJQUNkSCxXQUFXLENBQUNDLEdBQUcsRUFBRUMsR0FBRyxFQUFFQyxLQUFLLENBQUM7RUFDOUI7QUFDRjs7QUFFTyxlQUFlMEUsWUFBWUEsQ0FBQzVFLEdBQVksRUFBRUMsR0FBYSxFQUFFO0VBQzlEO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFLE1BQU0sRUFBRVcsS0FBSyxFQUFFTixPQUFPLEVBQUV1RSxTQUFTLENBQUMsQ0FBQyxHQUFHN0UsR0FBRyxDQUFDYSxJQUFJOztFQUU5QyxJQUFJO0lBQ0YsTUFBTUUsT0FBWSxHQUFHLEVBQUU7SUFDdkIsS0FBSyxNQUFNQyxPQUFPLElBQUlKLEtBQUssRUFBRTtNQUMzQkcsT0FBTyxDQUFDRSxJQUFJLENBQUMsTUFBTWpCLEdBQUcsQ0FBQ2tCLE1BQU0sQ0FBQzRELEtBQUssQ0FBQzlELE9BQU8sRUFBRVYsT0FBTyxFQUFFdUUsU0FBUyxDQUFDLENBQUM7SUFDbkU7O0lBRUEsSUFBSTlELE9BQU8sQ0FBQ0ssTUFBTSxLQUFLLENBQUM7SUFDdEIsT0FBT25CLEdBQUcsQ0FBQ0csTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDQyxJQUFJLENBQUMsdUJBQXVCLENBQUM7SUFDdERMLEdBQUcsQ0FBQ3FCLEVBQUUsQ0FBQ0MsSUFBSSxDQUFDLGtCQUFrQixFQUFFLEVBQUVoQixPQUFPLEVBQUVBLE9BQU8sRUFBRXlFLEVBQUUsRUFBRW5FLEtBQUssQ0FBQyxDQUFDLENBQUM7SUFDaEVMLFlBQVksQ0FBQ04sR0FBRyxFQUFFYyxPQUFPLENBQUM7RUFDNUIsQ0FBQyxDQUFDLE9BQU9iLEtBQUssRUFBRTtJQUNkSCxXQUFXLENBQUNDLEdBQUcsRUFBRUMsR0FBRyxFQUFFQyxLQUFLLENBQUM7RUFDOUI7QUFDRjs7QUFFTyxlQUFlOEUsYUFBYUEsQ0FBQ2hGLEdBQVksRUFBRUMsR0FBYSxFQUFFO0VBQy9EO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ0UsTUFBTSxFQUFFVyxLQUFLLEVBQUVOLE9BQU8sRUFBRTJFLFNBQVMsQ0FBQyxDQUFDLEdBQUdqRixHQUFHLENBQUNhLElBQUk7O0VBRTlDLElBQUk7SUFDRixJQUFJSixRQUFRO0lBQ1osS0FBSyxNQUFNTyxPQUFPLElBQUlKLEtBQUssRUFBRTtNQUMzQkgsUUFBUSxHQUFHLE1BQU1ULEdBQUcsQ0FBQ2tCLE1BQU0sQ0FBQzhELGFBQWE7UUFDdEMsR0FBRWhFLE9BQVEsRUFBQztRQUNaVixPQUFPO1FBQ1AyRTtNQUNGLENBQUM7SUFDSDs7SUFFQSxPQUFPaEYsR0FBRyxDQUFDRyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUNDLElBQUksQ0FBQyxFQUFFRCxNQUFNLEVBQUUsU0FBUyxFQUFFSyxRQUFRLEVBQUVBLFFBQVEsQ0FBQyxDQUFDLENBQUM7RUFDeEUsQ0FBQyxDQUFDLE9BQU9QLEtBQUssRUFBRTtJQUNkRixHQUFHLENBQUNHLE1BQU0sQ0FBQ0QsS0FBSyxDQUFDQSxLQUFLLENBQUM7SUFDdkIsT0FBT0QsR0FBRyxDQUFDRyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUNDLElBQUksQ0FBQztNQUMxQkQsTUFBTSxFQUFFLE9BQU87TUFDZkUsT0FBTyxFQUFFLGlDQUFpQztNQUMxQ0osS0FBSyxFQUFFQTtJQUNULENBQUMsQ0FBQztFQUNKO0FBQ0Y7QUFDTyxlQUFlZ0Ysa0JBQWtCQSxDQUFDbEYsR0FBWSxFQUFFQyxHQUFhLEVBQUU7RUFDcEU7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFLE1BQU0sRUFBRVcsS0FBSyxFQUFFa0MsSUFBSSxDQUFDLENBQUMsR0FBRzlDLEdBQUcsQ0FBQ2EsSUFBSTs7RUFFaEMsSUFBSSxDQUFDaUMsSUFBSSxJQUFJLENBQUM5QyxHQUFHLENBQUNrRCxJQUFJO0VBQ3BCLE9BQU9qRCxHQUFHLENBQUNHLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQytDLElBQUksQ0FBQztJQUMxQjdDLE9BQU8sRUFBRTtFQUNYLENBQUMsQ0FBQzs7RUFFSixNQUFNOEMsUUFBUSxHQUFHTixJQUFJLElBQUk5QyxHQUFHLENBQUNrRCxJQUFJLEVBQUVKLElBQUk7O0VBRXZDLElBQUk7SUFDRixNQUFNL0IsT0FBWSxHQUFHLEVBQUU7SUFDdkIsS0FBSyxNQUFNQyxPQUFPLElBQUlKLEtBQUssRUFBRTtNQUMzQkcsT0FBTyxDQUFDRSxJQUFJLENBQUMsTUFBTWpCLEdBQUcsQ0FBQ2tCLE1BQU0sQ0FBQ2dFLGtCQUFrQixDQUFDbEUsT0FBTyxFQUFFb0MsUUFBUSxDQUFDLENBQUM7SUFDdEU7O0lBRUEsSUFBSXJDLE9BQU8sQ0FBQ0ssTUFBTSxLQUFLLENBQUM7SUFDdEIsT0FBT25CLEdBQUcsQ0FBQ0csTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDQyxJQUFJLENBQUMsdUJBQXVCLENBQUM7SUFDdEQsSUFBSUwsR0FBRyxDQUFDa0QsSUFBSSxFQUFFLE1BQU0sSUFBQUksc0JBQVcsRUFBQ0YsUUFBUSxDQUFDO0lBQ3pDN0MsWUFBWSxDQUFDTixHQUFHLEVBQUVjLE9BQU8sQ0FBQztFQUM1QixDQUFDLENBQUMsT0FBT2IsS0FBSyxFQUFFO0lBQ2RILFdBQVcsQ0FBQ0MsR0FBRyxFQUFFQyxHQUFHLEVBQUVDLEtBQUssQ0FBQztFQUM5QjtBQUNGO0FBQ08sZUFBZWlGLHFCQUFxQkEsQ0FBQ25GLEdBQVksRUFBRUMsR0FBYSxFQUFFO0VBQ3ZFO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDRSxNQUFNLEVBQUVXLEtBQUssRUFBRWtDLElBQUksQ0FBQyxDQUFDLEdBQUc5QyxHQUFHLENBQUNhLElBQUk7O0VBRWhDLElBQUksQ0FBQ2lDLElBQUksSUFBSSxDQUFDOUMsR0FBRyxDQUFDa0QsSUFBSTtFQUNwQixPQUFPakQsR0FBRyxDQUFDRyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMrQyxJQUFJLENBQUM7SUFDMUI3QyxPQUFPLEVBQUU7RUFDWCxDQUFDLENBQUM7O0VBRUosTUFBTThDLFFBQVEsR0FBR04sSUFBSSxJQUFJOUMsR0FBRyxDQUFDa0QsSUFBSSxFQUFFSixJQUFJOztFQUV2QyxJQUFJO0lBQ0YsTUFBTS9CLE9BQVksR0FBRyxFQUFFO0lBQ3ZCLEtBQUssTUFBTUMsT0FBTyxJQUFJSixLQUFLLEVBQUU7TUFDM0JHLE9BQU8sQ0FBQ0UsSUFBSSxDQUFDLE1BQU1qQixHQUFHLENBQUNrQixNQUFNLENBQUNpRSxxQkFBcUIsQ0FBQ25FLE9BQU8sRUFBRW9DLFFBQVEsQ0FBQyxDQUFDO0lBQ3pFOztJQUVBLElBQUlyQyxPQUFPLENBQUNLLE1BQU0sS0FBSyxDQUFDO0lBQ3RCLE9BQU9uQixHQUFHLENBQUNHLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQ0MsSUFBSSxDQUFDLHVCQUF1QixDQUFDO0lBQ3RELElBQUlMLEdBQUcsQ0FBQ2tELElBQUksRUFBRSxNQUFNLElBQUFJLHNCQUFXLEVBQUNGLFFBQVEsQ0FBQztJQUN6QzdDLFlBQVksQ0FBQ04sR0FBRyxFQUFFYyxPQUFPLENBQUM7RUFDNUIsQ0FBQyxDQUFDLE9BQU9iLEtBQUssRUFBRTtJQUNkSCxXQUFXLENBQUNDLEdBQUcsRUFBRUMsR0FBRyxFQUFFQyxLQUFLLENBQUM7RUFDOUI7QUFDRiIsImlnbm9yZUxpc3QiOltdfQ==