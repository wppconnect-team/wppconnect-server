"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.addParticipant = addParticipant;exports.changePrivacyGroup = changePrivacyGroup;exports.createGroup = createGroup;exports.demoteParticipant = demoteParticipant;exports.getAllBroadcastList = getAllBroadcastList;exports.getAllGroups = getAllGroups;exports.getGroupAdmins = getGroupAdmins;exports.getGroupInfoFromInviteLink = getGroupInfoFromInviteLink;exports.getGroupInviteLink = getGroupInviteLink;exports.getGroupMembers = getGroupMembers;exports.getGroupMembersIds = getGroupMembersIds;exports.joinGroupByCode = joinGroupByCode;exports.leaveGroup = leaveGroup;exports.promoteParticipant = promoteParticipant;exports.removeParticipant = removeParticipant;exports.revokeGroupInviteLink = revokeGroupInviteLink;exports.setGroupDescription = setGroupDescription;exports.setGroupProfilePic = setGroupProfilePic;exports.setGroupProperty = setGroupProperty;exports.setGroupSubject = setGroupSubject;exports.setMessagesAdminsOnly = setMessagesAdminsOnly;
















var _functions = require("../util/functions"); /*
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
 */async function getAllGroups(req, res) {/**
     #swagger.tags = ["Group"]
     #swagger.deprecated = true
     #swagger.summary = 'Deprecated in favor of 'list-chats'
     #swagger.autoBody=false
     #swagger.security = [{
            "bearerAuth": []
     }]
     #swagger.parameters["session"] = {
      schema: 'NERDWHATS_AMERICA'
     }
   */try {const response = await req.client.getAllGroups();return res.status(200).json({ status: 'success', response: response });} catch (e) {req.logger.error(e);res.
    status(500).
    json({ status: 'error', message: 'Error fetching groups', error: e });
  }
}

async function joinGroupByCode(req, res) {
  /**
     #swagger.tags = ["Group"]
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
        "application/json": {
          schema: {
            type: "object",
            properties: {
              inviteCode: {
                type: "string"
              }
            },
            required: ["inviteCode"]
          },
          examples: {
            "Default": {
              value: {
                inviteCode: "5644444"
              }
            }
          }
        }
      }
    }
   */
  const { inviteCode } = req.body;

  if (!inviteCode)
  return res.status(400).send({ message: 'Invitation Code is required' });

  try {
    await req.client.joinGroup(inviteCode);
    res.status(201).json({
      status: 'success',
      response: {
        message: 'The informed contact(s) entered the group successfully',
        contact: inviteCode
      }
    });
  } catch (error) {
    req.logger.error(error);
    res.status(500).json({
      status: 'error',
      message: 'The informed contact(s) did not join the group successfully',
      error: error
    });
  }
}

async function createGroup(req, res) {
  /**
     #swagger.tags = ["Group"]
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
        "application/json": {
          schema: {
            type: "object",
            properties: {
              participants: {
                type: "array",
                items: {
                  type: "string"
                }
              },
              name: {
                type: "string"
              }
            },
            required: ["participants", "name"]
          },
          examples: {
            "Default": {
              value: {
                participants: ["5521999999999"],
                name: "Group name"
              }
            }
          }
        }
      }
    }
   */
  const { participants, name } = req.body;

  try {
    let response = {};
    const infoGroup = [];

    for (const group of (0, _functions.groupNameToArray)(name)) {
      response = await req.client.createGroup(
        group,
        (0, _functions.contactToArray)(participants)
      );
      infoGroup.push({
        name: group,
        id: response.gid.user,
        participants: response.participants
      });
    }

    return res.status(201).json({
      status: 'success',
      response: {
        message: 'Group(s) created successfully',
        group: name,
        groupInfo: infoGroup
      }
    });
  } catch (e) {
    req.logger.error(e);
    return res.
    status(500).
    json({ status: 'error', message: 'Error creating group(s)', error: e });
  }
}

async function leaveGroup(req, res) {
  /**
     #swagger.tags = ["Group"]
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
              groupId: { type: "string" }
            },
            required: ["groupId"]
          }
        }
      }
    }
   */
  const { groupId } = req.body;

  try {
    for (const group of (0, _functions.groupToArray)(groupId)) {
      await req.client.leaveGroup(group);
    }

    return res.status(200).json({
      status: 'success',
      response: { messages: 'Você saiu do grupo com sucesso', group: groupId }
    });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({
      status: 'error',
      message: 'Erro ao sair do(s) grupo(s)',
      error: e
    });
  }
}

async function getGroupMembers(req, res) {
  /**
     #swagger.tags = ["Group"]
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
        "application/json": {
          schema: {
            type: "object",
            properties: {
              groupId: { type: "string" }
            },
            required: ["groupId"]
          },
          examples: {
            "Default": {
              value: {
                groupId: "<groupId>"
              }
            }
          }
        }
      }
    }
   */
  const { groupId } = req.params;

  try {
    let response = {};
    for (const group of (0, _functions.groupToArray)(groupId)) {
      response = await req.client.getGroupMembers(group);
    }
    return res.status(200).json({ status: 'success', response: response });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({
      status: 'error',
      message: 'Error on get group members',
      error: e
    });
  }
}

async function addParticipant(req, res) {
  /**
     #swagger.tags = ["Group"]
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
        "application/json": {
          schema: {
            type: "object",
            properties: {
              groupId: { type: "string" },
              phone: { type: "string" }
            },
            required: ["groupId", "phone"]
          },
          examples: {
            "Default": {
              value: {
                groupId: "<groupId>",
                phone: "5521999999999"
              }
            }
          }
        }
      }
    }
   */
  const { groupId, phone } = req.body;

  try {
    let response = {};
    const arrayGroups = [];

    for (const group of (0, _functions.groupToArray)(groupId)) {
      response = await req.client.addParticipant(group, (0, _functions.contactToArray)(phone));
      arrayGroups.push(response);
    }

    return res.status(201).json({
      status: 'success',
      response: {
        message: 'Addition to group attempted.',
        participants: phone,
        groups: (0, _functions.groupToArray)(groupId),
        result: arrayGroups
      }
    });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({
      status: 'error',
      message: 'Error adding participant(s)',
      error: e
    });
  }
}

async function removeParticipant(req, res) {
  /**
     #swagger.tags = ["Group"]
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
              "groupId": { type: "string" },
              "phone": { type: "string" }
            },
            required: ["groupId", "phone"]
          },
          examples: {
            "Default": {
              value: {
                "groupId": "<groupId>",
                "phone": "5521999999999"
              }
            }
          }
        }
      }
    }
   */
  const { groupId, phone } = req.body;

  try {
    let response = {};
    const arrayGroups = [];

    for (const group of (0, _functions.groupToArray)(groupId)) {
      response = await req.client.removeParticipant(
        group,
        (0, _functions.contactToArray)(phone)
      );
      arrayGroups.push(response);
    }

    return res.status(200).json({
      status: 'success',
      response: {
        message: 'Participant(s) removed successfully',
        participants: phone,
        groups: arrayGroups
      }
    });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({
      status: 'error',
      message: 'Error removing participant(s)',
      error: e
    });
  }
}

async function promoteParticipant(req, res) {
  /**
     #swagger.tags = ["Group"]
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
              "groupId": { type: "string" },
              "phone": { type: "string" }
            },
            required: ["groupId", "phone"]
          },
          examples: {
            "Default": {
              value: {
                "groupId": "<groupId>",
                "phone": "5521999999999"
              }
            }
          }
        }
      }
    }
   */
  const { groupId, phone } = req.body;

  try {
    const arrayGroups = [];
    for (const group of (0, _functions.groupToArray)(groupId)) {
      await req.client.promoteParticipant(group, (0, _functions.contactToArray)(phone));
      arrayGroups.push(group);
    }

    return res.status(201).json({
      status: 'success',
      response: {
        message: 'Successful promoted participant(s)',
        participants: phone,
        groups: arrayGroups
      }
    });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({
      status: 'error',
      message: 'Error promoting participant(s)',
      error: e
    });
  }
}

async function demoteParticipant(req, res) {
  /**
     #swagger.tags = ["Group"]
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
              "groupId": { type: "string" },
              "phone": { type: "string" }
            },
            required: ["groupId", "phone"]
          },
          examples: {
            "Default": {
              value: {
                "groupId": "<groupId>",
                "phone": "5521999999999"
              }
            }
          }
        }
      }
    }
   */
  const { groupId, phone } = req.body;

  try {
    const arrayGroups = [];
    for (const group of (0, _functions.groupToArray)(groupId)) {
      await req.client.demoteParticipant(group, (0, _functions.contactToArray)(phone));
      arrayGroups.push(group);
    }

    return res.status(201).json({
      status: 'success',
      response: {
        message: 'Admin of participant(s) revoked successfully',
        participants: phone,
        groups: arrayGroups
      }
    });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({
      status: 'error',
      message: "Error revoking participant's admin(s)",
      error: e
    });
  }
}

async function getGroupAdmins(req, res) {
  /**
     #swagger.tags = ["Group"]
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
              "groupId": { type: "string" }
            },
            required: ["groupId"]
          },
          examples: {
            "Default": {
              value: {
                "groupId": "<groupId>"
              }
            }
          }
        }
      }
    }
   */
  const { groupId } = req.params;

  try {
    let response = {};
    const arrayGroups = [];

    for (const group of (0, _functions.groupToArray)(groupId)) {
      response = await req.client.getGroupAdmins(group);
      arrayGroups.push(response);
    }

    return res.status(200).json({ status: 'success', response: arrayGroups });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({
      status: 'error',
      message: 'Error retrieving group admin(s)',
      error: e
    });
  }
}

async function getGroupInviteLink(req, res) {
  /**
     #swagger.tags = ["Group"]
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
              groupId: { type: "string" }
            }
          }
        }
      }
    }
   */
  const { groupId } = req.params;
  try {
    let response = {};
    for (const group of (0, _functions.groupToArray)(groupId)) {
      response = await req.client.getGroupInviteLink(group);
    }

    return res.status(200).json({ status: 'success', response: response });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({
      status: 'error',
      message: 'Error on get group invite link',
      error: e
    });
  }
}

async function revokeGroupInviteLink(req, res) {
  /**
     #swagger.tags = ["Group"]
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
              $groupId: { type: "string" }
            }
          }
        }
      }
    }
   */
  const { groupId } = req.params;

  let response = {};

  try {
    for (const group of (0, _functions.groupToArray)(groupId)) {
      response = await req.client.revokeGroupInviteLink(group);
    }

    return res.status(200).json({
      status: 'Success',
      response: response
    });
  } catch (e) {
    req.logger.error(e);
    return res.status(400).json({
      status: 'error',
      message: 'Error on revoke group invite link',
      error: e
    });
  }
}

async function getAllBroadcastList(req, res) {
  /**
     #swagger.tags = ["Misc"]
     #swagger.autoBody=false
     #swagger.security = [{
            "bearerAuth": []
     }]
     #swagger.parameters["session"] = {
      schema: 'NERDWHATS_AMERICA'
     }
   */
  try {
    const response = await req.client.getAllBroadcastList();
    return res.status(200).json({ status: 'success', response: response });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({
      status: 'error',
      message: 'Error on get all broad cast list',
      error: e
    });
  }
}

async function getGroupInfoFromInviteLink(req, res) {
  /**
     #swagger.tags = ["Group"]
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
              $invitecode: { type: "string" }
            }
          }
        }
      }
    }
   */
  try {
    const { invitecode } = req.body;
    const response = await req.client.getGroupInfoFromInviteLink(invitecode);
    return res.status(200).json({ status: 'success', response: response });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({
      status: 'error',
      message: 'Error on get group info from invite link',
      error: e
    });
  }
}

async function getGroupMembersIds(req, res) {
  /**
     #swagger.tags = ["Group"]
     #swagger.autoBody=false
     #swagger.security = [{
            "bearerAuth": []
     }]
     #swagger.parameters["session"] = {
      schema: 'NERDWHATS_AMERICA'
     }
     #swagger.parameters["groupId"] = {
      schema: '<groupId>'
     }
   */
  const { groupId } = req.params;
  let response = {};
  try {
    for (const group of (0, _functions.groupToArray)(groupId)) {
      response = await req.client.getGroupMembersIds(group);
    }
    return res.status(200).json({ status: 'success', response: response });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({
      status: 'error',
      message: 'Error on get group members ids',
      error: e
    });
  }
}

async function setGroupDescription(req, res) {
  /**
     #swagger.tags = ["Group"]
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
              $groupId: { type: "string" },
              $description: { type: "string" }
            }
          }
        }
      }
    }
   */
  const { groupId, description } = req.body;

  let response = {};

  try {
    for (const group of (0, _functions.groupToArray)(groupId)) {
      response = await req.client.setGroupDescription(group, description);
    }

    return res.status(200).json({ status: 'success', response: response });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({
      status: 'error',
      message: 'Error on set group description',
      error: e
    });
  }
}

async function setGroupProperty(req, res) {
  /**
     #swagger.tags = ["Group"]
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
              $groupId: { type: "string" },
              $property: { type: "string" },
              $value: { type: "boolean" }
            }
          }
        }
      }
    }
   */
  const { groupId, property, value = true } = req.body;

  let response = {};

  try {
    for (const group of (0, _functions.groupToArray)(groupId)) {
      response = await req.client.setGroupProperty(group, property, value);
    }

    return res.status(200).json({ status: 'success', response: response });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({
      status: 'error',
      message: 'Error on set group property',
      error: e
    });
  }
}

async function setGroupSubject(req, res) {
  /**
     #swagger.tags = ["Group"]
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
              $groupId: { type: "string" },
              $title: { type: "string" }
            }
          }
        }
      }
    }
   */
  const { groupId, title } = req.body;

  let response = {};

  try {
    for (const group of (0, _functions.groupToArray)(groupId)) {
      response = await req.client.setGroupSubject(group, title);
    }

    return res.status(200).json({ status: 'success', response: response });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({
      status: 'error',
      message: 'Error on set group subject',
      error: e
    });
  }
}

async function setMessagesAdminsOnly(req, res) {
  /**
     #swagger.tags = ["Group"]
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
              $groupId: { type: "string" },
              $value: { type: "boolean" }
            }
          }
        }
      }
    }
   */
  const { groupId, value = true } = req.body;

  let response = {};

  try {
    for (const group of (0, _functions.groupToArray)(groupId)) {
      response = await req.client.setMessagesAdminsOnly(group, value);
    }

    return res.status(200).json({ status: 'success', response: response });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({
      status: 'error',
      message: 'Error on set messages admins only',
      error: e
    });
  }
}

async function changePrivacyGroup(req, res) {
  /**
     #swagger.tags = ["Group"]
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
              $groupId: { type: "string" },
              $status: { type: "boolean" }
            }
          }
        }
      }
    }
   */
  const { groupId, status } = req.body;

  try {
    for (const group of (0, _functions.contactToArray)(groupId)) {
      await req.client.setGroupProperty(
        group,
        'restrict',
        status === 'true'
      );
    }

    return res.status(200).json({
      status: 'success',
      response: { message: 'Group privacy changed successfully' }
    });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({
      status: 'error',
      message: 'Error changing group privacy',
      error: e
    });
  }
}

async function setGroupProfilePic(req, res) {
  /**
     #swagger.tags = ["Group"]
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
              $groupId: { type: "string" },
              $path: { type: "string" }
            }
          }
        }
      }
    }
   */
  const { groupId, path } = req.body;

  if (!path && !req.file)
  return res.status(401).send({
    message: 'Sending the image is mandatory'
  });

  const pathFile = path || req.file?.path;

  try {
    for (const contact of (0, _functions.contactToArray)(groupId, true)) {
      await req.client.setGroupIcon(contact, pathFile);
    }

    return res.status(201).json({
      status: 'success',
      response: { message: 'Group profile photo successfully changed' }
    });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({
      status: 'error',
      message: 'Error changing group photo',
      error: e
    });
  }
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfZnVuY3Rpb25zIiwicmVxdWlyZSIsImdldEFsbEdyb3VwcyIsInJlcSIsInJlcyIsInJlc3BvbnNlIiwiY2xpZW50Iiwic3RhdHVzIiwianNvbiIsImUiLCJsb2dnZXIiLCJlcnJvciIsIm1lc3NhZ2UiLCJqb2luR3JvdXBCeUNvZGUiLCJpbnZpdGVDb2RlIiwiYm9keSIsInNlbmQiLCJqb2luR3JvdXAiLCJjb250YWN0IiwiY3JlYXRlR3JvdXAiLCJwYXJ0aWNpcGFudHMiLCJuYW1lIiwiaW5mb0dyb3VwIiwiZ3JvdXAiLCJncm91cE5hbWVUb0FycmF5IiwiY29udGFjdFRvQXJyYXkiLCJwdXNoIiwiaWQiLCJnaWQiLCJ1c2VyIiwiZ3JvdXBJbmZvIiwibGVhdmVHcm91cCIsImdyb3VwSWQiLCJncm91cFRvQXJyYXkiLCJtZXNzYWdlcyIsImdldEdyb3VwTWVtYmVycyIsInBhcmFtcyIsImFkZFBhcnRpY2lwYW50IiwicGhvbmUiLCJhcnJheUdyb3VwcyIsImdyb3VwcyIsInJlc3VsdCIsInJlbW92ZVBhcnRpY2lwYW50IiwicHJvbW90ZVBhcnRpY2lwYW50IiwiZGVtb3RlUGFydGljaXBhbnQiLCJnZXRHcm91cEFkbWlucyIsImdldEdyb3VwSW52aXRlTGluayIsInJldm9rZUdyb3VwSW52aXRlTGluayIsImdldEFsbEJyb2FkY2FzdExpc3QiLCJnZXRHcm91cEluZm9Gcm9tSW52aXRlTGluayIsImludml0ZWNvZGUiLCJnZXRHcm91cE1lbWJlcnNJZHMiLCJzZXRHcm91cERlc2NyaXB0aW9uIiwiZGVzY3JpcHRpb24iLCJzZXRHcm91cFByb3BlcnR5IiwicHJvcGVydHkiLCJ2YWx1ZSIsInNldEdyb3VwU3ViamVjdCIsInRpdGxlIiwic2V0TWVzc2FnZXNBZG1pbnNPbmx5IiwiY2hhbmdlUHJpdmFjeUdyb3VwIiwic2V0R3JvdXBQcm9maWxlUGljIiwicGF0aCIsImZpbGUiLCJwYXRoRmlsZSIsInNldEdyb3VwSWNvbiJdLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jb250cm9sbGVyL2dyb3VwQ29udHJvbGxlci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKlxyXG4gKiBDb3B5cmlnaHQgMjAyMyBXUFBDb25uZWN0IFRlYW1cclxuICpcclxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcclxuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxyXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcclxuICpcclxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxyXG4gKlxyXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXHJcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcclxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXHJcbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcclxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXHJcbiAqL1xyXG5pbXBvcnQgeyBSZXF1ZXN0LCBSZXNwb25zZSB9IGZyb20gJ2V4cHJlc3MnO1xyXG5cclxuaW1wb3J0IHtcclxuICBjb250YWN0VG9BcnJheSxcclxuICBncm91cE5hbWVUb0FycmF5LFxyXG4gIGdyb3VwVG9BcnJheSxcclxufSBmcm9tICcuLi91dGlsL2Z1bmN0aW9ucyc7XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0QWxsR3JvdXBzKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSkge1xyXG4gIC8qKlxyXG4gICAgICNzd2FnZ2VyLnRhZ3MgPSBbXCJHcm91cFwiXVxyXG4gICAgICNzd2FnZ2VyLmRlcHJlY2F0ZWQgPSB0cnVlXHJcbiAgICAgI3N3YWdnZXIuc3VtbWFyeSA9ICdEZXByZWNhdGVkIGluIGZhdm9yIG9mICdsaXN0LWNoYXRzJ1xyXG4gICAgICNzd2FnZ2VyLmF1dG9Cb2R5PWZhbHNlXHJcbiAgICAgI3N3YWdnZXIuc2VjdXJpdHkgPSBbe1xyXG4gICAgICAgICAgICBcImJlYXJlckF1dGhcIjogW11cclxuICAgICB9XVxyXG4gICAgICNzd2FnZ2VyLnBhcmFtZXRlcnNbXCJzZXNzaW9uXCJdID0ge1xyXG4gICAgICBzY2hlbWE6ICdORVJEV0hBVFNfQU1FUklDQSdcclxuICAgICB9XHJcbiAgICovXHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgcmVxLmNsaWVudC5nZXRBbGxHcm91cHMoKTtcclxuXHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oeyBzdGF0dXM6ICdzdWNjZXNzJywgcmVzcG9uc2U6IHJlc3BvbnNlIH0pO1xyXG4gIH0gY2F0Y2ggKGUpIHtcclxuICAgIHJlcS5sb2dnZXIuZXJyb3IoZSk7XHJcbiAgICByZXNcclxuICAgICAgLnN0YXR1cyg1MDApXHJcbiAgICAgIC5qc29uKHsgc3RhdHVzOiAnZXJyb3InLCBtZXNzYWdlOiAnRXJyb3IgZmV0Y2hpbmcgZ3JvdXBzJywgZXJyb3I6IGUgfSk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gam9pbkdyb3VwQnlDb2RlKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSkge1xyXG4gIC8qKlxyXG4gICAgICNzd2FnZ2VyLnRhZ3MgPSBbXCJHcm91cFwiXVxyXG4gICAgICNzd2FnZ2VyLmF1dG9Cb2R5PWZhbHNlXHJcbiAgICAgI3N3YWdnZXIuc2VjdXJpdHkgPSBbe1xyXG4gICAgICAgICAgICBcImJlYXJlckF1dGhcIjogW11cclxuICAgICB9XVxyXG4gICAgICNzd2FnZ2VyLnBhcmFtZXRlcnNbXCJzZXNzaW9uXCJdID0ge1xyXG4gICAgICBzY2hlbWE6ICdORVJEV0hBVFNfQU1FUklDQSdcclxuICAgICB9XHJcbiAgICAgI3N3YWdnZXIucmVxdWVzdEJvZHkgPSB7XHJcbiAgICAgIHJlcXVpcmVkOiB0cnVlLFxyXG4gICAgICBjb250ZW50OiB7XHJcbiAgICAgICAgXCJhcHBsaWNhdGlvbi9qc29uXCI6IHtcclxuICAgICAgICAgIHNjaGVtYToge1xyXG4gICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgaW52aXRlQ29kZToge1xyXG4gICAgICAgICAgICAgICAgdHlwZTogXCJzdHJpbmdcIlxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgcmVxdWlyZWQ6IFtcImludml0ZUNvZGVcIl1cclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICBleGFtcGxlczoge1xyXG4gICAgICAgICAgICBcIkRlZmF1bHRcIjoge1xyXG4gICAgICAgICAgICAgIHZhbHVlOiB7XHJcbiAgICAgICAgICAgICAgICBpbnZpdGVDb2RlOiBcIjU2NDQ0NDRcIlxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAqL1xyXG4gIGNvbnN0IHsgaW52aXRlQ29kZSB9ID0gcmVxLmJvZHk7XHJcblxyXG4gIGlmICghaW52aXRlQ29kZSlcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuc2VuZCh7IG1lc3NhZ2U6ICdJbnZpdGF0aW9uIENvZGUgaXMgcmVxdWlyZWQnIH0pO1xyXG5cclxuICB0cnkge1xyXG4gICAgYXdhaXQgcmVxLmNsaWVudC5qb2luR3JvdXAoaW52aXRlQ29kZSk7XHJcbiAgICByZXMuc3RhdHVzKDIwMSkuanNvbih7XHJcbiAgICAgIHN0YXR1czogJ3N1Y2Nlc3MnLFxyXG4gICAgICByZXNwb25zZToge1xyXG4gICAgICAgIG1lc3NhZ2U6ICdUaGUgaW5mb3JtZWQgY29udGFjdChzKSBlbnRlcmVkIHRoZSBncm91cCBzdWNjZXNzZnVsbHknLFxyXG4gICAgICAgIGNvbnRhY3Q6IGludml0ZUNvZGUsXHJcbiAgICAgIH0sXHJcbiAgICB9KTtcclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgcmVxLmxvZ2dlci5lcnJvcihlcnJvcik7XHJcbiAgICByZXMuc3RhdHVzKDUwMCkuanNvbih7XHJcbiAgICAgIHN0YXR1czogJ2Vycm9yJyxcclxuICAgICAgbWVzc2FnZTogJ1RoZSBpbmZvcm1lZCBjb250YWN0KHMpIGRpZCBub3Qgam9pbiB0aGUgZ3JvdXAgc3VjY2Vzc2Z1bGx5JyxcclxuICAgICAgZXJyb3I6IGVycm9yLFxyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY3JlYXRlR3JvdXAocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKSB7XHJcbiAgLyoqXHJcbiAgICAgI3N3YWdnZXIudGFncyA9IFtcIkdyb3VwXCJdXHJcbiAgICAgI3N3YWdnZXIuYXV0b0JvZHk9ZmFsc2VcclxuICAgICAjc3dhZ2dlci5zZWN1cml0eSA9IFt7XHJcbiAgICAgICAgICAgIFwiYmVhcmVyQXV0aFwiOiBbXVxyXG4gICAgIH1dXHJcbiAgICAgI3N3YWdnZXIucGFyYW1ldGVyc1tcInNlc3Npb25cIl0gPSB7XHJcbiAgICAgIHNjaGVtYTogJ05FUkRXSEFUU19BTUVSSUNBJ1xyXG4gICAgIH1cclxuICAgICAjc3dhZ2dlci5yZXF1ZXN0Qm9keSA9IHtcclxuICAgICAgcmVxdWlyZWQ6IHRydWUsXHJcbiAgICAgIGNvbnRlbnQ6IHtcclxuICAgICAgICBcImFwcGxpY2F0aW9uL2pzb25cIjoge1xyXG4gICAgICAgICAgc2NoZW1hOiB7XHJcbiAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICBwYXJ0aWNpcGFudHM6IHtcclxuICAgICAgICAgICAgICAgIHR5cGU6IFwiYXJyYXlcIixcclxuICAgICAgICAgICAgICAgIGl0ZW1zOiB7XHJcbiAgICAgICAgICAgICAgICAgIHR5cGU6IFwic3RyaW5nXCJcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgIG5hbWU6IHtcclxuICAgICAgICAgICAgICAgIHR5cGU6IFwic3RyaW5nXCJcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJwYXJ0aWNpcGFudHNcIiwgXCJuYW1lXCJdXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgZXhhbXBsZXM6IHtcclxuICAgICAgICAgICAgXCJEZWZhdWx0XCI6IHtcclxuICAgICAgICAgICAgICB2YWx1ZToge1xyXG4gICAgICAgICAgICAgICAgcGFydGljaXBhbnRzOiBbXCI1NTIxOTk5OTk5OTk5XCJdLFxyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJHcm91cCBuYW1lXCJcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgKi9cclxuICBjb25zdCB7IHBhcnRpY2lwYW50cywgbmFtZSB9ID0gcmVxLmJvZHk7XHJcblxyXG4gIHRyeSB7XHJcbiAgICBsZXQgcmVzcG9uc2UgPSB7fTtcclxuICAgIGNvbnN0IGluZm9Hcm91cDogYW55ID0gW107XHJcblxyXG4gICAgZm9yIChjb25zdCBncm91cCBvZiBncm91cE5hbWVUb0FycmF5KG5hbWUpKSB7XHJcbiAgICAgIHJlc3BvbnNlID0gYXdhaXQgcmVxLmNsaWVudC5jcmVhdGVHcm91cChcclxuICAgICAgICBncm91cCxcclxuICAgICAgICBjb250YWN0VG9BcnJheShwYXJ0aWNpcGFudHMpXHJcbiAgICAgICk7XHJcbiAgICAgIGluZm9Hcm91cC5wdXNoKHtcclxuICAgICAgICBuYW1lOiBncm91cCxcclxuICAgICAgICBpZDogKHJlc3BvbnNlIGFzIGFueSkuZ2lkLnVzZXIsXHJcbiAgICAgICAgcGFydGljaXBhbnRzOiAocmVzcG9uc2UgYXMgYW55KS5wYXJ0aWNpcGFudHMsXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiByZXMuc3RhdHVzKDIwMSkuanNvbih7XHJcbiAgICAgIHN0YXR1czogJ3N1Y2Nlc3MnLFxyXG4gICAgICByZXNwb25zZToge1xyXG4gICAgICAgIG1lc3NhZ2U6ICdHcm91cChzKSBjcmVhdGVkIHN1Y2Nlc3NmdWxseScsXHJcbiAgICAgICAgZ3JvdXA6IG5hbWUsXHJcbiAgICAgICAgZ3JvdXBJbmZvOiBpbmZvR3JvdXAsXHJcbiAgICAgIH0sXHJcbiAgICB9KTtcclxuICB9IGNhdGNoIChlKSB7XHJcbiAgICByZXEubG9nZ2VyLmVycm9yKGUpO1xyXG4gICAgcmV0dXJuIHJlc1xyXG4gICAgICAuc3RhdHVzKDUwMClcclxuICAgICAgLmpzb24oeyBzdGF0dXM6ICdlcnJvcicsIG1lc3NhZ2U6ICdFcnJvciBjcmVhdGluZyBncm91cChzKScsIGVycm9yOiBlIH0pO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGxlYXZlR3JvdXAocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKSB7XHJcbiAgLyoqXHJcbiAgICAgI3N3YWdnZXIudGFncyA9IFtcIkdyb3VwXCJdXHJcbiAgICAgI3N3YWdnZXIuYXV0b0JvZHk9ZmFsc2VcclxuICAgICAjc3dhZ2dlci5zZWN1cml0eSA9IFt7XHJcbiAgICAgICAgICAgIFwiYmVhcmVyQXV0aFwiOiBbXVxyXG4gICAgIH1dXHJcbiAgICAgI3N3YWdnZXIucGFyYW1ldGVyc1tcInNlc3Npb25cIl0gPSB7XHJcbiAgICAgIHNjaGVtYTogJ05FUkRXSEFUU19BTUVSSUNBJ1xyXG4gICAgIH1cclxuICAgICAjc3dhZ2dlci5yZXF1ZXN0Qm9keSA9IHtcclxuICAgICAgcmVxdWlyZWQ6IHRydWUsXHJcbiAgICAgIFwiQGNvbnRlbnRcIjoge1xyXG4gICAgICAgIFwiYXBwbGljYXRpb24vanNvblwiOiB7XHJcbiAgICAgICAgICBzY2hlbWE6IHtcclxuICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgIGdyb3VwSWQ6IHsgdHlwZTogXCJzdHJpbmdcIiB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJncm91cElkXCJdXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICovXHJcbiAgY29uc3QgeyBncm91cElkIH0gPSByZXEuYm9keTtcclxuXHJcbiAgdHJ5IHtcclxuICAgIGZvciAoY29uc3QgZ3JvdXAgb2YgZ3JvdXBUb0FycmF5KGdyb3VwSWQpKSB7XHJcbiAgICAgIGF3YWl0IHJlcS5jbGllbnQubGVhdmVHcm91cChncm91cCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcclxuICAgICAgc3RhdHVzOiAnc3VjY2VzcycsXHJcbiAgICAgIHJlc3BvbnNlOiB7IG1lc3NhZ2VzOiAnVm9jw6ogc2FpdSBkbyBncnVwbyBjb20gc3VjZXNzbycsIGdyb3VwOiBncm91cElkIH0sXHJcbiAgICB9KTtcclxuICB9IGNhdGNoIChlKSB7XHJcbiAgICByZXEubG9nZ2VyLmVycm9yKGUpO1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgc3RhdHVzOiAnZXJyb3InLFxyXG4gICAgICBtZXNzYWdlOiAnRXJybyBhbyBzYWlyIGRvKHMpIGdydXBvKHMpJyxcclxuICAgICAgZXJyb3I6IGUsXHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRHcm91cE1lbWJlcnMocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKSB7XHJcbiAgLyoqXHJcbiAgICAgI3N3YWdnZXIudGFncyA9IFtcIkdyb3VwXCJdXHJcbiAgICAgI3N3YWdnZXIuYXV0b0JvZHk9ZmFsc2VcclxuICAgICAjc3dhZ2dlci5zZWN1cml0eSA9IFt7XHJcbiAgICAgICAgICAgIFwiYmVhcmVyQXV0aFwiOiBbXVxyXG4gICAgIH1dXHJcbiAgICAgI3N3YWdnZXIucGFyYW1ldGVyc1tcInNlc3Npb25cIl0gPSB7XHJcbiAgICAgIHNjaGVtYTogJ05FUkRXSEFUU19BTUVSSUNBJ1xyXG4gICAgIH1cclxuICAgICAjc3dhZ2dlci5yZXF1ZXN0Qm9keSA9IHtcclxuICAgICAgcmVxdWlyZWQ6IHRydWUsXHJcbiAgICAgIGNvbnRlbnQ6IHtcclxuICAgICAgICBcImFwcGxpY2F0aW9uL2pzb25cIjoge1xyXG4gICAgICAgICAgc2NoZW1hOiB7XHJcbiAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICBncm91cElkOiB7IHR5cGU6IFwic3RyaW5nXCIgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICByZXF1aXJlZDogW1wiZ3JvdXBJZFwiXVxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIGV4YW1wbGVzOiB7XHJcbiAgICAgICAgICAgIFwiRGVmYXVsdFwiOiB7XHJcbiAgICAgICAgICAgICAgdmFsdWU6IHtcclxuICAgICAgICAgICAgICAgIGdyb3VwSWQ6IFwiPGdyb3VwSWQ+XCJcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgKi9cclxuICBjb25zdCB7IGdyb3VwSWQgfSA9IHJlcS5wYXJhbXM7XHJcblxyXG4gIHRyeSB7XHJcbiAgICBsZXQgcmVzcG9uc2UgPSB7fTtcclxuICAgIGZvciAoY29uc3QgZ3JvdXAgb2YgZ3JvdXBUb0FycmF5KGdyb3VwSWQpKSB7XHJcbiAgICAgIHJlc3BvbnNlID0gYXdhaXQgcmVxLmNsaWVudC5nZXRHcm91cE1lbWJlcnMoZ3JvdXApO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHsgc3RhdHVzOiAnc3VjY2VzcycsIHJlc3BvbnNlOiByZXNwb25zZSB9KTtcclxuICB9IGNhdGNoIChlKSB7XHJcbiAgICByZXEubG9nZ2VyLmVycm9yKGUpO1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgc3RhdHVzOiAnZXJyb3InLFxyXG4gICAgICBtZXNzYWdlOiAnRXJyb3Igb24gZ2V0IGdyb3VwIG1lbWJlcnMnLFxyXG4gICAgICBlcnJvcjogZSxcclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGFkZFBhcnRpY2lwYW50KHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSkge1xyXG4gIC8qKlxyXG4gICAgICNzd2FnZ2VyLnRhZ3MgPSBbXCJHcm91cFwiXVxyXG4gICAgICNzd2FnZ2VyLmF1dG9Cb2R5PWZhbHNlXHJcbiAgICAgI3N3YWdnZXIuc2VjdXJpdHkgPSBbe1xyXG4gICAgICAgICAgICBcImJlYXJlckF1dGhcIjogW11cclxuICAgICB9XVxyXG4gICAgICNzd2FnZ2VyLnBhcmFtZXRlcnNbXCJzZXNzaW9uXCJdID0ge1xyXG4gICAgICBzY2hlbWE6ICdORVJEV0hBVFNfQU1FUklDQSdcclxuICAgICB9XHJcbiAgICAgI3N3YWdnZXIucmVxdWVzdEJvZHkgPSB7XHJcbiAgICAgIHJlcXVpcmVkOiB0cnVlLFxyXG4gICAgICBjb250ZW50OiB7XHJcbiAgICAgICAgXCJhcHBsaWNhdGlvbi9qc29uXCI6IHtcclxuICAgICAgICAgIHNjaGVtYToge1xyXG4gICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgZ3JvdXBJZDogeyB0eXBlOiBcInN0cmluZ1wiIH0sXHJcbiAgICAgICAgICAgICAgcGhvbmU6IHsgdHlwZTogXCJzdHJpbmdcIiB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJncm91cElkXCIsIFwicGhvbmVcIl1cclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICBleGFtcGxlczoge1xyXG4gICAgICAgICAgICBcIkRlZmF1bHRcIjoge1xyXG4gICAgICAgICAgICAgIHZhbHVlOiB7XHJcbiAgICAgICAgICAgICAgICBncm91cElkOiBcIjxncm91cElkPlwiLFxyXG4gICAgICAgICAgICAgICAgcGhvbmU6IFwiNTUyMTk5OTk5OTk5OVwiXHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICovXHJcbiAgY29uc3QgeyBncm91cElkLCBwaG9uZSB9ID0gcmVxLmJvZHk7XHJcblxyXG4gIHRyeSB7XHJcbiAgICBsZXQgcmVzcG9uc2UgPSB7fTtcclxuICAgIGNvbnN0IGFycmF5R3JvdXBzOiBhbnkgPSBbXTtcclxuXHJcbiAgICBmb3IgKGNvbnN0IGdyb3VwIG9mIGdyb3VwVG9BcnJheShncm91cElkKSkge1xyXG4gICAgICByZXNwb25zZSA9IGF3YWl0IHJlcS5jbGllbnQuYWRkUGFydGljaXBhbnQoZ3JvdXAsIGNvbnRhY3RUb0FycmF5KHBob25lKSk7XHJcbiAgICAgIGFycmF5R3JvdXBzLnB1c2gocmVzcG9uc2UpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiByZXMuc3RhdHVzKDIwMSkuanNvbih7XHJcbiAgICAgIHN0YXR1czogJ3N1Y2Nlc3MnLFxyXG4gICAgICByZXNwb25zZToge1xyXG4gICAgICAgIG1lc3NhZ2U6ICdBZGRpdGlvbiB0byBncm91cCBhdHRlbXB0ZWQuJyxcclxuICAgICAgICBwYXJ0aWNpcGFudHM6IHBob25lLFxyXG4gICAgICAgIGdyb3VwczogZ3JvdXBUb0FycmF5KGdyb3VwSWQpLFxyXG4gICAgICAgIHJlc3VsdDogYXJyYXlHcm91cHMsXHJcbiAgICAgIH0sXHJcbiAgICB9KTtcclxuICB9IGNhdGNoIChlKSB7XHJcbiAgICByZXEubG9nZ2VyLmVycm9yKGUpO1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgc3RhdHVzOiAnZXJyb3InLFxyXG4gICAgICBtZXNzYWdlOiAnRXJyb3IgYWRkaW5nIHBhcnRpY2lwYW50KHMpJyxcclxuICAgICAgZXJyb3I6IGUsXHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZW1vdmVQYXJ0aWNpcGFudChyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpIHtcclxuICAvKipcclxuICAgICAjc3dhZ2dlci50YWdzID0gW1wiR3JvdXBcIl1cclxuICAgICAjc3dhZ2dlci5hdXRvQm9keT1mYWxzZVxyXG4gICAgICNzd2FnZ2VyLnNlY3VyaXR5ID0gW3tcclxuICAgICAgICAgICAgXCJiZWFyZXJBdXRoXCI6IFtdXHJcbiAgICAgfV1cclxuICAgICAjc3dhZ2dlci5wYXJhbWV0ZXJzW1wic2Vzc2lvblwiXSA9IHtcclxuICAgICAgc2NoZW1hOiAnTkVSRFdIQVRTX0FNRVJJQ0EnXHJcbiAgICAgfVxyXG4gICAgICNzd2FnZ2VyLnJlcXVlc3RCb2R5ID0ge1xyXG4gICAgICByZXF1aXJlZDogdHJ1ZSxcclxuICAgICAgXCJAY29udGVudFwiOiB7XHJcbiAgICAgICAgXCJhcHBsaWNhdGlvbi9qc29uXCI6IHtcclxuICAgICAgICAgIHNjaGVtYToge1xyXG4gICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgXCJncm91cElkXCI6IHsgdHlwZTogXCJzdHJpbmdcIiB9LFxyXG4gICAgICAgICAgICAgIFwicGhvbmVcIjogeyB0eXBlOiBcInN0cmluZ1wiIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgcmVxdWlyZWQ6IFtcImdyb3VwSWRcIiwgXCJwaG9uZVwiXVxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIGV4YW1wbGVzOiB7XHJcbiAgICAgICAgICAgIFwiRGVmYXVsdFwiOiB7XHJcbiAgICAgICAgICAgICAgdmFsdWU6IHtcclxuICAgICAgICAgICAgICAgIFwiZ3JvdXBJZFwiOiBcIjxncm91cElkPlwiLFxyXG4gICAgICAgICAgICAgICAgXCJwaG9uZVwiOiBcIjU1MjE5OTk5OTk5OTlcIlxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAqL1xyXG4gIGNvbnN0IHsgZ3JvdXBJZCwgcGhvbmUgfSA9IHJlcS5ib2R5O1xyXG5cclxuICB0cnkge1xyXG4gICAgbGV0IHJlc3BvbnNlID0ge307XHJcbiAgICBjb25zdCBhcnJheUdyb3VwczogYW55ID0gW107XHJcblxyXG4gICAgZm9yIChjb25zdCBncm91cCBvZiBncm91cFRvQXJyYXkoZ3JvdXBJZCkpIHtcclxuICAgICAgcmVzcG9uc2UgPSBhd2FpdCByZXEuY2xpZW50LnJlbW92ZVBhcnRpY2lwYW50KFxyXG4gICAgICAgIGdyb3VwLFxyXG4gICAgICAgIGNvbnRhY3RUb0FycmF5KHBob25lKVxyXG4gICAgICApO1xyXG4gICAgICBhcnJheUdyb3Vwcy5wdXNoKHJlc3BvbnNlKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oe1xyXG4gICAgICBzdGF0dXM6ICdzdWNjZXNzJyxcclxuICAgICAgcmVzcG9uc2U6IHtcclxuICAgICAgICBtZXNzYWdlOiAnUGFydGljaXBhbnQocykgcmVtb3ZlZCBzdWNjZXNzZnVsbHknLFxyXG4gICAgICAgIHBhcnRpY2lwYW50czogcGhvbmUsXHJcbiAgICAgICAgZ3JvdXBzOiBhcnJheUdyb3VwcyxcclxuICAgICAgfSxcclxuICAgIH0pO1xyXG4gIH0gY2F0Y2ggKGUpIHtcclxuICAgIHJlcS5sb2dnZXIuZXJyb3IoZSk7XHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oe1xyXG4gICAgICBzdGF0dXM6ICdlcnJvcicsXHJcbiAgICAgIG1lc3NhZ2U6ICdFcnJvciByZW1vdmluZyBwYXJ0aWNpcGFudChzKScsXHJcbiAgICAgIGVycm9yOiBlLFxyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcHJvbW90ZVBhcnRpY2lwYW50KHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSkge1xyXG4gIC8qKlxyXG4gICAgICNzd2FnZ2VyLnRhZ3MgPSBbXCJHcm91cFwiXVxyXG4gICAgICNzd2FnZ2VyLmF1dG9Cb2R5PWZhbHNlXHJcbiAgICAgI3N3YWdnZXIuc2VjdXJpdHkgPSBbe1xyXG4gICAgICAgICAgICBcImJlYXJlckF1dGhcIjogW11cclxuICAgICB9XVxyXG4gICAgICNzd2FnZ2VyLnBhcmFtZXRlcnNbXCJzZXNzaW9uXCJdID0ge1xyXG4gICAgICBzY2hlbWE6ICdORVJEV0hBVFNfQU1FUklDQSdcclxuICAgICB9XHJcbiAgICAgI3N3YWdnZXIucmVxdWVzdEJvZHkgPSB7XHJcbiAgICAgIHJlcXVpcmVkOiB0cnVlLFxyXG4gICAgICBcIkBjb250ZW50XCI6IHtcclxuICAgICAgICBcImFwcGxpY2F0aW9uL2pzb25cIjoge1xyXG4gICAgICAgICAgc2NoZW1hOiB7XHJcbiAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICBcImdyb3VwSWRcIjogeyB0eXBlOiBcInN0cmluZ1wiIH0sXHJcbiAgICAgICAgICAgICAgXCJwaG9uZVwiOiB7IHR5cGU6IFwic3RyaW5nXCIgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICByZXF1aXJlZDogW1wiZ3JvdXBJZFwiLCBcInBob25lXCJdXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgZXhhbXBsZXM6IHtcclxuICAgICAgICAgICAgXCJEZWZhdWx0XCI6IHtcclxuICAgICAgICAgICAgICB2YWx1ZToge1xyXG4gICAgICAgICAgICAgICAgXCJncm91cElkXCI6IFwiPGdyb3VwSWQ+XCIsXHJcbiAgICAgICAgICAgICAgICBcInBob25lXCI6IFwiNTUyMTk5OTk5OTk5OVwiXHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICovXHJcbiAgY29uc3QgeyBncm91cElkLCBwaG9uZSB9ID0gcmVxLmJvZHk7XHJcblxyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBhcnJheUdyb3VwczogYW55ID0gW107XHJcbiAgICBmb3IgKGNvbnN0IGdyb3VwIG9mIGdyb3VwVG9BcnJheShncm91cElkKSkge1xyXG4gICAgICBhd2FpdCByZXEuY2xpZW50LnByb21vdGVQYXJ0aWNpcGFudChncm91cCwgY29udGFjdFRvQXJyYXkocGhvbmUpKTtcclxuICAgICAgYXJyYXlHcm91cHMucHVzaChncm91cCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAxKS5qc29uKHtcclxuICAgICAgc3RhdHVzOiAnc3VjY2VzcycsXHJcbiAgICAgIHJlc3BvbnNlOiB7XHJcbiAgICAgICAgbWVzc2FnZTogJ1N1Y2Nlc3NmdWwgcHJvbW90ZWQgcGFydGljaXBhbnQocyknLFxyXG4gICAgICAgIHBhcnRpY2lwYW50czogcGhvbmUsXHJcbiAgICAgICAgZ3JvdXBzOiBhcnJheUdyb3VwcyxcclxuICAgICAgfSxcclxuICAgIH0pO1xyXG4gIH0gY2F0Y2ggKGUpIHtcclxuICAgIHJlcS5sb2dnZXIuZXJyb3IoZSk7XHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oe1xyXG4gICAgICBzdGF0dXM6ICdlcnJvcicsXHJcbiAgICAgIG1lc3NhZ2U6ICdFcnJvciBwcm9tb3RpbmcgcGFydGljaXBhbnQocyknLFxyXG4gICAgICBlcnJvcjogZSxcclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGRlbW90ZVBhcnRpY2lwYW50KHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSkge1xyXG4gIC8qKlxyXG4gICAgICNzd2FnZ2VyLnRhZ3MgPSBbXCJHcm91cFwiXVxyXG4gICAgICNzd2FnZ2VyLmF1dG9Cb2R5PWZhbHNlXHJcbiAgICAgI3N3YWdnZXIuc2VjdXJpdHkgPSBbe1xyXG4gICAgICAgICAgICBcImJlYXJlckF1dGhcIjogW11cclxuICAgICB9XVxyXG4gICAgICNzd2FnZ2VyLnBhcmFtZXRlcnNbXCJzZXNzaW9uXCJdID0ge1xyXG4gICAgICBzY2hlbWE6ICdORVJEV0hBVFNfQU1FUklDQSdcclxuICAgICB9XHJcbiAgICAgI3N3YWdnZXIucmVxdWVzdEJvZHkgPSB7XHJcbiAgICAgIHJlcXVpcmVkOiB0cnVlLFxyXG4gICAgICBcIkBjb250ZW50XCI6IHtcclxuICAgICAgICBcImFwcGxpY2F0aW9uL2pzb25cIjoge1xyXG4gICAgICAgICAgc2NoZW1hOiB7XHJcbiAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICBcImdyb3VwSWRcIjogeyB0eXBlOiBcInN0cmluZ1wiIH0sXHJcbiAgICAgICAgICAgICAgXCJwaG9uZVwiOiB7IHR5cGU6IFwic3RyaW5nXCIgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICByZXF1aXJlZDogW1wiZ3JvdXBJZFwiLCBcInBob25lXCJdXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgZXhhbXBsZXM6IHtcclxuICAgICAgICAgICAgXCJEZWZhdWx0XCI6IHtcclxuICAgICAgICAgICAgICB2YWx1ZToge1xyXG4gICAgICAgICAgICAgICAgXCJncm91cElkXCI6IFwiPGdyb3VwSWQ+XCIsXHJcbiAgICAgICAgICAgICAgICBcInBob25lXCI6IFwiNTUyMTk5OTk5OTk5OVwiXHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICovXHJcbiAgY29uc3QgeyBncm91cElkLCBwaG9uZSB9ID0gcmVxLmJvZHk7XHJcblxyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBhcnJheUdyb3VwczogYW55ID0gW107XHJcbiAgICBmb3IgKGNvbnN0IGdyb3VwIG9mIGdyb3VwVG9BcnJheShncm91cElkKSkge1xyXG4gICAgICBhd2FpdCByZXEuY2xpZW50LmRlbW90ZVBhcnRpY2lwYW50KGdyb3VwLCBjb250YWN0VG9BcnJheShwaG9uZSkpO1xyXG4gICAgICBhcnJheUdyb3Vwcy5wdXNoKGdyb3VwKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cygyMDEpLmpzb24oe1xyXG4gICAgICBzdGF0dXM6ICdzdWNjZXNzJyxcclxuICAgICAgcmVzcG9uc2U6IHtcclxuICAgICAgICBtZXNzYWdlOiAnQWRtaW4gb2YgcGFydGljaXBhbnQocykgcmV2b2tlZCBzdWNjZXNzZnVsbHknLFxyXG4gICAgICAgIHBhcnRpY2lwYW50czogcGhvbmUsXHJcbiAgICAgICAgZ3JvdXBzOiBhcnJheUdyb3VwcyxcclxuICAgICAgfSxcclxuICAgIH0pO1xyXG4gIH0gY2F0Y2ggKGUpIHtcclxuICAgIHJlcS5sb2dnZXIuZXJyb3IoZSk7XHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oe1xyXG4gICAgICBzdGF0dXM6ICdlcnJvcicsXHJcbiAgICAgIG1lc3NhZ2U6IFwiRXJyb3IgcmV2b2tpbmcgcGFydGljaXBhbnQncyBhZG1pbihzKVwiLFxyXG4gICAgICBlcnJvcjogZSxcclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldEdyb3VwQWRtaW5zKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSkge1xyXG4gIC8qKlxyXG4gICAgICNzd2FnZ2VyLnRhZ3MgPSBbXCJHcm91cFwiXVxyXG4gICAgICNzd2FnZ2VyLmF1dG9Cb2R5PWZhbHNlXHJcbiAgICAgI3N3YWdnZXIuc2VjdXJpdHkgPSBbe1xyXG4gICAgICAgICAgICBcImJlYXJlckF1dGhcIjogW11cclxuICAgICB9XVxyXG4gICAgICNzd2FnZ2VyLnBhcmFtZXRlcnNbXCJzZXNzaW9uXCJdID0ge1xyXG4gICAgICBzY2hlbWE6ICdORVJEV0hBVFNfQU1FUklDQSdcclxuICAgICB9XHJcbiAgICAgI3N3YWdnZXIucmVxdWVzdEJvZHkgPSB7XHJcbiAgICAgIHJlcXVpcmVkOiB0cnVlLFxyXG4gICAgICBcIkBjb250ZW50XCI6IHtcclxuICAgICAgICBcImFwcGxpY2F0aW9uL2pzb25cIjoge1xyXG4gICAgICAgICAgc2NoZW1hOiB7XHJcbiAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICBcImdyb3VwSWRcIjogeyB0eXBlOiBcInN0cmluZ1wiIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgcmVxdWlyZWQ6IFtcImdyb3VwSWRcIl1cclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICBleGFtcGxlczoge1xyXG4gICAgICAgICAgICBcIkRlZmF1bHRcIjoge1xyXG4gICAgICAgICAgICAgIHZhbHVlOiB7XHJcbiAgICAgICAgICAgICAgICBcImdyb3VwSWRcIjogXCI8Z3JvdXBJZD5cIlxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAqL1xyXG4gIGNvbnN0IHsgZ3JvdXBJZCB9ID0gcmVxLnBhcmFtcztcclxuXHJcbiAgdHJ5IHtcclxuICAgIGxldCByZXNwb25zZSA9IHt9O1xyXG4gICAgY29uc3QgYXJyYXlHcm91cHM6IGFueSA9IFtdO1xyXG5cclxuICAgIGZvciAoY29uc3QgZ3JvdXAgb2YgZ3JvdXBUb0FycmF5KGdyb3VwSWQpKSB7XHJcbiAgICAgIHJlc3BvbnNlID0gYXdhaXQgcmVxLmNsaWVudC5nZXRHcm91cEFkbWlucyhncm91cCk7XHJcbiAgICAgIGFycmF5R3JvdXBzLnB1c2gocmVzcG9uc2UpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7IHN0YXR1czogJ3N1Y2Nlc3MnLCByZXNwb25zZTogYXJyYXlHcm91cHMgfSk7XHJcbiAgfSBjYXRjaCAoZSkge1xyXG4gICAgcmVxLmxvZ2dlci5lcnJvcihlKTtcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7XHJcbiAgICAgIHN0YXR1czogJ2Vycm9yJyxcclxuICAgICAgbWVzc2FnZTogJ0Vycm9yIHJldHJpZXZpbmcgZ3JvdXAgYWRtaW4ocyknLFxyXG4gICAgICBlcnJvcjogZSxcclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldEdyb3VwSW52aXRlTGluayhyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpIHtcclxuICAvKipcclxuICAgICAjc3dhZ2dlci50YWdzID0gW1wiR3JvdXBcIl1cclxuICAgICAjc3dhZ2dlci5hdXRvQm9keT1mYWxzZVxyXG4gICAgICNzd2FnZ2VyLnNlY3VyaXR5ID0gW3tcclxuICAgICAgICAgICAgXCJiZWFyZXJBdXRoXCI6IFtdXHJcbiAgICAgfV1cclxuICAgICAjc3dhZ2dlci5wYXJhbWV0ZXJzW1wic2Vzc2lvblwiXSA9IHtcclxuICAgICAgc2NoZW1hOiAnTkVSRFdIQVRTX0FNRVJJQ0EnXHJcbiAgICAgfVxyXG4gICAgICNzd2FnZ2VyLnJlcXVlc3RCb2R5ID0ge1xyXG4gICAgICByZXF1aXJlZDogdHJ1ZSxcclxuICAgICAgXCJAY29udGVudFwiOiB7XHJcbiAgICAgICAgXCJhcHBsaWNhdGlvbi9qc29uXCI6IHtcclxuICAgICAgICAgIHNjaGVtYToge1xyXG4gICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgZ3JvdXBJZDogeyB0eXBlOiBcInN0cmluZ1wiIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAqL1xyXG4gIGNvbnN0IHsgZ3JvdXBJZCB9ID0gcmVxLnBhcmFtcztcclxuICB0cnkge1xyXG4gICAgbGV0IHJlc3BvbnNlID0ge307XHJcbiAgICBmb3IgKGNvbnN0IGdyb3VwIG9mIGdyb3VwVG9BcnJheShncm91cElkKSkge1xyXG4gICAgICByZXNwb25zZSA9IGF3YWl0IHJlcS5jbGllbnQuZ2V0R3JvdXBJbnZpdGVMaW5rKGdyb3VwKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oeyBzdGF0dXM6ICdzdWNjZXNzJywgcmVzcG9uc2U6IHJlc3BvbnNlIH0pO1xyXG4gIH0gY2F0Y2ggKGUpIHtcclxuICAgIHJlcS5sb2dnZXIuZXJyb3IoZSk7XHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oe1xyXG4gICAgICBzdGF0dXM6ICdlcnJvcicsXHJcbiAgICAgIG1lc3NhZ2U6ICdFcnJvciBvbiBnZXQgZ3JvdXAgaW52aXRlIGxpbmsnLFxyXG4gICAgICBlcnJvcjogZSxcclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJldm9rZUdyb3VwSW52aXRlTGluayhyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpIHtcclxuICAvKipcclxuICAgICAjc3dhZ2dlci50YWdzID0gW1wiR3JvdXBcIl1cclxuICAgICAjc3dhZ2dlci5hdXRvQm9keT1mYWxzZVxyXG4gICAgICNzd2FnZ2VyLnNlY3VyaXR5ID0gW3tcclxuICAgICAgICAgICAgXCJiZWFyZXJBdXRoXCI6IFtdXHJcbiAgICAgfV1cclxuICAgICAjc3dhZ2dlci5wYXJhbWV0ZXJzW1wic2Vzc2lvblwiXSA9IHtcclxuICAgICAgc2NoZW1hOiAnTkVSRFdIQVRTX0FNRVJJQ0EnXHJcbiAgICAgfVxyXG4gICAgICNzd2FnZ2VyLnJlcXVlc3RCb2R5ID0ge1xyXG4gICAgICByZXF1aXJlZDogdHJ1ZSxcclxuICAgICAgXCJAY29udGVudFwiOiB7XHJcbiAgICAgICAgXCJhcHBsaWNhdGlvbi9qc29uXCI6IHtcclxuICAgICAgICAgIHNjaGVtYToge1xyXG4gICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgJGdyb3VwSWQ6IHsgdHlwZTogXCJzdHJpbmdcIiB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgKi9cclxuICBjb25zdCB7IGdyb3VwSWQgfSA9IHJlcS5wYXJhbXM7XHJcblxyXG4gIGxldCByZXNwb25zZSA9IHt9O1xyXG5cclxuICB0cnkge1xyXG4gICAgZm9yIChjb25zdCBncm91cCBvZiBncm91cFRvQXJyYXkoZ3JvdXBJZCkpIHtcclxuICAgICAgcmVzcG9uc2UgPSBhd2FpdCByZXEuY2xpZW50LnJldm9rZUdyb3VwSW52aXRlTGluayhncm91cCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcclxuICAgICAgc3RhdHVzOiAnU3VjY2VzcycsXHJcbiAgICAgIHJlc3BvbnNlOiByZXNwb25zZSxcclxuICAgIH0pO1xyXG4gIH0gY2F0Y2ggKGUpIHtcclxuICAgIHJlcS5sb2dnZXIuZXJyb3IoZSk7XHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oe1xyXG4gICAgICBzdGF0dXM6ICdlcnJvcicsXHJcbiAgICAgIG1lc3NhZ2U6ICdFcnJvciBvbiByZXZva2UgZ3JvdXAgaW52aXRlIGxpbmsnLFxyXG4gICAgICBlcnJvcjogZSxcclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldEFsbEJyb2FkY2FzdExpc3QocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKSB7XHJcbiAgLyoqXHJcbiAgICAgI3N3YWdnZXIudGFncyA9IFtcIk1pc2NcIl1cclxuICAgICAjc3dhZ2dlci5hdXRvQm9keT1mYWxzZVxyXG4gICAgICNzd2FnZ2VyLnNlY3VyaXR5ID0gW3tcclxuICAgICAgICAgICAgXCJiZWFyZXJBdXRoXCI6IFtdXHJcbiAgICAgfV1cclxuICAgICAjc3dhZ2dlci5wYXJhbWV0ZXJzW1wic2Vzc2lvblwiXSA9IHtcclxuICAgICAgc2NoZW1hOiAnTkVSRFdIQVRTX0FNRVJJQ0EnXHJcbiAgICAgfVxyXG4gICAqL1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHJlcS5jbGllbnQuZ2V0QWxsQnJvYWRjYXN0TGlzdCgpO1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHsgc3RhdHVzOiAnc3VjY2VzcycsIHJlc3BvbnNlOiByZXNwb25zZSB9KTtcclxuICB9IGNhdGNoIChlKSB7XHJcbiAgICByZXEubG9nZ2VyLmVycm9yKGUpO1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgc3RhdHVzOiAnZXJyb3InLFxyXG4gICAgICBtZXNzYWdlOiAnRXJyb3Igb24gZ2V0IGFsbCBicm9hZCBjYXN0IGxpc3QnLFxyXG4gICAgICBlcnJvcjogZSxcclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldEdyb3VwSW5mb0Zyb21JbnZpdGVMaW5rKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSkge1xyXG4gIC8qKlxyXG4gICAgICNzd2FnZ2VyLnRhZ3MgPSBbXCJHcm91cFwiXVxyXG4gICAgICNzd2FnZ2VyLmF1dG9Cb2R5PWZhbHNlXHJcbiAgICAgI3N3YWdnZXIuc2VjdXJpdHkgPSBbe1xyXG4gICAgICAgICAgICBcImJlYXJlckF1dGhcIjogW11cclxuICAgICB9XVxyXG4gICAgICNzd2FnZ2VyLnBhcmFtZXRlcnNbXCJzZXNzaW9uXCJdID0ge1xyXG4gICAgICBzY2hlbWE6ICdORVJEV0hBVFNfQU1FUklDQSdcclxuICAgICB9XHJcbiAgICAgI3N3YWdnZXIucmVxdWVzdEJvZHkgPSB7XHJcbiAgICAgIHJlcXVpcmVkOiB0cnVlLFxyXG4gICAgICBcIkBjb250ZW50XCI6IHtcclxuICAgICAgICBcImFwcGxpY2F0aW9uL2pzb25cIjoge1xyXG4gICAgICAgICAgc2NoZW1hOiB7XHJcbiAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAkaW52aXRlY29kZTogeyB0eXBlOiBcInN0cmluZ1wiIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAqL1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCB7IGludml0ZWNvZGUgfSA9IHJlcS5ib2R5O1xyXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCByZXEuY2xpZW50LmdldEdyb3VwSW5mb0Zyb21JbnZpdGVMaW5rKGludml0ZWNvZGUpO1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHsgc3RhdHVzOiAnc3VjY2VzcycsIHJlc3BvbnNlOiByZXNwb25zZSB9KTtcclxuICB9IGNhdGNoIChlKSB7XHJcbiAgICByZXEubG9nZ2VyLmVycm9yKGUpO1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgc3RhdHVzOiAnZXJyb3InLFxyXG4gICAgICBtZXNzYWdlOiAnRXJyb3Igb24gZ2V0IGdyb3VwIGluZm8gZnJvbSBpbnZpdGUgbGluaycsXHJcbiAgICAgIGVycm9yOiBlLFxyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0R3JvdXBNZW1iZXJzSWRzKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSkge1xyXG4gIC8qKlxyXG4gICAgICNzd2FnZ2VyLnRhZ3MgPSBbXCJHcm91cFwiXVxyXG4gICAgICNzd2FnZ2VyLmF1dG9Cb2R5PWZhbHNlXHJcbiAgICAgI3N3YWdnZXIuc2VjdXJpdHkgPSBbe1xyXG4gICAgICAgICAgICBcImJlYXJlckF1dGhcIjogW11cclxuICAgICB9XVxyXG4gICAgICNzd2FnZ2VyLnBhcmFtZXRlcnNbXCJzZXNzaW9uXCJdID0ge1xyXG4gICAgICBzY2hlbWE6ICdORVJEV0hBVFNfQU1FUklDQSdcclxuICAgICB9XHJcbiAgICAgI3N3YWdnZXIucGFyYW1ldGVyc1tcImdyb3VwSWRcIl0gPSB7XHJcbiAgICAgIHNjaGVtYTogJzxncm91cElkPidcclxuICAgICB9XHJcbiAgICovXHJcbiAgY29uc3QgeyBncm91cElkIH0gPSByZXEucGFyYW1zO1xyXG4gIGxldCByZXNwb25zZSA9IHt9O1xyXG4gIHRyeSB7XHJcbiAgICBmb3IgKGNvbnN0IGdyb3VwIG9mIGdyb3VwVG9BcnJheShncm91cElkKSkge1xyXG4gICAgICByZXNwb25zZSA9IGF3YWl0IHJlcS5jbGllbnQuZ2V0R3JvdXBNZW1iZXJzSWRzKGdyb3VwKTtcclxuICAgIH1cclxuICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7IHN0YXR1czogJ3N1Y2Nlc3MnLCByZXNwb25zZTogcmVzcG9uc2UgfSk7XHJcbiAgfSBjYXRjaCAoZSkge1xyXG4gICAgcmVxLmxvZ2dlci5lcnJvcihlKTtcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7XHJcbiAgICAgIHN0YXR1czogJ2Vycm9yJyxcclxuICAgICAgbWVzc2FnZTogJ0Vycm9yIG9uIGdldCBncm91cCBtZW1iZXJzIGlkcycsXHJcbiAgICAgIGVycm9yOiBlLFxyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2V0R3JvdXBEZXNjcmlwdGlvbihyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpIHtcclxuICAvKipcclxuICAgICAjc3dhZ2dlci50YWdzID0gW1wiR3JvdXBcIl1cclxuICAgICAjc3dhZ2dlci5hdXRvQm9keT1mYWxzZVxyXG4gICAgICNzd2FnZ2VyLnNlY3VyaXR5ID0gW3tcclxuICAgICAgICAgICAgXCJiZWFyZXJBdXRoXCI6IFtdXHJcbiAgICAgfV1cclxuICAgICAjc3dhZ2dlci5wYXJhbWV0ZXJzW1wic2Vzc2lvblwiXSA9IHtcclxuICAgICAgc2NoZW1hOiAnTkVSRFdIQVRTX0FNRVJJQ0EnXHJcbiAgICAgfVxyXG4gICAgICNzd2FnZ2VyLnJlcXVlc3RCb2R5ID0ge1xyXG4gICAgICByZXF1aXJlZDogdHJ1ZSxcclxuICAgICAgXCJAY29udGVudFwiOiB7XHJcbiAgICAgICAgXCJhcHBsaWNhdGlvbi9qc29uXCI6IHtcclxuICAgICAgICAgIHNjaGVtYToge1xyXG4gICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgJGdyb3VwSWQ6IHsgdHlwZTogXCJzdHJpbmdcIiB9LFxyXG4gICAgICAgICAgICAgICRkZXNjcmlwdGlvbjogeyB0eXBlOiBcInN0cmluZ1wiIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAqL1xyXG4gIGNvbnN0IHsgZ3JvdXBJZCwgZGVzY3JpcHRpb24gfSA9IHJlcS5ib2R5O1xyXG5cclxuICBsZXQgcmVzcG9uc2UgPSB7fTtcclxuXHJcbiAgdHJ5IHtcclxuICAgIGZvciAoY29uc3QgZ3JvdXAgb2YgZ3JvdXBUb0FycmF5KGdyb3VwSWQpKSB7XHJcbiAgICAgIHJlc3BvbnNlID0gYXdhaXQgcmVxLmNsaWVudC5zZXRHcm91cERlc2NyaXB0aW9uKGdyb3VwLCBkZXNjcmlwdGlvbik7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHsgc3RhdHVzOiAnc3VjY2VzcycsIHJlc3BvbnNlOiByZXNwb25zZSB9KTtcclxuICB9IGNhdGNoIChlKSB7XHJcbiAgICByZXEubG9nZ2VyLmVycm9yKGUpO1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgc3RhdHVzOiAnZXJyb3InLFxyXG4gICAgICBtZXNzYWdlOiAnRXJyb3Igb24gc2V0IGdyb3VwIGRlc2NyaXB0aW9uJyxcclxuICAgICAgZXJyb3I6IGUsXHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzZXRHcm91cFByb3BlcnR5KHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSkge1xyXG4gIC8qKlxyXG4gICAgICNzd2FnZ2VyLnRhZ3MgPSBbXCJHcm91cFwiXVxyXG4gICAgICNzd2FnZ2VyLmF1dG9Cb2R5PWZhbHNlXHJcbiAgICAgI3N3YWdnZXIuc2VjdXJpdHkgPSBbe1xyXG4gICAgICAgICAgICBcImJlYXJlckF1dGhcIjogW11cclxuICAgICB9XVxyXG4gICAgICNzd2FnZ2VyLnBhcmFtZXRlcnNbXCJzZXNzaW9uXCJdID0ge1xyXG4gICAgICBzY2hlbWE6ICdORVJEV0hBVFNfQU1FUklDQSdcclxuICAgICB9XHJcbiAgICAgI3N3YWdnZXIucmVxdWVzdEJvZHkgPSB7XHJcbiAgICAgIHJlcXVpcmVkOiB0cnVlLFxyXG4gICAgICBcIkBjb250ZW50XCI6IHtcclxuICAgICAgICBcImFwcGxpY2F0aW9uL2pzb25cIjoge1xyXG4gICAgICAgICAgc2NoZW1hOiB7XHJcbiAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAkZ3JvdXBJZDogeyB0eXBlOiBcInN0cmluZ1wiIH0sXHJcbiAgICAgICAgICAgICAgJHByb3BlcnR5OiB7IHR5cGU6IFwic3RyaW5nXCIgfSxcclxuICAgICAgICAgICAgICAkdmFsdWU6IHsgdHlwZTogXCJib29sZWFuXCIgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICovXHJcbiAgY29uc3QgeyBncm91cElkLCBwcm9wZXJ0eSwgdmFsdWUgPSB0cnVlIH0gPSByZXEuYm9keTtcclxuXHJcbiAgbGV0IHJlc3BvbnNlID0ge307XHJcblxyXG4gIHRyeSB7XHJcbiAgICBmb3IgKGNvbnN0IGdyb3VwIG9mIGdyb3VwVG9BcnJheShncm91cElkKSkge1xyXG4gICAgICByZXNwb25zZSA9IGF3YWl0IHJlcS5jbGllbnQuc2V0R3JvdXBQcm9wZXJ0eShncm91cCwgcHJvcGVydHksIHZhbHVlKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oeyBzdGF0dXM6ICdzdWNjZXNzJywgcmVzcG9uc2U6IHJlc3BvbnNlIH0pO1xyXG4gIH0gY2F0Y2ggKGUpIHtcclxuICAgIHJlcS5sb2dnZXIuZXJyb3IoZSk7XHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oe1xyXG4gICAgICBzdGF0dXM6ICdlcnJvcicsXHJcbiAgICAgIG1lc3NhZ2U6ICdFcnJvciBvbiBzZXQgZ3JvdXAgcHJvcGVydHknLFxyXG4gICAgICBlcnJvcjogZSxcclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNldEdyb3VwU3ViamVjdChyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpIHtcclxuICAvKipcclxuICAgICAjc3dhZ2dlci50YWdzID0gW1wiR3JvdXBcIl1cclxuICAgICAjc3dhZ2dlci5hdXRvQm9keT1mYWxzZVxyXG4gICAgICNzd2FnZ2VyLnNlY3VyaXR5ID0gW3tcclxuICAgICAgICAgICAgXCJiZWFyZXJBdXRoXCI6IFtdXHJcbiAgICAgfV1cclxuICAgICAjc3dhZ2dlci5wYXJhbWV0ZXJzW1wic2Vzc2lvblwiXSA9IHtcclxuICAgICAgc2NoZW1hOiAnTkVSRFdIQVRTX0FNRVJJQ0EnXHJcbiAgICAgfVxyXG4gICAgICNzd2FnZ2VyLnJlcXVlc3RCb2R5ID0ge1xyXG4gICAgICByZXF1aXJlZDogdHJ1ZSxcclxuICAgICAgXCJAY29udGVudFwiOiB7XHJcbiAgICAgICAgXCJhcHBsaWNhdGlvbi9qc29uXCI6IHtcclxuICAgICAgICAgIHNjaGVtYToge1xyXG4gICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgJGdyb3VwSWQ6IHsgdHlwZTogXCJzdHJpbmdcIiB9LFxyXG4gICAgICAgICAgICAgICR0aXRsZTogeyB0eXBlOiBcInN0cmluZ1wiIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAqL1xyXG4gIGNvbnN0IHsgZ3JvdXBJZCwgdGl0bGUgfSA9IHJlcS5ib2R5O1xyXG5cclxuICBsZXQgcmVzcG9uc2UgPSB7fTtcclxuXHJcbiAgdHJ5IHtcclxuICAgIGZvciAoY29uc3QgZ3JvdXAgb2YgZ3JvdXBUb0FycmF5KGdyb3VwSWQpKSB7XHJcbiAgICAgIHJlc3BvbnNlID0gYXdhaXQgcmVxLmNsaWVudC5zZXRHcm91cFN1YmplY3QoZ3JvdXAsIHRpdGxlKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oeyBzdGF0dXM6ICdzdWNjZXNzJywgcmVzcG9uc2U6IHJlc3BvbnNlIH0pO1xyXG4gIH0gY2F0Y2ggKGUpIHtcclxuICAgIHJlcS5sb2dnZXIuZXJyb3IoZSk7XHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oe1xyXG4gICAgICBzdGF0dXM6ICdlcnJvcicsXHJcbiAgICAgIG1lc3NhZ2U6ICdFcnJvciBvbiBzZXQgZ3JvdXAgc3ViamVjdCcsXHJcbiAgICAgIGVycm9yOiBlLFxyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2V0TWVzc2FnZXNBZG1pbnNPbmx5KHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSkge1xyXG4gIC8qKlxyXG4gICAgICNzd2FnZ2VyLnRhZ3MgPSBbXCJHcm91cFwiXVxyXG4gICAgICNzd2FnZ2VyLmF1dG9Cb2R5PWZhbHNlXHJcbiAgICAgI3N3YWdnZXIuc2VjdXJpdHkgPSBbe1xyXG4gICAgICAgICAgICBcImJlYXJlckF1dGhcIjogW11cclxuICAgICB9XVxyXG4gICAgICNzd2FnZ2VyLnBhcmFtZXRlcnNbXCJzZXNzaW9uXCJdID0ge1xyXG4gICAgICBzY2hlbWE6ICdORVJEV0hBVFNfQU1FUklDQSdcclxuICAgICB9XHJcbiAgICAgI3N3YWdnZXIucmVxdWVzdEJvZHkgPSB7XHJcbiAgICAgIHJlcXVpcmVkOiB0cnVlLFxyXG4gICAgICBcIkBjb250ZW50XCI6IHtcclxuICAgICAgICBcImFwcGxpY2F0aW9uL2pzb25cIjoge1xyXG4gICAgICAgICAgc2NoZW1hOiB7XHJcbiAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAkZ3JvdXBJZDogeyB0eXBlOiBcInN0cmluZ1wiIH0sXHJcbiAgICAgICAgICAgICAgJHZhbHVlOiB7IHR5cGU6IFwiYm9vbGVhblwiIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAqL1xyXG4gIGNvbnN0IHsgZ3JvdXBJZCwgdmFsdWUgPSB0cnVlIH0gPSByZXEuYm9keTtcclxuXHJcbiAgbGV0IHJlc3BvbnNlID0ge307XHJcblxyXG4gIHRyeSB7XHJcbiAgICBmb3IgKGNvbnN0IGdyb3VwIG9mIGdyb3VwVG9BcnJheShncm91cElkKSkge1xyXG4gICAgICByZXNwb25zZSA9IGF3YWl0IHJlcS5jbGllbnQuc2V0TWVzc2FnZXNBZG1pbnNPbmx5KGdyb3VwLCB2YWx1ZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHsgc3RhdHVzOiAnc3VjY2VzcycsIHJlc3BvbnNlOiByZXNwb25zZSB9KTtcclxuICB9IGNhdGNoIChlKSB7XHJcbiAgICByZXEubG9nZ2VyLmVycm9yKGUpO1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgc3RhdHVzOiAnZXJyb3InLFxyXG4gICAgICBtZXNzYWdlOiAnRXJyb3Igb24gc2V0IG1lc3NhZ2VzIGFkbWlucyBvbmx5JyxcclxuICAgICAgZXJyb3I6IGUsXHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjaGFuZ2VQcml2YWN5R3JvdXAocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKSB7XHJcbiAgLyoqXHJcbiAgICAgI3N3YWdnZXIudGFncyA9IFtcIkdyb3VwXCJdXHJcbiAgICAgI3N3YWdnZXIuYXV0b0JvZHk9ZmFsc2VcclxuICAgICAjc3dhZ2dlci5zZWN1cml0eSA9IFt7XHJcbiAgICAgICAgICAgIFwiYmVhcmVyQXV0aFwiOiBbXVxyXG4gICAgIH1dXHJcbiAgICAgI3N3YWdnZXIucGFyYW1ldGVyc1tcInNlc3Npb25cIl0gPSB7XHJcbiAgICAgIHNjaGVtYTogJ05FUkRXSEFUU19BTUVSSUNBJ1xyXG4gICAgIH1cclxuICAgICAjc3dhZ2dlci5yZXF1ZXN0Qm9keSA9IHtcclxuICAgICAgcmVxdWlyZWQ6IHRydWUsXHJcbiAgICAgIFwiQGNvbnRlbnRcIjoge1xyXG4gICAgICAgIFwiYXBwbGljYXRpb24vanNvblwiOiB7XHJcbiAgICAgICAgICBzY2hlbWE6IHtcclxuICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICRncm91cElkOiB7IHR5cGU6IFwic3RyaW5nXCIgfSxcclxuICAgICAgICAgICAgICAkc3RhdHVzOiB7IHR5cGU6IFwiYm9vbGVhblwiIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAqL1xyXG4gIGNvbnN0IHsgZ3JvdXBJZCwgc3RhdHVzIH0gPSByZXEuYm9keTtcclxuXHJcbiAgdHJ5IHtcclxuICAgIGZvciAoY29uc3QgZ3JvdXAgb2YgY29udGFjdFRvQXJyYXkoZ3JvdXBJZCkpIHtcclxuICAgICAgYXdhaXQgcmVxLmNsaWVudC5zZXRHcm91cFByb3BlcnR5KFxyXG4gICAgICAgIGdyb3VwLFxyXG4gICAgICAgICdyZXN0cmljdCcgYXMgYW55LFxyXG4gICAgICAgIHN0YXR1cyA9PT0gJ3RydWUnXHJcbiAgICAgICk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcclxuICAgICAgc3RhdHVzOiAnc3VjY2VzcycsXHJcbiAgICAgIHJlc3BvbnNlOiB7IG1lc3NhZ2U6ICdHcm91cCBwcml2YWN5IGNoYW5nZWQgc3VjY2Vzc2Z1bGx5JyB9LFxyXG4gICAgfSk7XHJcbiAgfSBjYXRjaCAoZSkge1xyXG4gICAgcmVxLmxvZ2dlci5lcnJvcihlKTtcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7XHJcbiAgICAgIHN0YXR1czogJ2Vycm9yJyxcclxuICAgICAgbWVzc2FnZTogJ0Vycm9yIGNoYW5naW5nIGdyb3VwIHByaXZhY3knLFxyXG4gICAgICBlcnJvcjogZSxcclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNldEdyb3VwUHJvZmlsZVBpYyhyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpIHtcclxuICAvKipcclxuICAgICAjc3dhZ2dlci50YWdzID0gW1wiR3JvdXBcIl1cclxuICAgICAjc3dhZ2dlci5hdXRvQm9keT1mYWxzZVxyXG4gICAgICNzd2FnZ2VyLnNlY3VyaXR5ID0gW3tcclxuICAgICAgICAgICAgXCJiZWFyZXJBdXRoXCI6IFtdXHJcbiAgICAgfV1cclxuICAgICAjc3dhZ2dlci5wYXJhbWV0ZXJzW1wic2Vzc2lvblwiXSA9IHtcclxuICAgICAgc2NoZW1hOiAnTkVSRFdIQVRTX0FNRVJJQ0EnXHJcbiAgICAgfVxyXG4gICAgICNzd2FnZ2VyLnJlcXVlc3RCb2R5ID0ge1xyXG4gICAgICByZXF1aXJlZDogdHJ1ZSxcclxuICAgICAgXCJAY29udGVudFwiOiB7XHJcbiAgICAgICAgXCJhcHBsaWNhdGlvbi9qc29uXCI6IHtcclxuICAgICAgICAgIHNjaGVtYToge1xyXG4gICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgJGdyb3VwSWQ6IHsgdHlwZTogXCJzdHJpbmdcIiB9LFxyXG4gICAgICAgICAgICAgICRwYXRoOiB7IHR5cGU6IFwic3RyaW5nXCIgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICovXHJcbiAgY29uc3QgeyBncm91cElkLCBwYXRoIH0gPSByZXEuYm9keTtcclxuXHJcbiAgaWYgKCFwYXRoICYmICFyZXEuZmlsZSlcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDQwMSkuc2VuZCh7XHJcbiAgICAgIG1lc3NhZ2U6ICdTZW5kaW5nIHRoZSBpbWFnZSBpcyBtYW5kYXRvcnknLFxyXG4gICAgfSk7XHJcblxyXG4gIGNvbnN0IHBhdGhGaWxlID0gcGF0aCB8fCByZXEuZmlsZT8ucGF0aDtcclxuXHJcbiAgdHJ5IHtcclxuICAgIGZvciAoY29uc3QgY29udGFjdCBvZiBjb250YWN0VG9BcnJheShncm91cElkLCB0cnVlKSkge1xyXG4gICAgICBhd2FpdCByZXEuY2xpZW50LnNldEdyb3VwSWNvbihjb250YWN0LCBwYXRoRmlsZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAxKS5qc29uKHtcclxuICAgICAgc3RhdHVzOiAnc3VjY2VzcycsXHJcbiAgICAgIHJlc3BvbnNlOiB7IG1lc3NhZ2U6ICdHcm91cCBwcm9maWxlIHBob3RvIHN1Y2Nlc3NmdWxseSBjaGFuZ2VkJyB9LFxyXG4gICAgfSk7XHJcbiAgfSBjYXRjaCAoZSkge1xyXG4gICAgcmVxLmxvZ2dlci5lcnJvcihlKTtcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7XHJcbiAgICAgIHN0YXR1czogJ2Vycm9yJyxcclxuICAgICAgbWVzc2FnZTogJ0Vycm9yIGNoYW5naW5nIGdyb3VwIHBob3RvJyxcclxuICAgICAgZXJyb3I6IGUsXHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7OztBQWlCQSxJQUFBQSxVQUFBLEdBQUFDLE9BQUEsc0JBSTJCLENBckIzQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FTTyxlQUFlQyxZQUFZQSxDQUFDQyxHQUFZLEVBQUVDLEdB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