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

export async function createCommunity(req: Request, res: Response) {
  /**
       #swagger.tags = ["Community"]
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
                name: { type: "string" },
                description: { type: "boolean" },
                groupIds: { type: "array" },
              }
            },
            examples: {
              "Default": {
                value: {
                  name: "My community name",
                  description: "Description for your community",
                  groupIds: ["groupId1", "groupId2"],
                }
              },
            }
          }
        }
       }
     */
  const { name, description, groupIds } = req.body;

  try {
    const response = await req.client.createCommunity(
      name,
      description,
      groupIds
    );

    res.status(200).json(response);
  } catch (error) {
    req.logger.error(error);
    res.status(500).json({
      status: 'error',
      message: 'Error on create community',
      error: error,
    });
  }
}

export async function deactivateCommunity(req: Request, res: Response) {
  /**
         #swagger.tags = ["Community"]
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
                  id: { type: "string" },
                }
              },
              examples: {
                "Default": {
                  value: {
                    id: "<you_community_id@g.us>",
                  }
                },
              }
            }
          }
         }
       */
  const { id } = req.body;

  try {
    const response = await req.client.deactivateCommunity(id);

    res.status(200).json(response);
  } catch (error) {
    req.logger.error(error);
    res.status(500).json({
      status: 'error',
      message: 'Error on deactivate community',
      error: error,
    });
  }
}

export async function addSubgroupsCommunity(req: Request, res: Response) {
  /**
    #swagger.tags = ["Community"]
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
                        id: { type: "string" },
                        groupsIds: { type: "array" },
                    }
                },
                examples: {
                    "Default": {
                        value: {
                            id: "<you_community_id@g.us>",
                            groupsIds: ["group1Id@g.us"]
                        }
                    },
                }
            }
        }
    }
    */
  const { id, groupsIds } = req.body;

  try {
    const response = await req.client.addSubgroupsCommunity(id, groupsIds);

    res.status(200).json(response);
  } catch (error) {
    req.logger.error(error);
    res.status(500).json({
      status: 'error',
      message: 'Error on add subgroup',
      error: error,
    });
  }
}

export async function removeSubgroupsCommunity(req: Request, res: Response) {
  /**
     #swagger.tags = ["Community"]
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
                        id: { type: "string" },
                        groupsIds: { type: "array" },
                    }
                },
                examples: {
                    "Default": {
                        value: {
                            id: "<you_community_id@g.us>",
                            groupsIds: ["group1Id@g.us"]
                        }
                    },
                }
            }
        }
    }
    */
  const { id, groupsIds } = req.body;

  try {
    const response = await req.client.removeSubgroupsCommunity(id, groupsIds);

    res.status(200).json(response);
  } catch (error) {
    req.logger.error(error);
    res.status(500).json({
      status: 'error',
      message: 'Error on remove subgroup',
      error: error,
    });
  }
}

export async function demoteCommunityParticipant(req: Request, res: Response) {
  /**
    #swagger.tags = ["Community"]
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
                        id: { type: "string" },
                        participantsId: { type: "array" },
                    }
                },
                examples: {
                    "Default": {
                        value: {
                            id: "<you_community_id@g.us>",
                            participantsId: ["group1Id@g.us"]
                        }
                    },
                }
            }
        }
    }
    */
  const { id, participantsId } = req.body;

  try {
    const response = await req.client.demoteCommunityParticipant(
      id,
      participantsId
    );

    res.status(200).json(response);
  } catch (error) {
    req.logger.error(error);
    res.status(500).json({
      status: 'error',
      message: 'Error on demote participant of communoty',
      error: error,
    });
  }
}

export async function promoteCommunityParticipant(req: Request, res: Response) {
  /**
    #swagger.tags = ["Community"]
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
                        id: { type: "string" },
                        participantsId: { type: "array" },
                    }
                },
                examples: {
                    "Default": {
                        value: {
                            id: "<you_community_id@g.us>",
                            participantsId: ["group1Id@g.us"]
                        }
                    },
                }
            }
        }
    }
    */
  const { id, participantsId } = req.body;

  try {
    const response = await req.client.promoteCommunityParticipant(
      id,
      participantsId
    );

    res.status(200).json(response);
  } catch (error) {
    req.logger.error(error);
    res.status(500).json({
      status: 'error',
      message: 'Error on demote participant of communoty',
      error: error,
    });
  }
}

export async function getCommunityParticipants(req: Request, res: Response) {
  /**
    #swagger.tags = ["Community"]
    #swagger.autoBody=false
    #swagger.security = [{
            "bearerAuth": []
    }]
    #swagger.parameters["session"] = {
        schema: 'NERDWHATS_AMERICA'
    }
    #swagger.parameters["id"] = {
        schema: 'communityId@g.us'
    }
    */
  const { id } = req.params;

  try {
    const response = await req.client.getCommunityParticipants(id);

    res.status(200).json(response);
  } catch (error) {
    req.logger.error(error);
    res.status(500).json({
      status: 'error',
      message: 'Error on get participant of communoty',
      error: error,
    });
  }
}
