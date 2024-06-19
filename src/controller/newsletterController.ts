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

function returnError(
  req: Request,
  res: Response,
  session: string,
  error?: any
) {
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

export async function createNewsletter(req: Request, res: Response) {
  /**
     * #swagger.tags = ["Newsletter]
        #swagger.operationId = 'createNewsletter'
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
                        options: { type: "object" },
                    }
                },
                examples: {
                    "Create newsletter/channel": {
                        value: { 
                            name: 'Name for your channel',
                            options: {
                                description: 'Description of channel',
                                picture: '<base64_image>',
                            }
                        }
                    },
                }
            }
        }
        }
     */
  const session = req.session;
  const { name, options } = req.body;

  try {
    res.status(201).json(await req.client.createNewsletter(name, options));
  } catch (error) {
    returnError(req, res, session, error);
  }
}

export async function editNewsletter(req: Request, res: Response) {
  /**
       * #swagger.tags = ["Newsletter]
         #swagger.operationId = 'editNewsletter'
         #swagger.autoBody=false
         #swagger.security = [{
                "bearerAuth": []
         }]
         #swagger.parameters["session"] = {
          schema: 'NERDWHATS_AMERICA'
         }
         #swagger.parameters["id"] = {
          schema: '<newsletter_id>'
         }
         #swagger.requestBody = {
        required: true,
        "@content": {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                name: { type: "string" },
                description: { type: "string" },
                picture: { type: "string" },
              }
            },
            examples: {
              "Edit newsletter/channel": {
                value: { 
                    name: 'New name of channel',
                    description: 'New description of channel',
                    picture: '<new_base64_image> or send null',
                }
              },
                "Create newsletter/channel": {
                    value: { 
                        name: 'Name for your channel',
                        options: {
                            description: 'Description of channel',
                            picture: '<base64_image>',
                        }
                    }
                },
            }
          }
        }
       }
       */
  const session = req.session;
  const { name, description, picture } = req.body;
  const { id } = req.params;

  try {
    res.status(201).json(
      await req.client.editNewsletter(id, {
        name,
        description,
        picture,
      })
    );
  } catch (error) {
    returnError(req, res, session, error);
  }
}

export async function destroyNewsletter(req: Request, res: Response) {
  /**
 * #swagger.tags = ["Newsletter]
    #swagger.autoBody=false
    #swagger.operationId = 'destroyNewsletter'
    #swagger.security = [{
            "bearerAuth": []
    }]
    #swagger.parameters["session"] = {
        schema: 'NERDWHATS_AMERICA'
    }
    #swagger.parameters["id"] = {
        schema: 'NEWSLETTER ID'
    }
    */
  const session = req.session;
  const { id } = req.params;

  try {
    res.status(201).json(await req.client.destroyNewsletter(id));
  } catch (error) {
    returnError(req, res, session, error);
  }
}

export async function muteNewsletter(req: Request, res: Response) {
  /**
   * #swagger.tags = ["Newsletter]
     #swagger.operationId = 'muteNewsletter'
     #swagger.autoBody=false
     #swagger.security = [{
              "bearerAuth": []
      }]
      #swagger.parameters["session"] = {
          schema: 'NERDWHATS_AMERICA'
      }
      #swagger.parameters["id"] = {
          schema: 'NEWSLETTER ID'
      }
      */
  const session = req.session;
  const { id } = req.params;

  try {
    res.status(201).json(await req.client.muteNesletter(id));
  } catch (error) {
    returnError(req, res, session, error);
  }
}
