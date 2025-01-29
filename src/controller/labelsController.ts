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

import { Request, Response } from 'express';

export async function addNewLabel(req: Request, res: Response) {
  /**
     #swagger.tags = ["Labels"]
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
              $name: { type: "string" },
              $options: {
                type: "object",
                properties: {
                  labelColor: { type: "number" }
                }
              }
            },
            required: ["name", "options"]
          },
          examples: {
            "Default": {
              value: {
                name: "Name of your label",
                options: { labelColor: 4292849392 }
              }
            }
          }
        }
      }
    }
   */
  const { name, options } = req.body;
  if (!name)
    res.status(401).send({
      message: 'Name was not informed',
    });

  try {
    const result = await req.client.addNewLabel(name, options);
    res.status(201).json({ status: 'success', response: result });
  } catch (error) {
    res.status(500).json({
      status: 'Error',
      message: 'Erro ao adicionar etiqueta.',
      error: error,
    });
  }
}

export async function addOrRemoveLabels(req: Request, res: Response) {
  /**
     #swagger.tags = ["Labels"]
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
              chatIds: {
                type: "array",
                items: {
                  type: "string"
                }
              },
              options: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    labelId: { type: "string" },
                    type: { type: "string" }
                  },
                }
              }
            },
            required: ["chatIds"]
          },
          examples: {
            "Default": {
              value: {
                chatIds: ["5521999999999"],
                options: [
                  { labelId: "76", type: "add" },
                  { labelId: "75", type: "remove" }
                ]
              }
            }
          }
        }
      }
    }
   */
  const { chatIds, options } = req.body;
  if (!chatIds || !options)
    res.status(401).send({
      message: 'chatIds or options was not informed',
    });

  try {
    const result = await req.client.addOrRemoveLabels(chatIds, options);
    res.status(201).json({ status: 'success', response: result });
  } catch (error) {
    res.status(500).json({
      status: 'Error',
      message: 'Erro ao adicionar/deletar etiqueta.',
      error: error,
    });
  }
}

export async function getAllLabels(req: Request, res: Response) {
  /**
     #swagger.tags = ["Labels"]
     #swagger.autoBody=false
     #swagger.security = [{
            "bearerAuth": []
     }]
     #swagger.parameters["session"] = {
      schema: 'NERDWHATS_AMERICA'
     }
   */
  try {
    const result = await req.client.getAllLabels();
    res.status(201).json({ status: 'success', response: result });
  } catch (error) {
    res.status(500).json({
      status: 'Error',
      message: 'Erro ao buscar etiquetas.',
      error: error,
    });
  }
}

export async function deleteAllLabels(req: Request, res: Response) {
  /**
     #swagger.tags = ["Labels"]
     #swagger.autoBody=false
     #swagger.security = [{
            "bearerAuth": []
     }]
     #swagger.parameters["session"] = {
      schema: 'NERDWHATS_AMERICA'
     }
   */
  try {
    const result = await req.client.deleteAllLabels();
    res.status(201).json({ status: 'success', response: result });
  } catch (error) {
    res.status(500).json({
      status: 'Error',
      message: 'Erro ao deletar todas as etiquetas.',
      error: error,
    });
  }
}

export async function deleteLabel(req: Request, res: Response) {
  /**
     #swagger.tags = ["Labels"]
     #swagger.autoBody=false
     #swagger.security = [{
            "bearerAuth": []
     }]
     #swagger.parameters["session"] = {
      schema: 'NERDWHATS_AMERICA'
     }
     #swagger.parameters["id"] = {
      schema: '<labelId>'
     }
   */
  const { id } = req.params;
  try {
    const result = await req.client.deleteLabel(id);
    res.status(201).json({ status: 'success', response: result });
  } catch (error) {
    res.status(500).json({
      status: 'Error',
      message: 'Erro ao deletar etiqueta.',
      error: error,
    });
  }
}
