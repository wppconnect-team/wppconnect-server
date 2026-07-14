import { Request, Response } from 'express';

import { unlinkAsync } from '../util/functions';

function returnError(req: Request, res: Response, error: any) {
  req.logger.error(error);
  res
    .status(500)
    .json({ status: 'Error', message: 'Erro ao enviar status.', error: error });
}

async function returnSucess(res: Response, data: any) {
  res.status(201).json({ status: 'success', response: data, mapper: 'return' });
}

export async function sendTextStorie(req: Request, res: Response) {
  /**
     #swagger.tags = ["Status Stories"]
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
        text: 'My new storie',
        options: { backgroundColor: '#0275d8', font: 2},
      }
     }
     #swagger.requestBody = {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              text: { type: 'string' },
              options: { type: 'object' },
            },
            required: ['text'],
          },
          examples: {
            'Default': {
              value: {
                text: 'My new storie',
                options: { backgroundColor: '#0275d8', font: 2},
              },
            },
          },
        },
      },
    }
   */
  const { text, options } = req.body;

  if (!text)
    res.status(401).send({
      message: 'Text was not informed',
    });

  try {
    const results: any = [];
    results.push(await req.client.sendTextStatus(text, options));

    if (results.length === 0)
      res.status(400).json('Error sending the text of stories');
    returnSucess(res, results);
  } catch (error) {
    returnError(req, res, error);
  }
}

export async function sendImageStorie(req: Request, res: Response) {
  /**
     #swagger.tags = ["Status Stories"]
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
              path: { type: 'string' },
            },
            required: ['path'],
          },
          examples: {
            'Default': {
              value: {
                path: 'Path of your image',
              },
            },
          },
        },
      },
    }
   */
  const { path } = req.body;

  if (!path && !req.file)
    res.status(401).send({
      message: 'Sending the image is mandatory',
    });

  const pathFile = path || req.file?.path;

  try {
    const results: any = [];
    results.push(await req.client.sendImageStatus(pathFile));

    if (results.length === 0)
      res.status(400).json('Error sending the image of stories');
    returnSucess(res, results);
  } catch (error) {
    returnError(req, res, error);
  }
}

export async function sendVideoStorie(req: Request, res: Response) {
  /**
     #swagger.tags = ["Status Stories"]
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
              path: { type: "string" }
            },
            required: ["path"]
          },
          examples: {
            "Default": {
              value: {
                path: "Path of your video"
              }
            }
          }
        }
      }
    }
   */
  const { path } = req.body;

  if (!path && !req.file)
    res.status(401).send({
      message: 'Sending the Video is mandatory',
    });

  const pathFile = path || req.file?.path;

  try {
    const results: any = [];

    results.push(await req.client.sendVideoStatus(pathFile));

    if (results.length === 0) res.status(400).json('Error sending message');
    if (req.file) await unlinkAsync(pathFile);
    returnSucess(res, results);
  } catch (error) {
    returnError(req, res, error);
  }
}

export async function getStatusStories(req: Request, res: Response) {
  /**
     #swagger.tags = ["Status Stories"]
     #swagger.autoBody=false
     #swagger.security = [{
            "bearerAuth": []
     }]
     #swagger.parameters["session"] = {
      schema: 'NERDWHATS_AMERICA'
     }
     #swagger.parameters["page"] = {
      in: 'query',
      type: 'integer',
      description: 'Page number',
      default: 1
     }
     #swagger.parameters["limit"] = {
      in: 'query',
      type: 'integer',
      description: 'Items per page (0 to return all)',
      default: 20
     }
   */
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  try {
    const response = await req.client.page.evaluate(
      (p, l) => {
        const WPPLocal = (window as any).WPP;
        if (
          !WPPLocal ||
          !WPPLocal.whatsapp ||
          !WPPLocal.whatsapp.StatusV3Store
        ) {
          return {
            total: 0,
            page: p,
            limit: l,
            pages: 0,
            results: [],
          };
        }

        const models = WPPLocal.whatsapp.StatusV3Store.toArray();
        let paginatedModels = models;

        if (l > 0) {
          const startIndex = (p - 1) * l;
          const endIndex = p * l;
          paginatedModels = models.slice(startIndex, endIndex);
        }

        return {
          total: models.length,
          page: l > 0 ? p : 1,
          limit: l > 0 ? l : models.length,
          pages: l > 0 ? Math.ceil(models.length / l) : 1,
          results: paginatedModels.map((m: any) => m.toJSON()),
        };
      },
      page,
      limit
    );

    res.status(200).json({ status: 'success', response: response });
  } catch (error) {
    req.logger.error(error);
    res.status(500).json({
      status: 'error',
      message: 'Error retrieving status stories',
      error: error,
    });
  }
}
