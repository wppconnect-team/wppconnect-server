/*
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
 */
import { Request, Response } from 'express';

import {
  contactToArray,
  groupNameToArray,
  groupToArray,
} from '../util/functions';

export async function getAllGroups(req: Request, res: Response) {
  /**
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
   */
  try {
    const response = await req.client.getAllGroups();

    res.status(200).json({ status: 'success', response: response });
  } catch (e) {
    req.logger.error(e);
    res
      .status(500)
      .json({ status: 'error', message: 'Error fetching groups', error: e });
  }
}

export async function joinGroupByCode(req: Request, res: Response) {
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
    res.status(400).send({ message: 'Invitation Code is required' });

  try {
    await req.client.joinGroup(inviteCode);
    res.status(201).json({
      status: 'success',
      response: {
        message: 'The informed contact(s) entered the group successfully',
        contact: inviteCode,
      },
    });
  } catch (error) {
    req.logger.error(error);
    res.status(500).json({
      status: 'error',
      message: 'The informed contact(s) did not join the group successfully',
      error: error,
    });
  }
}

export async function createGroup(req: Request, res: Response) {
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
    const infoGroup: any = [];

    for (const group of groupNameToArray(name)) {
      response = await req.client.createGroup(
        group,
        contactToArray(participants)
      );
      infoGroup.push({
        name: group,
        id: (response as any).gid.user,
        participants: (response as any).participants,
      });
    }

    res.status(201).json({
      status: 'success',
      response: {
        message: 'Group(s) created successfully',
        group: name,
        groupInfo: infoGroup,
      },
    });
  } catch (e) {
    req.logger.error(e);
    res
      .status(500)
      .json({ status: 'error', message: 'Error creating group(s)', error: e });
  }
}

export async function leaveGroup(req: Request, res: Response) {
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
    for (const group of groupToArray(groupId)) {
      await req.client.leaveGroup(group);
    }

    res.status(200).json({
      status: 'success',
      response: { messages: 'Você saiu do grupo com sucesso', group: groupId },
    });
  } catch (e) {
    req.logger.error(e);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao sair do(s) grupo(s)',
      error: e,
    });
  }
}

export async function getGroupMembers(req: Request, res: Response) {
  /**
     #swagger.tags = ["Group"]
     #swagger.autoBody=false
     #swagger.security = [{
            "bearerAuth": []
     }]
     #swagger.parameters["session"] = {
      schema: 'NERDWHATS_AMERICA'
     }
   */
  const { groupId } = req.params;

  try {
    let response = {};
    for (const group of groupToArray(groupId)) {
      response = await req.client.getGroupMembers(group);
    }
    res.status(200).json({ status: 'success', response: response });
  } catch (e) {
    req.logger.error(e);
    res.status(500).json({
      status: 'error',
      message: 'Error on get group members',
      error: e,
    });
  }
}

export async function addParticipant(req: Request, res: Response) {
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
    const arrayGroups: any = [];

    for (const group of groupToArray(groupId)) {
      response = await req.client.addParticipant(group, contactToArray(phone));
      arrayGroups.push(response);
    }

    res.status(201).json({
      status: 'success',
      response: {
        message: 'Addition to group attempted.',
        participants: phone,
        groups: groupToArray(groupId),
        result: arrayGroups,
      },
    });
  } catch (e) {
    req.logger.error(e);
    res.status(500).json({
      status: 'error',
      message: 'Error adding participant(s)',
      error: e,
    });
  }
}

export async function removeParticipant(req: Request, res: Response) {
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
    let response: any = {};
    const arrayGroups: any = [];

    for (const group of groupToArray(groupId)) {
      response = await req.client.removeParticipant(
        group,
        contactToArray(phone)
      );
      arrayGroups.push(response);
    }

    res.status(200).json({
      status: 'success',
      response: {
        message: 'Participant(s) removed successfully',
        participants: phone,
        groups: arrayGroups,
      },
    });
  } catch (e) {
    req.logger.error(e);
    res.status(500).json({
      status: 'error',
      message: 'Error removing participant(s)',
      error: e,
    });
  }
}

export async function promoteParticipant(req: Request, res: Response) {
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
    const arrayGroups: any = [];
    for (const group of groupToArray(groupId)) {
      await req.client.promoteParticipant(group, contactToArray(phone));
      arrayGroups.push(group);
    }

    res.status(201).json({
      status: 'success',
      response: {
        message: 'Successful promoted participant(s)',
        participants: phone,
        groups: arrayGroups,
      },
    });
  } catch (e) {
    req.logger.error(e);
    res.status(500).json({
      status: 'error',
      message: 'Error promoting participant(s)',
      error: e,
    });
  }
}

export async function demoteParticipant(req: Request, res: Response) {
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
    const arrayGroups: any = [];
    for (const group of groupToArray(groupId)) {
      await req.client.demoteParticipant(group, contactToArray(phone));
      arrayGroups.push(group);
    }

    res.status(201).json({
      status: 'success',
      response: {
        message: 'Admin of participant(s) revoked successfully',
        participants: phone,
        groups: arrayGroups,
      },
    });
  } catch (e) {
    req.logger.error(e);
    res.status(500).json({
      status: 'error',
      message: "Error revoking participant's admin(s)",
      error: e,
    });
  }
}

export async function getGroupAdmins(req: Request, res: Response) {
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
    const arrayGroups: any = [];

    for (const group of groupToArray(groupId)) {
      response = await req.client.getGroupAdmins(group);
      arrayGroups.push(response);
    }

    res.status(200).json({ status: 'success', response: arrayGroups });
  } catch (e) {
    req.logger.error(e);
    res.status(500).json({
      status: 'error',
      message: 'Error retrieving group admin(s)',
      error: e,
    });
  }
}

export async function getGroupInviteLink(req: Request, res: Response) {
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
    for (const group of groupToArray(groupId)) {
      response = await req.client.getGroupInviteLink(group);
    }

    res.status(200).json({ status: 'success', response: response });
  } catch (e) {
    req.logger.error(e);
    res.status(500).json({
      status: 'error',
      message: 'Error on get group invite link',
      error: e,
    });
  }
}

export async function revokeGroupInviteLink(req: Request, res: Response) {
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
    for (const group of groupToArray(groupId)) {
      response = await req.client.revokeGroupInviteLink(group);
    }

    res.status(200).json({
      status: 'Success',
      response: response,
    });
  } catch (e) {
    req.logger.error(e);
    res.status(400).json({
      status: 'error',
      message: 'Error on revoke group invite link',
      error: e,
    });
  }
}

export async function getAllBroadcastList(req: Request, res: Response) {
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
    res.status(200).json({ status: 'success', response: response });
  } catch (e) {
    req.logger.error(e);
    res.status(500).json({
      status: 'error',
      message: 'Error on get all broad cast list',
      error: e,
    });
  }
}

export async function getGroupInfoFromInviteLink(req: Request, res: Response) {
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
    res.status(200).json({ status: 'success', response: response });
  } catch (e) {
    req.logger.error(e);
    res.status(500).json({
      status: 'error',
      message: 'Error on get group info from invite link',
      error: e,
    });
  }
}

export async function getGroupMembersIds(req: Request, res: Response) {
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
    for (const group of groupToArray(groupId)) {
      response = await req.client.getGroupMembersIds(group);
    }
    res.status(200).json({ status: 'success', response: response });
  } catch (e) {
    req.logger.error(e);
    res.status(500).json({
      status: 'error',
      message: 'Error on get group members ids',
      error: e,
    });
  }
}

export async function setGroupDescription(req: Request, res: Response) {
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
    for (const group of groupToArray(groupId)) {
      response = await req.client.setGroupDescription(group, description);
    }

    res.status(200).json({ status: 'success', response: response });
  } catch (e) {
    req.logger.error(e);
    res.status(500).json({
      status: 'error',
      message: 'Error on set group description',
      error: e,
    });
  }
}

export async function setGroupProperty(req: Request, res: Response) {
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
    for (const group of groupToArray(groupId)) {
      response = await req.client.setGroupProperty(group, property, value);
    }

    res.status(200).json({ status: 'success', response: response });
  } catch (e) {
    req.logger.error(e);
    res.status(500).json({
      status: 'error',
      message: 'Error on set group property',
      error: e,
    });
  }
}

export async function setGroupSubject(req: Request, res: Response) {
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
    for (const group of groupToArray(groupId)) {
      response = await req.client.setGroupSubject(group, title);
    }

    res.status(200).json({ status: 'success', response: response });
  } catch (e) {
    req.logger.error(e);
    res.status(500).json({
      status: 'error',
      message: 'Error on set group subject',
      error: e,
    });
  }
}

export async function setMessagesAdminsOnly(req: Request, res: Response) {
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
    for (const group of groupToArray(groupId)) {
      response = await req.client.setMessagesAdminsOnly(group, value);
    }

    res.status(200).json({ status: 'success', response: response });
  } catch (e) {
    req.logger.error(e);
    res.status(500).json({
      status: 'error',
      message: 'Error on set messages admins only',
      error: e,
    });
  }
}

export async function changePrivacyGroup(req: Request, res: Response) {
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
    for (const group of contactToArray(groupId)) {
      await req.client.setGroupProperty(
        group,
        'restrict' as any,
        status === 'true'
      );
    }

    res.status(200).json({
      status: 'success',
      response: { message: 'Group privacy changed successfully' },
    });
  } catch (e) {
    req.logger.error(e);
    res.status(500).json({
      status: 'error',
      message: 'Error changing group privacy',
      error: e,
    });
  }
}

export async function setGroupProfilePic(req: Request, res: Response) {
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
    res.status(401).send({
      message: 'Sending the image is mandatory',
    });

  const pathFile = path || req.file?.path;

  try {
    for (const contact of contactToArray(groupId, true)) {
      await req.client.setGroupIcon(contact, pathFile);
    }

    res.status(201).json({
      status: 'success',
      response: { message: 'Group profile photo successfully changed' },
    });
  } catch (e) {
    req.logger.error(e);
    res.status(500).json({
      status: 'error',
      message: 'Error changing group photo',
      error: e,
    });
  }
}

export async function getCommonGroups(req: Request, res: Response) {
  /**
     #swagger.tags = ["Group"]
     #swagger.autoBody=false
     #swagger.security = [{
            "bearerAuth": []
     }]
     #swagger.parameters["session"] = {
      schema: 'NERDWHATS_AMERICA'
     }
     #swagger.parameters["wid"] = {
      schema: '5521999999999@c.us'
     }
   */
  const { wid } = req.params;
  try {
    res.status(200).json(await (req.client as any).getCommonGroups(wid));
  } catch (e) {
    req.logger.error(e);
    res.status(500).json({
      status: 'error',
      message: 'Error on get common groups',
      error: e,
    });
  }
}
