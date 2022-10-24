/*
 * Copyright 2022 WPPConnect Team
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
import { contactToArray, groupNameToArray, groupToArray } from '../util/functions';
import { Response } from 'express';
import { Request } from '../types/request-types';

export async function getAllGroups(req: Request, res: Response) {
  /* 
    #swagger.tags = ['Group'] 
    #swagger.parameters = [
      {
        "name": "session",
        "default": "NERDWHATS_AMERICA",
        "in": "path",
        "description": "Nome da sessão",
        "required": true,
      },
    ]
  */
  try {
    const response = await req.client?.getAllGroups();

    return res.status(200).json({ status: 'success', response: response });
  } catch (e) {
    req.logger.error(e);
    res.status(500).json({ status: 'error', message: 'Error fetching groups' });
  }
}

export async function joinGroupByCode(req: Request, res: Response) {
  /* 
    #swagger.tags = ['Group'] 
    #swagger.parameters = [
      {
        "name": "session",
        "default": "NERDWHATS_AMERICA",
        "in": "path",
        "description": "Nome da sessão",
        "required": true,
      },
    ]
  */
  const { inviteCode } = req.body;

  if (!inviteCode) return res.status(400).send({ message: 'Invitation Code is required' });

  try {
    await req.client?.joinGroup(inviteCode);
    res.status(201).json({
      status: 'success',
      response: { message: 'The informed contact(s) entered the group successfully', contact: inviteCode },
    });
  } catch (error) {
    req.logger.error(error);
    res.status(500).json({ status: 'error', message: 'The informed contact(s) did not join the group successfully' });
  }
}

export async function createGroup(req: Request, res: Response) {
  /* 
    #swagger.tags = ['Group'] 
    #swagger.parameters = [
      {
        "name": "session",
        "default": "NERDWHATS_AMERICA",
        "in": "path",
        "description": "Nome da sessão",
        "required": true,
      },
    ]
  */
  const { participants, name } = req.body;

  try {
    let response: any = {};
    let infoGroup = [];

    for (const group of groupNameToArray(name)) {
      response = await req.client?.createGroup(group, contactToArray(participants));

      infoGroup.push({
        name: group,
        id: response.gid.user,
        participants: response.participants.map((user: any) => {
          return { user: Object.keys(user)[0] };
        }),
      });
    }

    return res.status(201).json({
      status: 'success',
      response: { message: 'Group(s) created successfully', group: name, groupInfo: infoGroup },
    });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({ status: 'error', message: 'Error creating group(s)' });
  }
}

export async function leaveGroup(req: Request, res: Response) {
  /* 
    #swagger.tags = ['Group'] 
    #swagger.parameters = [
      {
        "name": "session",
        "default": "NERDWHATS_AMERICA",
        "in": "path",
        "description": "Nome da sessão",
        "required": true,
      },
    ]
  */
  const { groupId } = req.body;

  try {
    for (const group of groupToArray(groupId)) {
      await req.client?.leaveGroup(group);
    }

    return res.status(200).json({
      status: 'success',
      response: { messages: 'Você saiu do grupo com sucesso', group: groupId },
    });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({ status: 'error', message: 'Erro ao sair do(s) grupo(s)' });
  }
}

export async function getGroupMembers(req: Request, res: Response) {
  /* 
    #swagger.tags = ['Group'] 
    #swagger.parameters = [
      {
        "name": "session",
        "default": "NERDWHATS_AMERICA",
        "in": "path",
        "description": "Nome da sessão",
        "required": true,
      },
    ]
  */
  const { groupId } = req.params;

  try {
    let response: any = {};
    for (const group of groupToArray(groupId)) {
      response = await req.client?.getGroupMembers(group);
    }
    return res.status(200).json({ status: 'success', response: response });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({ status: 'error', message: 'Error on get group members' });
  }
}

export async function addParticipant(req: Request, res: Response) {
  /* 
    #swagger.tags = ['Group'] 
    #swagger.parameters = [
      {
        "name": "session",
        "default": "NERDWHATS_AMERICA",
        "in": "path",
        "description": "Nome da sessão",
        "required": true,
      },
    ]
  */
  const { groupId, phone } = req.body;

  try {
    let response: any = {};
    let arrayGroups = [];

    for (const group of groupToArray(groupId)) {
      response = await req.client?.addParticipant(group, contactToArray(phone));
      arrayGroups.push(response);
    }

    return res.status(201).json({
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
    return res.status(500).json({ status: 'error', message: 'Error adding participant(s)' });
  }
}

export async function removeParticipant(req: Request, res: Response) {
  /* 
    #swagger.tags = ['Group'] 
    #swagger.parameters = [
      {
        "name": "session",
        "default": "NERDWHATS_AMERICA",
        "in": "path",
        "description": "Nome da sessão",
        "required": true,
      },
    ]
  */
  const { groupId, phone } = req.body;

  try {
    let response: any = {};
    let arrayGroups = [];

    for (const group of groupToArray(groupId)) {
      response = await req.client?.removeParticipant(group, contactToArray(phone));
      arrayGroups.push(response);
    }

    return res.status(200).json({
      status: 'success',
      response: { message: 'Participant(s) removed successfully', participants: phone, groups: arrayGroups },
    });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({ status: 'error', message: 'Error removing participant(s)' });
  }
}

export async function promoteParticipant(req: Request, res: Response) {
  /* 
    #swagger.tags = ['Group'] 
    #swagger.parameters = [
      {
        "name": "session",
        "default": "NERDWHATS_AMERICA",
        "in": "path",
        "description": "Nome da sessão",
        "required": true,
      },
    ]
  */
  const { groupId, phone } = req.body;

  try {
    let arrayGroups = [];
    for (const group of groupToArray(groupId)) {
      await req.client?.promoteParticipant(group, contactToArray(phone));
      arrayGroups.push(group);
    }

    return res.status(201).json({
      status: 'success',
      response: { message: 'Successful promoted participant(s)', participants: phone, groups: arrayGroups },
    });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({ status: 'error', message: 'Error promoting participant(s)' });
  }
}

export async function demoteParticipant(req: Request, res: Response) {
  /* 
    #swagger.tags = ['Group'] 
    #swagger.parameters = [
      {
        "name": "session",
        "default": "NERDWHATS_AMERICA",
        "in": "path",
        "description": "Nome da sessão",
        "required": true,
      },
    ]
  */
  const { groupId, phone } = req.body;

  try {
    let arrayGroups = [];
    for (const group of groupToArray(groupId)) {
      await req.client?.demoteParticipant(group, contactToArray(phone));
      arrayGroups.push(group);
    }

    return res.status(201).json({
      status: 'success',
      response: { message: 'Admin of participant(s) revoked successfully', participants: phone, groups: arrayGroups },
    });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({ status: 'error', message: "Error revoking participant's admin(s)" });
  }
}

export async function getGroupAdmins(req: Request, res: Response) {
  /* 
    #swagger.tags = ['Group'] 
    #swagger.parameters = [
      {
        "name": "session",
        "default": "NERDWHATS_AMERICA",
        "in": "path",
        "description": "Nome da sessão",
        "required": true,
      },
    ]
  */
  const { groupId } = req.params;

  try {
    let response: any = {};
    let arrayGroups = [];

    for (const group of groupToArray(groupId)) {
      response = await req.client?.getGroupAdmins(group);
      arrayGroups.push(response);
    }

    return res.status(200).json({ status: 'success', response: arrayGroups });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({ status: 'error', message: 'Error retrieving group admin(s)' });
  }
}

export async function getGroupInviteLink(req: Request, res: Response) {
  /* 
    #swagger.tags = ['Group'] 
    #swagger.parameters = [
      {
        "name": "session",
        "default": "NERDWHATS_AMERICA",
        "in": "path",
        "description": "Nome da sessão",
        "required": true,
      },
    ]
  */
  const { groupId } = req.params;
  try {
    let response: any = {};
    for (const group of groupToArray(groupId)) {
      response = await req.client?.getGroupInviteLink(group);
    }

    return res.status(200).json({ status: 'success', response: response });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({ status: 'error', message: 'Error on get group invite link' });
  }
}

export async function revokeGroupInviteLink(req: Request, res: Response) {
  /* 
    #swagger.tags = ['Group'] 
    #swagger.parameters = [
      {
        "name": "session",
        "default": "NERDWHATS_AMERICA",
        "in": "path",
        "description": "Nome da sessão",
        "required": true,
      },
    ]
  */
  const { groupId } = req.params;

  let response: any = {};

  try {
    for (const group of groupToArray(groupId)) {
      response = await req.client?.revokeGroupInviteLink(group);
    }

    return res.status(200).json({
      status: 'Success',
      response: response,
    });
  } catch (e) {
    req.logger.error(e);
    return res.status(400).json('Error on revoke group invite link');
  }
}

export async function getAllBroadcastList(req: Request, res: Response) {
  /* 
    #swagger.tags = ['Group'] 
    #swagger.parameters = [
      {
        "name": "session",
        "default": "NERDWHATS_AMERICA",
        "in": "path",
        "description": "Nome da sessão",
        "required": true,
      },
    ]
  */
  try {
    let response = await req.client?.getAllBroadcastList();
    return res.status(200).json({ status: 'success', response: response });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({ status: 'error', message: 'Error on get all broad cast list' });
  }
}

export async function getGroupInfoFromInviteLink(req: Request, res: Response) {
  /* 
    #swagger.tags = ['Group'] 
    #swagger.parameters = [
      {
        "name": "session",
        "default": "NERDWHATS_AMERICA",
        "in": "path",
        "description": "Nome da sessão",
        "required": true,
      },
    ]
  */
  try {
    const { invitecode } = req.body;
    let response = await req.client?.getGroupInfoFromInviteLink(invitecode);
    return res.status(200).json({ status: 'success', response: response });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({ status: 'error', message: 'Error on get group info from invite link' });
  }
}

export async function getGroupMembersIds(req: Request, res: Response) {
  /* 
    #swagger.tags = ['Group'] 
    #swagger.parameters = [
      {
        "name": "session",
        "default": "NERDWHATS_AMERICA",
        "in": "path",
        "description": "Nome da sessão",
        "required": true,
      },
    ]
  */
  const { groupId } = req.params;
  let response: any = {};
  try {
    for (const group of groupToArray(groupId)) {
      response = await req.client?.getGroupMembersIds(group);
    }
    return res.status(200).json({ status: 'success', response: response });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({ status: 'error', message: 'Error on get group members ids' });
  }
}

export async function setGroupDescription(req: Request, res: Response) {
  /* 
    #swagger.tags = ['Group'] 
    #swagger.parameters = [
      {
        "name": "session",
        "default": "NERDWHATS_AMERICA",
        "in": "path",
        "description": "Nome da sessão",
        "required": true,
      },
    ]
  */
  const { groupId, description } = req.body;

  let response: any = {};

  try {
    for (const group of groupToArray(groupId)) {
      response = await req.client?.setGroupDescription(group, description);
    }

    return res.status(200).json({ status: 'success', response: response });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({ status: 'error', message: 'Error on set group description' });
  }
}

export async function setGroupProperty(req: Request, res: Response) {
  /* 
    #swagger.tags = ['Group'] 
    #swagger.parameters = [
      {
        "name": "session",
        "default": "NERDWHATS_AMERICA",
        "in": "path",
        "description": "Nome da sessão",
        "required": true,
      },
    ]
  */
  const { groupId, property, value = true } = req.body;

  let response: any = {};

  try {
    for (const group of groupToArray(groupId)) {
      response = await req.client?.setGroupProperty(group, property, value);
    }

    return res.status(200).json({ status: 'success', response: response });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({ status: 'error', message: 'Error on set group property' });
  }
}

export async function setGroupSubject(req: Request, res: Response) {
  /* 
    #swagger.tags = ['Group'] 
    #swagger.parameters = [
      {
        "name": "session",
        "default": "NERDWHATS_AMERICA",
        "in": "path",
        "description": "Nome da sessão",
        "required": true,
      },
    ]
  */
  const { groupId, title } = req.body;

  let response: any = {};

  try {
    for (const group of groupToArray(groupId)) {
      response = await req.client?.setGroupSubject(group, title);
    }

    return res.status(200).json({ status: 'success', response: response });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({ status: 'error', message: 'Error on set group subject' });
  }
}

export async function setMessagesAdminsOnly(req: Request, res: Response) {
  /* 
    #swagger.tags = ['Group'] 
    #swagger.parameters = [
      {
        "name": "session",
        "default": "NERDWHATS_AMERICA",
        "in": "path",
        "description": "Nome da sessão",
        "required": true,
      },
    ]
  */
  const { groupId, value = true } = req.body;

  let response: any = {};

  try {
    for (const group of groupToArray(groupId)) {
      response = await req.client?.setMessagesAdminsOnly(group, value);
    }

    return res.status(200).json({ status: 'success', response: response });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({ status: 'error', message: 'Error on set messages admins only' });
  }
}

export async function changePrivacyGroup(req: Request, res: Response) {
  /* 
    #swagger.tags = ['Group'] 
    #swagger.parameters = [
      {
        "name": "session",
        "default": "NERDWHATS_AMERICA",
        "in": "path",
        "description": "Nome da sessão",
        "required": true,
      },
    ]
  */
  const { groupId, status } = req.body;

  try {
    for (const group of contactToArray(groupId)) {
      await req.client?.setMessagesAdminsOnly(group, status === 'true');
    }

    return res.status(200).json({ status: 'success', response: { message: 'Group privacy changed successfully' } });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({ status: 'error', message: 'Error changing group privacy' });
  }
}

export async function setGroupProfilePic(req: Request, res: Response) {
  /* 
    #swagger.tags = ['Group'] 
    #swagger.parameters = [
      {
        "name": "session",
        "default": "NERDWHATS_AMERICA",
        "in": "path",
        "description": "Nome da sessão",
        "required": true,
      },
    ]
  */
  const { phone, path } = req.body;

  if (!path && !req.file)
    return res.status(401).send({
      message: 'Sending the image is mandatory',
    });

  const pathFile = path || req.file?.path;

  try {
    for (const contato of contactToArray(phone, true)) {
      await req.client?.setGroupIcon(contato, pathFile);
    }

    return res
      .status(201)
      .json({ status: 'success', response: { message: 'Group profile photo successfully changed' } });
  } catch (e) {
    req.logger.error(e);
    return res.status(500).json({ status: 'error', message: 'Error changing group photo' });
  }
}
