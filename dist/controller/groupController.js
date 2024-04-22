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

    const groupLink = await req.client.getGroupInviteLink(
      response.gid._serialized
    );

    Object.keys(response.participants).forEach(async (k) => {
      const code = response.participants[k].invite_code;

      if (code) {
        await req.client.sendText(
          k,
          `Entre no grupo "${name}" acessando o link: ${groupLink}`,
          {}
        );
      }
    });

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfZnVuY3Rpb25zIiwicmVxdWlyZSIsImdldEFsbEdyb3VwcyIsInJlcSIsInJlcyIsInJlc3BvbnNlIiwiY2xpZW50Iiwic3RhdHVzIiwianNvbiIsImUiLCJsb2dnZXIiLCJlcnJvciIsIm1lc3NhZ2UiLCJqb2luR3JvdXBCeUNvZGUiLCJpbnZpdGVDb2RlIiwiYm9keSIsInNlbmQiLCJqb2luR3JvdXAiLCJjb250YWN0IiwiY3JlYXRlR3JvdXAiLCJwYXJ0aWNpcGFudHMiLCJuYW1lIiwiaW5mb0dyb3VwIiwiZ3JvdXAiLCJncm91cE5hbWVUb0FycmF5IiwiY29udGFjdFRvQXJyYXkiLCJwdXNoIiwiaWQiLCJnaWQiLCJ1c2VyIiwiZ3JvdXBMaW5rIiwiZ2V0R3JvdXBJbnZpdGVMaW5rIiwiX3NlcmlhbGl6ZWQiLCJPYmplY3QiLCJrZXlzIiwiZm9yRWFjaCIsImsiLCJjb2RlIiwiaW52aXRlX2NvZGUiLCJzZW5kVGV4dCIsImdyb3VwSW5mbyIsImxlYXZlR3JvdXAiLCJncm91cElkIiwiZ3JvdXBUb0FycmF5IiwibWVzc2FnZXMiLCJnZXRHcm91cE1lbWJlcnMiLCJwYXJhbXMiLCJhZGRQYXJ0aWNpcGFudCIsInBob25lIiwiYXJyYXlHcm91cHMiLCJncm91cHMiLCJyZXN1bHQiLCJyZW1vdmVQYXJ0aWNpcGFudCIsInByb21vdGVQYXJ0aWNpcGFudCIsImRlbW90ZVBhcnRpY2lwYW50IiwiZ2V0R3JvdXBBZG1pbnMiLCJyZXZva2VHcm91cEludml0ZUxpbmsiLCJnZXRBbGxCcm9hZGNhc3RMaXN0IiwiZ2V0R3JvdXBJbmZvRnJvbUludml0ZUxpbmsiLCJpbnZpdGVjb2RlIiwiZ2V0R3JvdXBNZW1iZXJzSWRzIiwic2V0R3JvdXBEZXNjcmlwdGlvbiIsImRlc2NyaXB0aW9uIiwic2V0R3JvdXBQcm9wZXJ0eSIsInByb3BlcnR5IiwidmFsdWUiLCJzZXRHcm91cFN1YmplY3QiLCJ0aXRsZSIsInNldE1lc3NhZ2VzQWRtaW5zT25seSIsImNoYW5nZVByaXZhY3lHcm91cCIsInNldEdyb3VwUHJvZmlsZVBpYyIsInBhdGgiLCJmaWxlIiwicGF0aEZpbGUiLCJzZXRHcm91cEljb24iXSwic291cmNlcyI6WyIuLi8uLi9zcmMvY29udHJvbGxlci9ncm91cENvbnRyb2xsZXIudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLypcclxuICogQ29weXJpZ2h0IDIwMjMgV1BQQ29ubmVjdCBUZWFtXHJcbiAqXHJcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XHJcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cclxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XHJcbiAqXHJcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcclxuICpcclxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxyXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXHJcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxyXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXHJcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxyXG4gKi9cclxuaW1wb3J0IHsgUmVxdWVzdCwgUmVzcG9uc2UgfSBmcm9tICdleHByZXNzJztcclxuXHJcbmltcG9ydCB7XHJcbiAgY29udGFjdFRvQXJyYXksXHJcbiAgZ3JvdXBOYW1lVG9BcnJheSxcclxuICBncm91cFRvQXJyYXksXHJcbn0gZnJvbSAnLi4vdXRpbC9mdW5jdGlvbnMnO1xyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldEFsbEdyb3VwcyhyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpIHtcclxuICAvKipcclxuICAgICAjc3dhZ2dlci50YWdzID0gW1wiR3JvdXBcIl1cclxuICAgICAjc3dhZ2dlci5kZXByZWNhdGVkID0gdHJ1ZVxyXG4gICAgICNzd2FnZ2VyLnN1bW1hcnkgPSAnRGVwcmVjYXRlZCBpbiBmYXZvciBvZiAnbGlzdC1jaGF0cydcclxuICAgICAjc3dhZ2dlci5hdXRvQm9keT1mYWxzZVxyXG4gICAgICNzd2FnZ2VyLnNlY3VyaXR5ID0gW3tcclxuICAgICAgICAgICAgXCJiZWFyZXJBdXRoXCI6IFtdXHJcbiAgICAgfV1cclxuICAgICAjc3dhZ2dlci5wYXJhbWV0ZXJzW1wic2Vzc2lvblwiXSA9IHtcclxuICAgICAgc2NoZW1hOiAnTkVSRFdIQVRTX0FNRVJJQ0EnXHJcbiAgICAgfVxyXG4gICAqL1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHJlcS5jbGllbnQuZ2V0QWxsR3JvdXBzKCk7XHJcblxyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHsgc3RhdHVzOiAnc3VjY2VzcycsIHJlc3BvbnNlOiByZXNwb25zZSB9KTtcclxuICB9IGNhdGNoIChlKSB7XHJcbiAgICByZXEubG9nZ2VyLmVycm9yKGUpO1xyXG4gICAgcmVzXHJcbiAgICAgIC5zdGF0dXMoNTAwKVxyXG4gICAgICAuanNvbih7IHN0YXR1czogJ2Vycm9yJywgbWVzc2FnZTogJ0Vycm9yIGZldGNoaW5nIGdyb3VwcycsIGVycm9yOiBlIH0pO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGpvaW5Hcm91cEJ5Q29kZShyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpIHtcclxuICAvKipcclxuICAgICAjc3dhZ2dlci50YWdzID0gW1wiR3JvdXBcIl1cclxuICAgICAjc3dhZ2dlci5hdXRvQm9keT1mYWxzZVxyXG4gICAgICNzd2FnZ2VyLnNlY3VyaXR5ID0gW3tcclxuICAgICAgICAgICAgXCJiZWFyZXJBdXRoXCI6IFtdXHJcbiAgICAgfV1cclxuICAgICAjc3dhZ2dlci5wYXJhbWV0ZXJzW1wic2Vzc2lvblwiXSA9IHtcclxuICAgICAgc2NoZW1hOiAnTkVSRFdIQVRTX0FNRVJJQ0EnXHJcbiAgICAgfVxyXG4gICAgICNzd2FnZ2VyLnJlcXVlc3RCb2R5ID0ge1xyXG4gICAgICByZXF1aXJlZDogdHJ1ZSxcclxuICAgICAgY29udGVudDoge1xyXG4gICAgICAgIFwiYXBwbGljYXRpb24vanNvblwiOiB7XHJcbiAgICAgICAgICBzY2hlbWE6IHtcclxuICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgIGludml0ZUNvZGU6IHtcclxuICAgICAgICAgICAgICAgIHR5cGU6IFwic3RyaW5nXCJcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJpbnZpdGVDb2RlXCJdXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgZXhhbXBsZXM6IHtcclxuICAgICAgICAgICAgXCJEZWZhdWx0XCI6IHtcclxuICAgICAgICAgICAgICB2YWx1ZToge1xyXG4gICAgICAgICAgICAgICAgaW52aXRlQ29kZTogXCI1NjQ0NDQ0XCJcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgKi9cclxuICBjb25zdCB7IGludml0ZUNvZGUgfSA9IHJlcS5ib2R5O1xyXG5cclxuICBpZiAoIWludml0ZUNvZGUpXHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLnNlbmQoeyBtZXNzYWdlOiAnSW52aXRhdGlvbiBDb2RlIGlzIHJlcXVpcmVkJyB9KTtcclxuXHJcbiAgdHJ5IHtcclxuICAgIGF3YWl0IHJlcS5jbGllbnQuam9pbkdyb3VwKGludml0ZUNvZGUpO1xyXG4gICAgcmVzLnN0YXR1cygyMDEpLmpzb24oe1xyXG4gICAgICBzdGF0dXM6ICdzdWNjZXNzJyxcclxuICAgICAgcmVzcG9uc2U6IHtcclxuICAgICAgICBtZXNzYWdlOiAnVGhlIGluZm9ybWVkIGNvbnRhY3QocykgZW50ZXJlZCB0aGUgZ3JvdXAgc3VjY2Vzc2Z1bGx5JyxcclxuICAgICAgICBjb250YWN0OiBpbnZpdGVDb2RlLFxyXG4gICAgICB9LFxyXG4gICAgfSk7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIHJlcS5sb2dnZXIuZXJyb3IoZXJyb3IpO1xyXG4gICAgcmVzLnN0YXR1cyg1MDApLmpzb24oe1xyXG4gICAgICBzdGF0dXM6ICdlcnJvcicsXHJcbiAgICAgIG1lc3NhZ2U6ICdUaGUgaW5mb3JtZWQgY29udGFjdChzKSBkaWQgbm90IGpvaW4gdGhlIGdyb3VwIHN1Y2Nlc3NmdWxseScsXHJcbiAgICAgIGVycm9yOiBlcnJvcixcclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNyZWF0ZUdyb3VwKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSkge1xyXG4gIC8qKlxyXG4gICAgICNzd2FnZ2VyLnRhZ3MgPSBbXCJHcm91cFwiXVxyXG4gICAgICNzd2FnZ2VyLmF1dG9Cb2R5PWZhbHNlXHJcbiAgICAgI3N3YWdnZXIuc2VjdXJpdHkgPSBbe1xyXG4gICAgICAgICAgICBcImJlYXJlckF1dGhcIjogW11cclxuICAgICB9XVxyXG4gICAgICNzd2FnZ2VyLnBhcmFtZXRlcnNbXCJzZXNzaW9uXCJdID0ge1xyXG4gICAgICBzY2hlbWE6ICdORVJEV0hBVFNfQU1FUklDQSdcclxuICAgICB9XHJcbiAgICAgI3N3YWdnZXIucmVxdWVzdEJvZHkgPSB7XHJcbiAgICAgIHJlcXVpcmVkOiB0cnVlLFxyXG4gICAgICBjb250ZW50OiB7XHJcbiAgICAgICAgXCJhcHBsaWNhdGlvbi9qc29uXCI6IHtcclxuICAgICAgICAgIHNjaGVtYToge1xyXG4gICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgcGFydGljaXBhbnRzOiB7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiBcImFycmF5XCIsXHJcbiAgICAgICAgICAgICAgICBpdGVtczoge1xyXG4gICAgICAgICAgICAgICAgICB0eXBlOiBcInN0cmluZ1wiXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICBuYW1lOiB7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiBcInN0cmluZ1wiXHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICByZXF1aXJlZDogW1wicGFydGljaXBhbnRzXCIsIFwibmFtZVwiXVxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIGV4YW1wbGVzOiB7XHJcbiAgICAgICAgICAgIFwiRGVmYXVsdFwiOiB7XHJcbiAgICAgICAgICAgICAgdmFsdWU6IHtcclxuICAgICAgICAgICAgICAgIHBhcnRpY2lwYW50czogW1wiNTUyMTk5OTk5OTk5OVwiXSxcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwiR3JvdXAgbmFtZVwiXHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICovXHJcbiAgY29uc3QgeyBwYXJ0aWNpcGFudHMsIG5hbWUgfSA9IHJlcS5ib2R5O1xyXG5cclxuICB0cnkge1xyXG4gICAgbGV0IHJlc3BvbnNlID0ge307XHJcbiAgICBjb25zdCBpbmZvR3JvdXA6IGFueSA9IFtdO1xyXG5cclxuICAgIGZvciAoY29uc3QgZ3JvdXAgb2YgZ3JvdXBOYW1lVG9BcnJheShuYW1lKSkge1xyXG4gICAgICByZXNwb25zZSA9IGF3YWl0IHJlcS5jbGllbnQuY3JlYXRlR3JvdXAoXHJcbiAgICAgICAgZ3JvdXAsXHJcbiAgICAgICAgY29udGFjdFRvQXJyYXkocGFydGljaXBhbnRzKVxyXG4gICAgICApO1xyXG4gICAgICBpbmZvR3JvdXAucHVzaCh7XHJcbiAgICAgICAgbmFtZTogZ3JvdXAsXHJcbiAgICAgICAgaWQ6IChyZXNwb25zZSBhcyBhbnkpLmdpZC51c2VyLFxyXG4gICAgICAgIHBhcnRpY2lwYW50czogKHJlc3BvbnNlIGFzIGFueSkucGFydGljaXBhbnRzLFxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBncm91cExpbmsgPSBhd2FpdCByZXEuY2xpZW50LmdldEdyb3VwSW52aXRlTGluayhcclxuICAgICAgKHJlc3BvbnNlIGFzIGFueSkuZ2lkLl9zZXJpYWxpemVkXHJcbiAgICApO1xyXG5cclxuICAgIE9iamVjdC5rZXlzKChyZXNwb25zZSBhcyBhbnkpLnBhcnRpY2lwYW50cykuZm9yRWFjaChhc3luYyAoaykgPT4ge1xyXG4gICAgICBjb25zdCBjb2RlID0gKHJlc3BvbnNlIGFzIGFueSkucGFydGljaXBhbnRzW2tdLmludml0ZV9jb2RlO1xyXG5cclxuICAgICAgaWYgKGNvZGUpIHtcclxuICAgICAgICBhd2FpdCByZXEuY2xpZW50LnNlbmRUZXh0KFxyXG4gICAgICAgICAgayxcclxuICAgICAgICAgIGBFbnRyZSBubyBncnVwbyBcIiR7bmFtZX1cIiBhY2Vzc2FuZG8gbyBsaW5rOiAke2dyb3VwTGlua31gLFxyXG4gICAgICAgICAge31cclxuICAgICAgICApO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cygyMDEpLmpzb24oe1xyXG4gICAgICBzdGF0dXM6ICdzdWNjZXNzJyxcclxuICAgICAgcmVzcG9uc2U6IHtcclxuICAgICAgICBtZXNzYWdlOiAnR3JvdXAocykgY3JlYXRlZCBzdWNjZXNzZnVsbHknLFxyXG4gICAgICAgIGdyb3VwOiBuYW1lLFxyXG4gICAgICAgIGdyb3VwSW5mbzogaW5mb0dyb3VwLFxyXG4gICAgICB9LFxyXG4gICAgfSk7XHJcbiAgfSBjYXRjaCAoZSkge1xyXG4gICAgcmVxLmxvZ2dlci5lcnJvcihlKTtcclxuICAgIHJldHVybiByZXNcclxuICAgICAgLnN0YXR1cyg1MDApXHJcbiAgICAgIC5qc29uKHsgc3RhdHVzOiAnZXJyb3InLCBtZXNzYWdlOiAnRXJyb3IgY3JlYXRpbmcgZ3JvdXAocyknLCBlcnJvcjogZSB9KTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBsZWF2ZUdyb3VwKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSkge1xyXG4gIC8qKlxyXG4gICAgICNzd2FnZ2VyLnRhZ3MgPSBbXCJHcm91cFwiXVxyXG4gICAgICNzd2FnZ2VyLmF1dG9Cb2R5PWZhbHNlXHJcbiAgICAgI3N3YWdnZXIuc2VjdXJpdHkgPSBbe1xyXG4gICAgICAgICAgICBcImJlYXJlckF1dGhcIjogW11cclxuICAgICB9XVxyXG4gICAgICNzd2FnZ2VyLnBhcmFtZXRlcnNbXCJzZXNzaW9uXCJdID0ge1xyXG4gICAgICBzY2hlbWE6ICdORVJEV0hBVFNfQU1FUklDQSdcclxuICAgICB9XHJcbiAgICAgI3N3YWdnZXIucmVxdWVzdEJvZHkgPSB7XHJcbiAgICAgIHJlcXVpcmVkOiB0cnVlLFxyXG4gICAgICBcIkBjb250ZW50XCI6IHtcclxuICAgICAgICBcImFwcGxpY2F0aW9uL2pzb25cIjoge1xyXG4gICAgICAgICAgc2NoZW1hOiB7XHJcbiAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICBncm91cElkOiB7IHR5cGU6IFwic3RyaW5nXCIgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICByZXF1aXJlZDogW1wiZ3JvdXBJZFwiXVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAqL1xyXG4gIGNvbnN0IHsgZ3JvdXBJZCB9ID0gcmVxLmJvZHk7XHJcblxyXG4gIHRyeSB7XHJcbiAgICBmb3IgKGNvbnN0IGdyb3VwIG9mIGdyb3VwVG9BcnJheShncm91cElkKSkge1xyXG4gICAgICBhd2FpdCByZXEuY2xpZW50LmxlYXZlR3JvdXAoZ3JvdXApO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7XHJcbiAgICAgIHN0YXR1czogJ3N1Y2Nlc3MnLFxyXG4gICAgICByZXNwb25zZTogeyBtZXNzYWdlczogJ1ZvY8OqIHNhaXUgZG8gZ3J1cG8gY29tIHN1Y2Vzc28nLCBncm91cDogZ3JvdXBJZCB9LFxyXG4gICAgfSk7XHJcbiAgfSBjYXRjaCAoZSkge1xyXG4gICAgcmVxLmxvZ2dlci5lcnJvcihlKTtcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7XHJcbiAgICAgIHN0YXR1czogJ2Vycm9yJyxcclxuICAgICAgbWVzc2FnZTogJ0Vycm8gYW8gc2FpciBkbyhzKSBncnVwbyhzKScsXHJcbiAgICAgIGVycm9yOiBlLFxyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0R3JvdXBNZW1iZXJzKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSkge1xyXG4gIC8qKlxyXG4gICAgICNzd2FnZ2VyLnRhZ3MgPSBbXCJHcm91cFwiXVxyXG4gICAgICNzd2FnZ2VyLmF1dG9Cb2R5PWZhbHNlXHJcbiAgICAgI3N3YWdnZXIuc2VjdXJpdHkgPSBbe1xyXG4gICAgICAgICAgICBcImJlYXJlckF1dGhcIjogW11cclxuICAgICB9XVxyXG4gICAgICNzd2FnZ2VyLnBhcmFtZXRlcnNbXCJzZXNzaW9uXCJdID0ge1xyXG4gICAgICBzY2hlbWE6ICdORVJEV0hBVFNfQU1FUklDQSdcclxuICAgICB9XHJcbiAgICAgI3N3YWdnZXIucmVxdWVzdEJvZHkgPSB7XHJcbiAgICAgIHJlcXVpcmVkOiB0cnVlLFxyXG4gICAgICBjb250ZW50OiB7XHJcbiAgICAgICAgXCJhcHBsaWNhdGlvbi9qc29uXCI6IHtcclxuICAgICAgICAgIHNjaGVtYToge1xyXG4gICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgZ3JvdXBJZDogeyB0eXBlOiBcInN0cmluZ1wiIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgcmVxdWlyZWQ6IFtcImdyb3VwSWRcIl1cclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICBleGFtcGxlczoge1xyXG4gICAgICAgICAgICBcIkRlZmF1bHRcIjoge1xyXG4gICAgICAgICAgICAgIHZhbHVlOiB7XHJcbiAgICAgICAgICAgICAgICBncm91cElkOiBcIjxncm91cElkPlwiXHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICovXHJcbiAgY29uc3QgeyBncm91cElkIH0gPSByZXEucGFyYW1zO1xyXG5cclxuICB0cnkge1xyXG4gICAgbGV0IHJlc3BvbnNlID0ge307XHJcbiAgICBmb3IgKGNvbnN0IGdyb3VwIG9mIGdyb3VwVG9BcnJheShncm91cElkKSkge1xyXG4gICAgICByZXNwb25zZSA9IGF3YWl0IHJlcS5jbGllbnQuZ2V0R3JvdXBNZW1iZXJzKGdyb3VwKTtcclxuICAgIH1cclxuICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7IHN0YXR1czogJ3N1Y2Nlc3MnLCByZXNwb25zZTogcmVzcG9uc2UgfSk7XHJcbiAgfSBjYXRjaCAoZSkge1xyXG4gICAgcmVxLmxvZ2dlci5lcnJvcihlKTtcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7XHJcbiAgICAgIHN0YXR1czogJ2Vycm9yJyxcclxuICAgICAgbWVzc2FnZTogJ0Vycm9yIG9uIGdldCBncm91cCBtZW1iZXJzJyxcclxuICAgICAgZXJyb3I6IGUsXHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBhZGRQYXJ0aWNpcGFudChyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpIHtcclxuICAvKipcclxuICAgICAjc3dhZ2dlci50YWdzID0gW1wiR3JvdXBcIl1cclxuICAgICAjc3dhZ2dlci5hdXRvQm9keT1mYWxzZVxyXG4gICAgICNzd2FnZ2VyLnNlY3VyaXR5ID0gW3tcclxuICAgICAgICAgICAgXCJiZWFyZXJBdXRoXCI6IFtdXHJcbiAgICAgfV1cclxuICAgICAjc3dhZ2dlci5wYXJhbWV0ZXJzW1wic2Vzc2lvblwiXSA9IHtcclxuICAgICAgc2NoZW1hOiAnTkVSRFdIQVRTX0FNRVJJQ0EnXHJcbiAgICAgfVxyXG4gICAgICNzd2FnZ2VyLnJlcXVlc3RCb2R5ID0ge1xyXG4gICAgICByZXF1aXJlZDogdHJ1ZSxcclxuICAgICAgY29udGVudDoge1xyXG4gICAgICAgIFwiYXBwbGljYXRpb24vanNvblwiOiB7XHJcbiAgICAgICAgICBzY2hlbWE6IHtcclxuICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgIGdyb3VwSWQ6IHsgdHlwZTogXCJzdHJpbmdcIiB9LFxyXG4gICAgICAgICAgICAgIHBob25lOiB7IHR5cGU6IFwic3RyaW5nXCIgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICByZXF1aXJlZDogW1wiZ3JvdXBJZFwiLCBcInBob25lXCJdXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgZXhhbXBsZXM6IHtcclxuICAgICAgICAgICAgXCJEZWZhdWx0XCI6IHtcclxuICAgICAgICAgICAgICB2YWx1ZToge1xyXG4gICAgICAgICAgICAgICAgZ3JvdXBJZDogXCI8Z3JvdXBJZD5cIixcclxuICAgICAgICAgICAgICAgIHBob25lOiBcIjU1MjE5OTk5OTk5OTlcIlxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAqL1xyXG4gIGNvbnN0IHsgZ3JvdXBJZCwgcGhvbmUgfSA9IHJlcS5ib2R5O1xyXG5cclxuICB0cnkge1xyXG4gICAgbGV0IHJlc3BvbnNlID0ge307XHJcbiAgICBjb25zdCBhcnJheUdyb3VwczogYW55ID0gW107XHJcblxyXG4gICAgZm9yIChjb25zdCBncm91cCBvZiBncm91cFRvQXJyYXkoZ3JvdXBJZCkpIHtcclxuICAgICAgcmVzcG9uc2UgPSBhd2FpdCByZXEuY2xpZW50LmFkZFBhcnRpY2lwYW50KGdyb3VwLCBjb250YWN0VG9BcnJheShwaG9uZSkpO1xyXG4gICAgICBhcnJheUdyb3Vwcy5wdXNoKHJlc3BvbnNlKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cygyMDEpLmpzb24oe1xyXG4gICAgICBzdGF0dXM6ICdzdWNjZXNzJyxcclxuICAgICAgcmVzcG9uc2U6IHtcclxuICAgICAgICBtZXNzYWdlOiAnQWRkaXRpb24gdG8gZ3JvdXAgYXR0ZW1wdGVkLicsXHJcbiAgICAgICAgcGFydGljaXBhbnRzOiBwaG9uZSxcclxuICAgICAgICBncm91cHM6IGdyb3VwVG9BcnJheShncm91cElkKSxcclxuICAgICAgICByZXN1bHQ6IGFycmF5R3JvdXBzLFxyXG4gICAgICB9LFxyXG4gICAgfSk7XHJcbiAgfSBjYXRjaCAoZSkge1xyXG4gICAgcmVxLmxvZ2dlci5lcnJvcihlKTtcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7XHJcbiAgICAgIHN0YXR1czogJ2Vycm9yJyxcclxuICAgICAgbWVzc2FnZTogJ0Vycm9yIGFkZGluZyBwYXJ0aWNpcGFudChzKScsXHJcbiAgICAgIGVycm9yOiBlLFxyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVtb3ZlUGFydGljaXBhbnQocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKSB7XHJcbiAgLyoqXHJcbiAgICAgI3N3YWdnZXIudGFncyA9IFtcIkdyb3VwXCJdXHJcbiAgICAgI3N3YWdnZXIuYXV0b0JvZHk9ZmFsc2VcclxuICAgICAjc3dhZ2dlci5zZWN1cml0eSA9IFt7XHJcbiAgICAgICAgICAgIFwiYmVhcmVyQXV0aFwiOiBbXVxyXG4gICAgIH1dXHJcbiAgICAgI3N3YWdnZXIucGFyYW1ldGVyc1tcInNlc3Npb25cIl0gPSB7XHJcbiAgICAgIHNjaGVtYTogJ05FUkRXSEFUU19BTUVSSUNBJ1xyXG4gICAgIH1cclxuICAgICAjc3dhZ2dlci5yZXF1ZXN0Qm9keSA9IHtcclxuICAgICAgcmVxdWlyZWQ6IHRydWUsXHJcbiAgICAgIFwiQGNvbnRlbnRcIjoge1xyXG4gICAgICAgIFwiYXBwbGljYXRpb24vanNvblwiOiB7XHJcbiAgICAgICAgICBzY2hlbWE6IHtcclxuICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgIFwiZ3JvdXBJZFwiOiB7IHR5cGU6IFwic3RyaW5nXCIgfSxcclxuICAgICAgICAgICAgICBcInBob25lXCI6IHsgdHlwZTogXCJzdHJpbmdcIiB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJncm91cElkXCIsIFwicGhvbmVcIl1cclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICBleGFtcGxlczoge1xyXG4gICAgICAgICAgICBcIkRlZmF1bHRcIjoge1xyXG4gICAgICAgICAgICAgIHZhbHVlOiB7XHJcbiAgICAgICAgICAgICAgICBcImdyb3VwSWRcIjogXCI8Z3JvdXBJZD5cIixcclxuICAgICAgICAgICAgICAgIFwicGhvbmVcIjogXCI1NTIxOTk5OTk5OTk5XCJcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgKi9cclxuICBjb25zdCB7IGdyb3VwSWQsIHBob25lIH0gPSByZXEuYm9keTtcclxuXHJcbiAgdHJ5IHtcclxuICAgIGxldCByZXNwb25zZSA9IHt9O1xyXG4gICAgY29uc3QgYXJyYXlHcm91cHM6IGFueSA9IFtdO1xyXG5cclxuICAgIGZvciAoY29uc3QgZ3JvdXAgb2YgZ3JvdXBUb0FycmF5KGdyb3VwSWQpKSB7XHJcbiAgICAgIHJlc3BvbnNlID0gYXdhaXQgcmVxLmNsaWVudC5yZW1vdmVQYXJ0aWNpcGFudChcclxuICAgICAgICBncm91cCxcclxuICAgICAgICBjb250YWN0VG9BcnJheShwaG9uZSlcclxuICAgICAgKTtcclxuICAgICAgYXJyYXlHcm91cHMucHVzaChyZXNwb25zZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHtcclxuICAgICAgc3RhdHVzOiAnc3VjY2VzcycsXHJcbiAgICAgIHJlc3BvbnNlOiB7XHJcbiAgICAgICAgbWVzc2FnZTogJ1BhcnRpY2lwYW50KHMpIHJlbW92ZWQgc3VjY2Vzc2Z1bGx5JyxcclxuICAgICAgICBwYXJ0aWNpcGFudHM6IHBob25lLFxyXG4gICAgICAgIGdyb3VwczogYXJyYXlHcm91cHMsXHJcbiAgICAgIH0sXHJcbiAgICB9KTtcclxuICB9IGNhdGNoIChlKSB7XHJcbiAgICByZXEubG9nZ2VyLmVycm9yKGUpO1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgc3RhdHVzOiAnZXJyb3InLFxyXG4gICAgICBtZXNzYWdlOiAnRXJyb3IgcmVtb3ZpbmcgcGFydGljaXBhbnQocyknLFxyXG4gICAgICBlcnJvcjogZSxcclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHByb21vdGVQYXJ0aWNpcGFudChyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpIHtcclxuICAvKipcclxuICAgICAjc3dhZ2dlci50YWdzID0gW1wiR3JvdXBcIl1cclxuICAgICAjc3dhZ2dlci5hdXRvQm9keT1mYWxzZVxyXG4gICAgICNzd2FnZ2VyLnNlY3VyaXR5ID0gW3tcclxuICAgICAgICAgICAgXCJiZWFyZXJBdXRoXCI6IFtdXHJcbiAgICAgfV1cclxuICAgICAjc3dhZ2dlci5wYXJhbWV0ZXJzW1wic2Vzc2lvblwiXSA9IHtcclxuICAgICAgc2NoZW1hOiAnTkVSRFdIQVRTX0FNRVJJQ0EnXHJcbiAgICAgfVxyXG4gICAgICNzd2FnZ2VyLnJlcXVlc3RCb2R5ID0ge1xyXG4gICAgICByZXF1aXJlZDogdHJ1ZSxcclxuICAgICAgXCJAY29udGVudFwiOiB7XHJcbiAgICAgICAgXCJhcHBsaWNhdGlvbi9qc29uXCI6IHtcclxuICAgICAgICAgIHNjaGVtYToge1xyXG4gICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgXCJncm91cElkXCI6IHsgdHlwZTogXCJzdHJpbmdcIiB9LFxyXG4gICAgICAgICAgICAgIFwicGhvbmVcIjogeyB0eXBlOiBcInN0cmluZ1wiIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgcmVxdWlyZWQ6IFtcImdyb3VwSWRcIiwgXCJwaG9uZVwiXVxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIGV4YW1wbGVzOiB7XHJcbiAgICAgICAgICAgIFwiRGVmYXVsdFwiOiB7XHJcbiAgICAgICAgICAgICAgdmFsdWU6IHtcclxuICAgICAgICAgICAgICAgIFwiZ3JvdXBJZFwiOiBcIjxncm91cElkPlwiLFxyXG4gICAgICAgICAgICAgICAgXCJwaG9uZVwiOiBcIjU1MjE5OTk5OTk5OTlcIlxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAqL1xyXG4gIGNvbnN0IHsgZ3JvdXBJZCwgcGhvbmUgfSA9IHJlcS5ib2R5O1xyXG5cclxuICB0cnkge1xyXG4gICAgY29uc3QgYXJyYXlHcm91cHM6IGFueSA9IFtdO1xyXG4gICAgZm9yIChjb25zdCBncm91cCBvZiBncm91cFRvQXJyYXkoZ3JvdXBJZCkpIHtcclxuICAgICAgYXdhaXQgcmVxLmNsaWVudC5wcm9tb3RlUGFydGljaXBhbnQoZ3JvdXAsIGNvbnRhY3RUb0FycmF5KHBob25lKSk7XHJcbiAgICAgIGFycmF5R3JvdXBzLnB1c2goZ3JvdXApO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiByZXMuc3RhdHVzKDIwMSkuanNvbih7XHJcbiAgICAgIHN0YXR1czogJ3N1Y2Nlc3MnLFxyXG4gICAgICByZXNwb25zZToge1xyXG4gICAgICAgIG1lc3NhZ2U6ICdTdWNjZXNzZnVsIHByb21vdGVkIHBhcnRpY2lwYW50KHMpJyxcclxuICAgICAgICBwYXJ0aWNpcGFudHM6IHBob25lLFxyXG4gICAgICAgIGdyb3VwczogYXJyYXlHcm91cHMsXHJcbiAgICAgIH0sXHJcbiAgICB9KTtcclxuICB9IGNhdGNoIChlKSB7XHJcbiAgICByZXEubG9nZ2VyLmVycm9yKGUpO1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgc3RhdHVzOiAnZXJyb3InLFxyXG4gICAgICBtZXNzYWdlOiAnRXJyb3IgcHJvbW90aW5nIHBhcnRpY2lwYW50KHMpJyxcclxuICAgICAgZXJyb3I6IGUsXHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBkZW1vdGVQYXJ0aWNpcGFudChyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpIHtcclxuICAvKipcclxuICAgICAjc3dhZ2dlci50YWdzID0gW1wiR3JvdXBcIl1cclxuICAgICAjc3dhZ2dlci5hdXRvQm9keT1mYWxzZVxyXG4gICAgICNzd2FnZ2VyLnNlY3VyaXR5ID0gW3tcclxuICAgICAgICAgICAgXCJiZWFyZXJBdXRoXCI6IFtdXHJcbiAgICAgfV1cclxuICAgICAjc3dhZ2dlci5wYXJhbWV0ZXJzW1wic2Vzc2lvblwiXSA9IHtcclxuICAgICAgc2NoZW1hOiAnTkVSRFdIQVRTX0FNRVJJQ0EnXHJcbiAgICAgfVxyXG4gICAgICNzd2FnZ2VyLnJlcXVlc3RCb2R5ID0ge1xyXG4gICAgICByZXF1aXJlZDogdHJ1ZSxcclxuICAgICAgXCJAY29udGVudFwiOiB7XHJcbiAgICAgICAgXCJhcHBsaWNhdGlvbi9qc29uXCI6IHtcclxuICAgICAgICAgIHNjaGVtYToge1xyXG4gICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgXCJncm91cElkXCI6IHsgdHlwZTogXCJzdHJpbmdcIiB9LFxyXG4gICAgICAgICAgICAgIFwicGhvbmVcIjogeyB0eXBlOiBcInN0cmluZ1wiIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgcmVxdWlyZWQ6IFtcImdyb3VwSWRcIiwgXCJwaG9uZVwiXVxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIGV4YW1wbGVzOiB7XHJcbiAgICAgICAgICAgIFwiRGVmYXVsdFwiOiB7XHJcbiAgICAgICAgICAgICAgdmFsdWU6IHtcclxuICAgICAgICAgICAgICAgIFwiZ3JvdXBJZFwiOiBcIjxncm91cElkPlwiLFxyXG4gICAgICAgICAgICAgICAgXCJwaG9uZVwiOiBcIjU1MjE5OTk5OTk5OTlcIlxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAqL1xyXG4gIGNvbnN0IHsgZ3JvdXBJZCwgcGhvbmUgfSA9IHJlcS5ib2R5O1xyXG5cclxuICB0cnkge1xyXG4gICAgY29uc3QgYXJyYXlHcm91cHM6IGFueSA9IFtdO1xyXG4gICAgZm9yIChjb25zdCBncm91cCBvZiBncm91cFRvQXJyYXkoZ3JvdXBJZCkpIHtcclxuICAgICAgYXdhaXQgcmVxLmNsaWVudC5kZW1vdGVQYXJ0aWNpcGFudChncm91cCwgY29udGFjdFRvQXJyYXkocGhvbmUpKTtcclxuICAgICAgYXJyYXlHcm91cHMucHVzaChncm91cCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAxKS5qc29uKHtcclxuICAgICAgc3RhdHVzOiAnc3VjY2VzcycsXHJcbiAgICAgIHJlc3BvbnNlOiB7XHJcbiAgICAgICAgbWVzc2FnZTogJ0FkbWluIG9mIHBhcnRpY2lwYW50KHMpIHJldm9rZWQgc3VjY2Vzc2Z1bGx5JyxcclxuICAgICAgICBwYXJ0aWNpcGFudHM6IHBob25lLFxyXG4gICAgICAgIGdyb3VwczogYXJyYXlHcm91cHMsXHJcbiAgICAgIH0sXHJcbiAgICB9KTtcclxuICB9IGNhdGNoIChlKSB7XHJcbiAgICByZXEubG9nZ2VyLmVycm9yKGUpO1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgc3RhdHVzOiAnZXJyb3InLFxyXG4gICAgICBtZXNzYWdlOiBcIkVycm9yIHJldm9raW5nIHBhcnRpY2lwYW50J3MgYWRtaW4ocylcIixcclxuICAgICAgZXJyb3I6IGUsXHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRHcm91cEFkbWlucyhyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpIHtcclxuICAvKipcclxuICAgICAjc3dhZ2dlci50YWdzID0gW1wiR3JvdXBcIl1cclxuICAgICAjc3dhZ2dlci5hdXRvQm9keT1mYWxzZVxyXG4gICAgICNzd2FnZ2VyLnNlY3VyaXR5ID0gW3tcclxuICAgICAgICAgICAgXCJiZWFyZXJBdXRoXCI6IFtdXHJcbiAgICAgfV1cclxuICAgICAjc3dhZ2dlci5wYXJhbWV0ZXJzW1wic2Vzc2lvblwiXSA9IHtcclxuICAgICAgc2NoZW1hOiAnTkVSRFdIQVRTX0FNRVJJQ0EnXHJcbiAgICAgfVxyXG4gICAgICNzd2FnZ2VyLnJlcXVlc3RCb2R5ID0ge1xyXG4gICAgICByZXF1aXJlZDogdHJ1ZSxcclxuICAgICAgXCJAY29udGVudFwiOiB7XHJcbiAgICAgICAgXCJhcHBsaWNhdGlvbi9qc29uXCI6IHtcclxuICAgICAgICAgIHNjaGVtYToge1xyXG4gICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgXCJncm91cElkXCI6IHsgdHlwZTogXCJzdHJpbmdcIiB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJncm91cElkXCJdXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgZXhhbXBsZXM6IHtcclxuICAgICAgICAgICAgXCJEZWZhdWx0XCI6IHtcclxuICAgICAgICAgICAgICB2YWx1ZToge1xyXG4gICAgICAgICAgICAgICAgXCJncm91cElkXCI6IFwiPGdyb3VwSWQ+XCJcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgKi9cclxuICBjb25zdCB7IGdyb3VwSWQgfSA9IHJlcS5wYXJhbXM7XHJcblxyXG4gIHRyeSB7XHJcbiAgICBsZXQgcmVzcG9uc2UgPSB7fTtcclxuICAgIGNvbnN0IGFycmF5R3JvdXBzOiBhbnkgPSBbXTtcclxuXHJcbiAgICBmb3IgKGNvbnN0IGdyb3VwIG9mIGdyb3VwVG9BcnJheShncm91cElkKSkge1xyXG4gICAgICByZXNwb25zZSA9IGF3YWl0IHJlcS5jbGllbnQuZ2V0R3JvdXBBZG1pbnMoZ3JvdXApO1xyXG4gICAgICBhcnJheUdyb3Vwcy5wdXNoKHJlc3BvbnNlKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oeyBzdGF0dXM6ICdzdWNjZXNzJywgcmVzcG9uc2U6IGFycmF5R3JvdXBzIH0pO1xyXG4gIH0gY2F0Y2ggKGUpIHtcclxuICAgIHJlcS5sb2dnZXIuZXJyb3IoZSk7XHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oe1xyXG4gICAgICBzdGF0dXM6ICdlcnJvcicsXHJcbiAgICAgIG1lc3NhZ2U6ICdFcnJvciByZXRyaWV2aW5nIGdyb3VwIGFkbWluKHMpJyxcclxuICAgICAgZXJyb3I6IGUsXHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRHcm91cEludml0ZUxpbmsocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKSB7XHJcbiAgLyoqXHJcbiAgICAgI3N3YWdnZXIudGFncyA9IFtcIkdyb3VwXCJdXHJcbiAgICAgI3N3YWdnZXIuYXV0b0JvZHk9ZmFsc2VcclxuICAgICAjc3dhZ2dlci5zZWN1cml0eSA9IFt7XHJcbiAgICAgICAgICAgIFwiYmVhcmVyQXV0aFwiOiBbXVxyXG4gICAgIH1dXHJcbiAgICAgI3N3YWdnZXIucGFyYW1ldGVyc1tcInNlc3Npb25cIl0gPSB7XHJcbiAgICAgIHNjaGVtYTogJ05FUkRXSEFUU19BTUVSSUNBJ1xyXG4gICAgIH1cclxuICAgICAjc3dhZ2dlci5yZXF1ZXN0Qm9keSA9IHtcclxuICAgICAgcmVxdWlyZWQ6IHRydWUsXHJcbiAgICAgIFwiQGNvbnRlbnRcIjoge1xyXG4gICAgICAgIFwiYXBwbGljYXRpb24vanNvblwiOiB7XHJcbiAgICAgICAgICBzY2hlbWE6IHtcclxuICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgIGdyb3VwSWQ6IHsgdHlwZTogXCJzdHJpbmdcIiB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgKi9cclxuICBjb25zdCB7IGdyb3VwSWQgfSA9IHJlcS5wYXJhbXM7XHJcbiAgdHJ5IHtcclxuICAgIGxldCByZXNwb25zZSA9IHt9O1xyXG4gICAgZm9yIChjb25zdCBncm91cCBvZiBncm91cFRvQXJyYXkoZ3JvdXBJZCkpIHtcclxuICAgICAgcmVzcG9uc2UgPSBhd2FpdCByZXEuY2xpZW50LmdldEdyb3VwSW52aXRlTGluayhncm91cCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHsgc3RhdHVzOiAnc3VjY2VzcycsIHJlc3BvbnNlOiByZXNwb25zZSB9KTtcclxuICB9IGNhdGNoIChlKSB7XHJcbiAgICByZXEubG9nZ2VyLmVycm9yKGUpO1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgc3RhdHVzOiAnZXJyb3InLFxyXG4gICAgICBtZXNzYWdlOiAnRXJyb3Igb24gZ2V0IGdyb3VwIGludml0ZSBsaW5rJyxcclxuICAgICAgZXJyb3I6IGUsXHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZXZva2VHcm91cEludml0ZUxpbmsocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKSB7XHJcbiAgLyoqXHJcbiAgICAgI3N3YWdnZXIudGFncyA9IFtcIkdyb3VwXCJdXHJcbiAgICAgI3N3YWdnZXIuYXV0b0JvZHk9ZmFsc2VcclxuICAgICAjc3dhZ2dlci5zZWN1cml0eSA9IFt7XHJcbiAgICAgICAgICAgIFwiYmVhcmVyQXV0aFwiOiBbXVxyXG4gICAgIH1dXHJcbiAgICAgI3N3YWdnZXIucGFyYW1ldGVyc1tcInNlc3Npb25cIl0gPSB7XHJcbiAgICAgIHNjaGVtYTogJ05FUkRXSEFUU19BTUVSSUNBJ1xyXG4gICAgIH1cclxuICAgICAjc3dhZ2dlci5yZXF1ZXN0Qm9keSA9IHtcclxuICAgICAgcmVxdWlyZWQ6IHRydWUsXHJcbiAgICAgIFwiQGNvbnRlbnRcIjoge1xyXG4gICAgICAgIFwiYXBwbGljYXRpb24vanNvblwiOiB7XHJcbiAgICAgICAgICBzY2hlbWE6IHtcclxuICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICRncm91cElkOiB7IHR5cGU6IFwic3RyaW5nXCIgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICovXHJcbiAgY29uc3QgeyBncm91cElkIH0gPSByZXEucGFyYW1zO1xyXG5cclxuICBsZXQgcmVzcG9uc2UgPSB7fTtcclxuXHJcbiAgdHJ5IHtcclxuICAgIGZvciAoY29uc3QgZ3JvdXAgb2YgZ3JvdXBUb0FycmF5KGdyb3VwSWQpKSB7XHJcbiAgICAgIHJlc3BvbnNlID0gYXdhaXQgcmVxLmNsaWVudC5yZXZva2VHcm91cEludml0ZUxpbmsoZ3JvdXApO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7XHJcbiAgICAgIHN0YXR1czogJ1N1Y2Nlc3MnLFxyXG4gICAgICByZXNwb25zZTogcmVzcG9uc2UsXHJcbiAgICB9KTtcclxuICB9IGNhdGNoIChlKSB7XHJcbiAgICByZXEubG9nZ2VyLmVycm9yKGUpO1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHtcclxuICAgICAgc3RhdHVzOiAnZXJyb3InLFxyXG4gICAgICBtZXNzYWdlOiAnRXJyb3Igb24gcmV2b2tlIGdyb3VwIGludml0ZSBsaW5rJyxcclxuICAgICAgZXJyb3I6IGUsXHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRBbGxCcm9hZGNhc3RMaXN0KHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSkge1xyXG4gIC8qKlxyXG4gICAgICNzd2FnZ2VyLnRhZ3MgPSBbXCJNaXNjXCJdXHJcbiAgICAgI3N3YWdnZXIuYXV0b0JvZHk9ZmFsc2VcclxuICAgICAjc3dhZ2dlci5zZWN1cml0eSA9IFt7XHJcbiAgICAgICAgICAgIFwiYmVhcmVyQXV0aFwiOiBbXVxyXG4gICAgIH1dXHJcbiAgICAgI3N3YWdnZXIucGFyYW1ldGVyc1tcInNlc3Npb25cIl0gPSB7XHJcbiAgICAgIHNjaGVtYTogJ05FUkRXSEFUU19BTUVSSUNBJ1xyXG4gICAgIH1cclxuICAgKi9cclxuICB0cnkge1xyXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCByZXEuY2xpZW50LmdldEFsbEJyb2FkY2FzdExpc3QoKTtcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7IHN0YXR1czogJ3N1Y2Nlc3MnLCByZXNwb25zZTogcmVzcG9uc2UgfSk7XHJcbiAgfSBjYXRjaCAoZSkge1xyXG4gICAgcmVxLmxvZ2dlci5lcnJvcihlKTtcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7XHJcbiAgICAgIHN0YXR1czogJ2Vycm9yJyxcclxuICAgICAgbWVzc2FnZTogJ0Vycm9yIG9uIGdldCBhbGwgYnJvYWQgY2FzdCBsaXN0JyxcclxuICAgICAgZXJyb3I6IGUsXHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRHcm91cEluZm9Gcm9tSW52aXRlTGluayhyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpIHtcclxuICAvKipcclxuICAgICAjc3dhZ2dlci50YWdzID0gW1wiR3JvdXBcIl1cclxuICAgICAjc3dhZ2dlci5hdXRvQm9keT1mYWxzZVxyXG4gICAgICNzd2FnZ2VyLnNlY3VyaXR5ID0gW3tcclxuICAgICAgICAgICAgXCJiZWFyZXJBdXRoXCI6IFtdXHJcbiAgICAgfV1cclxuICAgICAjc3dhZ2dlci5wYXJhbWV0ZXJzW1wic2Vzc2lvblwiXSA9IHtcclxuICAgICAgc2NoZW1hOiAnTkVSRFdIQVRTX0FNRVJJQ0EnXHJcbiAgICAgfVxyXG4gICAgICNzd2FnZ2VyLnJlcXVlc3RCb2R5ID0ge1xyXG4gICAgICByZXF1aXJlZDogdHJ1ZSxcclxuICAgICAgXCJAY29udGVudFwiOiB7XHJcbiAgICAgICAgXCJhcHBsaWNhdGlvbi9qc29uXCI6IHtcclxuICAgICAgICAgIHNjaGVtYToge1xyXG4gICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgJGludml0ZWNvZGU6IHsgdHlwZTogXCJzdHJpbmdcIiB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgKi9cclxuICB0cnkge1xyXG4gICAgY29uc3QgeyBpbnZpdGVjb2RlIH0gPSByZXEuYm9keTtcclxuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgcmVxLmNsaWVudC5nZXRHcm91cEluZm9Gcm9tSW52aXRlTGluayhpbnZpdGVjb2RlKTtcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7IHN0YXR1czogJ3N1Y2Nlc3MnLCByZXNwb25zZTogcmVzcG9uc2UgfSk7XHJcbiAgfSBjYXRjaCAoZSkge1xyXG4gICAgcmVxLmxvZ2dlci5lcnJvcihlKTtcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7XHJcbiAgICAgIHN0YXR1czogJ2Vycm9yJyxcclxuICAgICAgbWVzc2FnZTogJ0Vycm9yIG9uIGdldCBncm91cCBpbmZvIGZyb20gaW52aXRlIGxpbmsnLFxyXG4gICAgICBlcnJvcjogZSxcclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldEdyb3VwTWVtYmVyc0lkcyhyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpIHtcclxuICAvKipcclxuICAgICAjc3dhZ2dlci50YWdzID0gW1wiR3JvdXBcIl1cclxuICAgICAjc3dhZ2dlci5hdXRvQm9keT1mYWxzZVxyXG4gICAgICNzd2FnZ2VyLnNlY3VyaXR5ID0gW3tcclxuICAgICAgICAgICAgXCJiZWFyZXJBdXRoXCI6IFtdXHJcbiAgICAgfV1cclxuICAgICAjc3dhZ2dlci5wYXJhbWV0ZXJzW1wic2Vzc2lvblwiXSA9IHtcclxuICAgICAgc2NoZW1hOiAnTkVSRFdIQVRTX0FNRVJJQ0EnXHJcbiAgICAgfVxyXG4gICAgICNzd2FnZ2VyLnBhcmFtZXRlcnNbXCJncm91cElkXCJdID0ge1xyXG4gICAgICBzY2hlbWE6ICc8Z3JvdXBJZD4nXHJcbiAgICAgfVxyXG4gICAqL1xyXG4gIGNvbnN0IHsgZ3JvdXBJZCB9ID0gcmVxLnBhcmFtcztcclxuICBsZXQgcmVzcG9uc2UgPSB7fTtcclxuICB0cnkge1xyXG4gICAgZm9yIChjb25zdCBncm91cCBvZiBncm91cFRvQXJyYXkoZ3JvdXBJZCkpIHtcclxuICAgICAgcmVzcG9uc2UgPSBhd2FpdCByZXEuY2xpZW50LmdldEdyb3VwTWVtYmVyc0lkcyhncm91cCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oeyBzdGF0dXM6ICdzdWNjZXNzJywgcmVzcG9uc2U6IHJlc3BvbnNlIH0pO1xyXG4gIH0gY2F0Y2ggKGUpIHtcclxuICAgIHJlcS5sb2dnZXIuZXJyb3IoZSk7XHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oe1xyXG4gICAgICBzdGF0dXM6ICdlcnJvcicsXHJcbiAgICAgIG1lc3NhZ2U6ICdFcnJvciBvbiBnZXQgZ3JvdXAgbWVtYmVycyBpZHMnLFxyXG4gICAgICBlcnJvcjogZSxcclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNldEdyb3VwRGVzY3JpcHRpb24ocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKSB7XHJcbiAgLyoqXHJcbiAgICAgI3N3YWdnZXIudGFncyA9IFtcIkdyb3VwXCJdXHJcbiAgICAgI3N3YWdnZXIuYXV0b0JvZHk9ZmFsc2VcclxuICAgICAjc3dhZ2dlci5zZWN1cml0eSA9IFt7XHJcbiAgICAgICAgICAgIFwiYmVhcmVyQXV0aFwiOiBbXVxyXG4gICAgIH1dXHJcbiAgICAgI3N3YWdnZXIucGFyYW1ldGVyc1tcInNlc3Npb25cIl0gPSB7XHJcbiAgICAgIHNjaGVtYTogJ05FUkRXSEFUU19BTUVSSUNBJ1xyXG4gICAgIH1cclxuICAgICAjc3dhZ2dlci5yZXF1ZXN0Qm9keSA9IHtcclxuICAgICAgcmVxdWlyZWQ6IHRydWUsXHJcbiAgICAgIFwiQGNvbnRlbnRcIjoge1xyXG4gICAgICAgIFwiYXBwbGljYXRpb24vanNvblwiOiB7XHJcbiAgICAgICAgICBzY2hlbWE6IHtcclxuICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICRncm91cElkOiB7IHR5cGU6IFwic3RyaW5nXCIgfSxcclxuICAgICAgICAgICAgICAkZGVzY3JpcHRpb246IHsgdHlwZTogXCJzdHJpbmdcIiB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgKi9cclxuICBjb25zdCB7IGdyb3VwSWQsIGRlc2NyaXB0aW9uIH0gPSByZXEuYm9keTtcclxuXHJcbiAgbGV0IHJlc3BvbnNlID0ge307XHJcblxyXG4gIHRyeSB7XHJcbiAgICBmb3IgKGNvbnN0IGdyb3VwIG9mIGdyb3VwVG9BcnJheShncm91cElkKSkge1xyXG4gICAgICByZXNwb25zZSA9IGF3YWl0IHJlcS5jbGllbnQuc2V0R3JvdXBEZXNjcmlwdGlvbihncm91cCwgZGVzY3JpcHRpb24pO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7IHN0YXR1czogJ3N1Y2Nlc3MnLCByZXNwb25zZTogcmVzcG9uc2UgfSk7XHJcbiAgfSBjYXRjaCAoZSkge1xyXG4gICAgcmVxLmxvZ2dlci5lcnJvcihlKTtcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7XHJcbiAgICAgIHN0YXR1czogJ2Vycm9yJyxcclxuICAgICAgbWVzc2FnZTogJ0Vycm9yIG9uIHNldCBncm91cCBkZXNjcmlwdGlvbicsXHJcbiAgICAgIGVycm9yOiBlLFxyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2V0R3JvdXBQcm9wZXJ0eShyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpIHtcclxuICAvKipcclxuICAgICAjc3dhZ2dlci50YWdzID0gW1wiR3JvdXBcIl1cclxuICAgICAjc3dhZ2dlci5hdXRvQm9keT1mYWxzZVxyXG4gICAgICNzd2FnZ2VyLnNlY3VyaXR5ID0gW3tcclxuICAgICAgICAgICAgXCJiZWFyZXJBdXRoXCI6IFtdXHJcbiAgICAgfV1cclxuICAgICAjc3dhZ2dlci5wYXJhbWV0ZXJzW1wic2Vzc2lvblwiXSA9IHtcclxuICAgICAgc2NoZW1hOiAnTkVSRFdIQVRTX0FNRVJJQ0EnXHJcbiAgICAgfVxyXG4gICAgICNzd2FnZ2VyLnJlcXVlc3RCb2R5ID0ge1xyXG4gICAgICByZXF1aXJlZDogdHJ1ZSxcclxuICAgICAgXCJAY29udGVudFwiOiB7XHJcbiAgICAgICAgXCJhcHBsaWNhdGlvbi9qc29uXCI6IHtcclxuICAgICAgICAgIHNjaGVtYToge1xyXG4gICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgJGdyb3VwSWQ6IHsgdHlwZTogXCJzdHJpbmdcIiB9LFxyXG4gICAgICAgICAgICAgICRwcm9wZXJ0eTogeyB0eXBlOiBcInN0cmluZ1wiIH0sXHJcbiAgICAgICAgICAgICAgJHZhbHVlOiB7IHR5cGU6IFwiYm9vbGVhblwiIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAqL1xyXG4gIGNvbnN0IHsgZ3JvdXBJZCwgcHJvcGVydHksIHZhbHVlID0gdHJ1ZSB9ID0gcmVxLmJvZHk7XHJcblxyXG4gIGxldCByZXNwb25zZSA9IHt9O1xyXG5cclxuICB0cnkge1xyXG4gICAgZm9yIChjb25zdCBncm91cCBvZiBncm91cFRvQXJyYXkoZ3JvdXBJZCkpIHtcclxuICAgICAgcmVzcG9uc2UgPSBhd2FpdCByZXEuY2xpZW50LnNldEdyb3VwUHJvcGVydHkoZ3JvdXAsIHByb3BlcnR5LCB2YWx1ZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHsgc3RhdHVzOiAnc3VjY2VzcycsIHJlc3BvbnNlOiByZXNwb25zZSB9KTtcclxuICB9IGNhdGNoIChlKSB7XHJcbiAgICByZXEubG9nZ2VyLmVycm9yKGUpO1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgc3RhdHVzOiAnZXJyb3InLFxyXG4gICAgICBtZXNzYWdlOiAnRXJyb3Igb24gc2V0IGdyb3VwIHByb3BlcnR5JyxcclxuICAgICAgZXJyb3I6IGUsXHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzZXRHcm91cFN1YmplY3QocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKSB7XHJcbiAgLyoqXHJcbiAgICAgI3N3YWdnZXIudGFncyA9IFtcIkdyb3VwXCJdXHJcbiAgICAgI3N3YWdnZXIuYXV0b0JvZHk9ZmFsc2VcclxuICAgICAjc3dhZ2dlci5zZWN1cml0eSA9IFt7XHJcbiAgICAgICAgICAgIFwiYmVhcmVyQXV0aFwiOiBbXVxyXG4gICAgIH1dXHJcbiAgICAgI3N3YWdnZXIucGFyYW1ldGVyc1tcInNlc3Npb25cIl0gPSB7XHJcbiAgICAgIHNjaGVtYTogJ05FUkRXSEFUU19BTUVSSUNBJ1xyXG4gICAgIH1cclxuICAgICAjc3dhZ2dlci5yZXF1ZXN0Qm9keSA9IHtcclxuICAgICAgcmVxdWlyZWQ6IHRydWUsXHJcbiAgICAgIFwiQGNvbnRlbnRcIjoge1xyXG4gICAgICAgIFwiYXBwbGljYXRpb24vanNvblwiOiB7XHJcbiAgICAgICAgICBzY2hlbWE6IHtcclxuICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICRncm91cElkOiB7IHR5cGU6IFwic3RyaW5nXCIgfSxcclxuICAgICAgICAgICAgICAkdGl0bGU6IHsgdHlwZTogXCJzdHJpbmdcIiB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgKi9cclxuICBjb25zdCB7IGdyb3VwSWQsIHRpdGxlIH0gPSByZXEuYm9keTtcclxuXHJcbiAgbGV0IHJlc3BvbnNlID0ge307XHJcblxyXG4gIHRyeSB7XHJcbiAgICBmb3IgKGNvbnN0IGdyb3VwIG9mIGdyb3VwVG9BcnJheShncm91cElkKSkge1xyXG4gICAgICByZXNwb25zZSA9IGF3YWl0IHJlcS5jbGllbnQuc2V0R3JvdXBTdWJqZWN0KGdyb3VwLCB0aXRsZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHsgc3RhdHVzOiAnc3VjY2VzcycsIHJlc3BvbnNlOiByZXNwb25zZSB9KTtcclxuICB9IGNhdGNoIChlKSB7XHJcbiAgICByZXEubG9nZ2VyLmVycm9yKGUpO1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgc3RhdHVzOiAnZXJyb3InLFxyXG4gICAgICBtZXNzYWdlOiAnRXJyb3Igb24gc2V0IGdyb3VwIHN1YmplY3QnLFxyXG4gICAgICBlcnJvcjogZSxcclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNldE1lc3NhZ2VzQWRtaW5zT25seShyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpIHtcclxuICAvKipcclxuICAgICAjc3dhZ2dlci50YWdzID0gW1wiR3JvdXBcIl1cclxuICAgICAjc3dhZ2dlci5hdXRvQm9keT1mYWxzZVxyXG4gICAgICNzd2FnZ2VyLnNlY3VyaXR5ID0gW3tcclxuICAgICAgICAgICAgXCJiZWFyZXJBdXRoXCI6IFtdXHJcbiAgICAgfV1cclxuICAgICAjc3dhZ2dlci5wYXJhbWV0ZXJzW1wic2Vzc2lvblwiXSA9IHtcclxuICAgICAgc2NoZW1hOiAnTkVSRFdIQVRTX0FNRVJJQ0EnXHJcbiAgICAgfVxyXG4gICAgICNzd2FnZ2VyLnJlcXVlc3RCb2R5ID0ge1xyXG4gICAgICByZXF1aXJlZDogdHJ1ZSxcclxuICAgICAgXCJAY29udGVudFwiOiB7XHJcbiAgICAgICAgXCJhcHBsaWNhdGlvbi9qc29uXCI6IHtcclxuICAgICAgICAgIHNjaGVtYToge1xyXG4gICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgJGdyb3VwSWQ6IHsgdHlwZTogXCJzdHJpbmdcIiB9LFxyXG4gICAgICAgICAgICAgICR2YWx1ZTogeyB0eXBlOiBcImJvb2xlYW5cIiB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgKi9cclxuICBjb25zdCB7IGdyb3VwSWQsIHZhbHVlID0gdHJ1ZSB9ID0gcmVxLmJvZHk7XHJcblxyXG4gIGxldCByZXNwb25zZSA9IHt9O1xyXG5cclxuICB0cnkge1xyXG4gICAgZm9yIChjb25zdCBncm91cCBvZiBncm91cFRvQXJyYXkoZ3JvdXBJZCkpIHtcclxuICAgICAgcmVzcG9uc2UgPSBhd2FpdCByZXEuY2xpZW50LnNldE1lc3NhZ2VzQWRtaW5zT25seShncm91cCwgdmFsdWUpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7IHN0YXR1czogJ3N1Y2Nlc3MnLCByZXNwb25zZTogcmVzcG9uc2UgfSk7XHJcbiAgfSBjYXRjaCAoZSkge1xyXG4gICAgcmVxLmxvZ2dlci5lcnJvcihlKTtcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7XHJcbiAgICAgIHN0YXR1czogJ2Vycm9yJyxcclxuICAgICAgbWVzc2FnZTogJ0Vycm9yIG9uIHNldCBtZXNzYWdlcyBhZG1pbnMgb25seScsXHJcbiAgICAgIGVycm9yOiBlLFxyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY2hhbmdlUHJpdmFjeUdyb3VwKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSkge1xyXG4gIC8qKlxyXG4gICAgICNzd2FnZ2VyLnRhZ3MgPSBbXCJHcm91cFwiXVxyXG4gICAgICNzd2FnZ2VyLmF1dG9Cb2R5PWZhbHNlXHJcbiAgICAgI3N3YWdnZXIuc2VjdXJpdHkgPSBbe1xyXG4gICAgICAgICAgICBcImJlYXJlckF1dGhcIjogW11cclxuICAgICB9XVxyXG4gICAgICNzd2FnZ2VyLnBhcmFtZXRlcnNbXCJzZXNzaW9uXCJdID0ge1xyXG4gICAgICBzY2hlbWE6ICdORVJEV0hBVFNfQU1FUklDQSdcclxuICAgICB9XHJcbiAgICAgI3N3YWdnZXIucmVxdWVzdEJvZHkgPSB7XHJcbiAgICAgIHJlcXVpcmVkOiB0cnVlLFxyXG4gICAgICBcIkBjb250ZW50XCI6IHtcclxuICAgICAgICBcImFwcGxpY2F0aW9uL2pzb25cIjoge1xyXG4gICAgICAgICAgc2NoZW1hOiB7XHJcbiAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAkZ3JvdXBJZDogeyB0eXBlOiBcInN0cmluZ1wiIH0sXHJcbiAgICAgICAgICAgICAgJHN0YXR1czogeyB0eXBlOiBcImJvb2xlYW5cIiB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgKi9cclxuICBjb25zdCB7IGdyb3VwSWQsIHN0YXR1cyB9ID0gcmVxLmJvZHk7XHJcblxyXG4gIHRyeSB7XHJcbiAgICBmb3IgKGNvbnN0IGdyb3VwIG9mIGNvbnRhY3RUb0FycmF5KGdyb3VwSWQpKSB7XHJcbiAgICAgIGF3YWl0IHJlcS5jbGllbnQuc2V0R3JvdXBQcm9wZXJ0eShcclxuICAgICAgICBncm91cCxcclxuICAgICAgICAncmVzdHJpY3QnIGFzIGFueSxcclxuICAgICAgICBzdGF0dXMgPT09ICd0cnVlJ1xyXG4gICAgICApO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiByZXMuc3RhdHVzKDIwMCkuanNvbih7XHJcbiAgICAgIHN0YXR1czogJ3N1Y2Nlc3MnLFxyXG4gICAgICByZXNwb25zZTogeyBtZXNzYWdlOiAnR3JvdXAgcHJpdmFjeSBjaGFuZ2VkIHN1Y2Nlc3NmdWxseScgfSxcclxuICAgIH0pO1xyXG4gIH0gY2F0Y2ggKGUpIHtcclxuICAgIHJlcS5sb2dnZXIuZXJyb3IoZSk7XHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oe1xyXG4gICAgICBzdGF0dXM6ICdlcnJvcicsXHJcbiAgICAgIG1lc3NhZ2U6ICdFcnJvciBjaGFuZ2luZyBncm91cCBwcml2YWN5JyxcclxuICAgICAgZXJyb3I6IGUsXHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzZXRHcm91cFByb2ZpbGVQaWMocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKSB7XHJcbiAgLyoqXHJcbiAgICAgI3N3YWdnZXIudGFncyA9IFtcIkdyb3VwXCJdXHJcbiAgICAgI3N3YWdnZXIuYXV0b0JvZHk9ZmFsc2VcclxuICAgICAjc3dhZ2dlci5zZWN1cml0eSA9IFt7XHJcbiAgICAgICAgICAgIFwiYmVhcmVyQXV0aFwiOiBbXVxyXG4gICAgIH1dXHJcbiAgICAgI3N3YWdnZXIucGFyYW1ldGVyc1tcInNlc3Npb25cIl0gPSB7XHJcbiAgICAgIHNjaGVtYTogJ05FUkRXSEFUU19BTUVSSUNBJ1xyXG4gICAgIH1cclxuICAgICAjc3dhZ2dlci5yZXF1ZXN0Qm9keSA9IHtcclxuICAgICAgcmVxdWlyZWQ6IHRydWUsXHJcbiAgICAgIFwiQGNvbnRlbnRcIjoge1xyXG4gICAgICAgIFwiYXBwbGljYXRpb24vanNvblwiOiB7XHJcbiAgICAgICAgICBzY2hlbWE6IHtcclxuICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICRncm91cElkOiB7IHR5cGU6IFwic3RyaW5nXCIgfSxcclxuICAgICAgICAgICAgICAkcGF0aDogeyB0eXBlOiBcInN0cmluZ1wiIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAqL1xyXG4gIGNvbnN0IHsgZ3JvdXBJZCwgcGF0aCB9ID0gcmVxLmJvZHk7XHJcblxyXG4gIGlmICghcGF0aCAmJiAhcmVxLmZpbGUpXHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDEpLnNlbmQoe1xyXG4gICAgICBtZXNzYWdlOiAnU2VuZGluZyB0aGUgaW1hZ2UgaXMgbWFuZGF0b3J5JyxcclxuICAgIH0pO1xyXG5cclxuICBjb25zdCBwYXRoRmlsZSA9IHBhdGggfHwgcmVxLmZpbGU/LnBhdGg7XHJcblxyXG4gIHRyeSB7XHJcbiAgICBmb3IgKGNvbnN0IGNvbnRhY3Qgb2YgY29udGFjdFRvQXJyYXkoZ3JvdXBJZCwgdHJ1ZSkpIHtcclxuICAgICAgYXdhaXQgcmVxLmNsaWVudC5zZXRHcm91cEljb24oY29udGFjdCwgcGF0aEZpbGUpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiByZXMuc3RhdHVzKDIwMSkuanNvbih7XHJcbiAgICAgIHN0YXR1czogJ3N1Y2Nlc3MnLFxyXG4gICAgICByZXNwb25zZTogeyBtZXNzYWdlOiAnR3JvdXAgcHJvZmlsZSBwaG90byBzdWNjZXNzZnVsbHkgY2hhbmdlZCcgfSxcclxuICAgIH0pO1xyXG4gIH0gY2F0Y2ggKGUpIHtcclxuICAgIHJlcS5sb2dnZXIuZXJyb3IoZSk7XHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oe1xyXG4gICAgICBzdGF0dXM6ICdlcnJvcicsXHJcbiAgICAgIG1lc3NhZ2U6ICdFcnJvciBjaGFuZ2luZyBncm91cCBwaG90bycsXHJcbiAgICAgIGVycm9yOiBlLFxyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFpQkEsSUFBQUEsVUFBQSxHQUFBQyxPQUFBLHNCQUkyQixDQXJCM0I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBU08sZUFBZUMsWUFBWUEsQ0FBQ0MsR0FBWSxFQUFFQyxHQUFhLEVBQUUsQ0FDOUQ7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQ0UsSUFBSSxDQUNGLE1BQU1DLFFBQVEsR0FBRyxNQUFNRixHQUFHLENBQUNHLE1BQU0sQ0FBQ0osWUFBWSxDQUFDLENBQUMsQ0FFaEQsT0FBT0UsR0FBRyxDQUFDRyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUNDLElBQUksQ0FBQyxFQUFFRCxNQUFNLEVBQUUsU0FBUyxFQUFFRixRQUFRLEVBQUVBLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FDeEUsQ0FBQyxDQUFDLE9BQU9JLENBQUMsRUFBRSxDQUNWTixHQUFHLENBQUNPLE1BQU0sQ0FBQ0MsS0FBSyxDQUFDRixDQUFDLENBQUMs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