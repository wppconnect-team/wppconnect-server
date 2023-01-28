import { unlinkAsync } from '../util/functions';
import { RequestWPP } from '../types/RequestWPP';
import { Response } from 'express';

function returnError(req: RequestWPP, res: Response, error: any) {
  req.logger.error(error);
  res.status(500).json({ status: 'Error', message: 'Erro ao enviar status.', error: error });
}

async function returnSucess(res: Response, data: any) {
  res.status(201).json({ status: 'success', response: data, mapper: 'return' });
}

export async function sendTextStorie(req: any, res: any) {
  const { text, options } = req.body;

  if (!text)
    return res.status(401).send({
      message: 'Text was not informed',
    });

  try {
    let results: any = [];
    results.push(await req.client.sendTextStatus(text, options));

    if (results.length === 0) return res.status(400).json('Error sending the text of stories');
    returnSucess(res, results);
  } catch (error) {
    returnError(req, res, error);
  }
}

export async function sendImageStorie(req: any, res: any) {
  const { path, options } = req.body;

  if (!path && !req.file)
    return res.status(401).send({
      message: 'Sending the image is mandatory',
    });

  const pathFile = path || req.file.path;

  try {
    let results: any = [];
    results.push(await req.client.sendImageStatus(pathFile));

    if (results.length === 0) return res.status(400).json('Error sending the image of stories');
    returnSucess(res, results);
  } catch (error) {
    returnError(req, res, error);
  }
}

export async function sendVideoStorie(req: any, res: any) {
  const { path } = req.body;

  if (!path && !req.file)
    return res.status(401).send({
      message: 'Sending the Video is mandatory',
    });

  const pathFile = path || req.file.path;

  try {
    let results: any = [];

    results.push(await req.client.sendVideoStatus(pathFile));

    if (results.length === 0) return res.status(400).json('Error sending message');
    if (req.file) await unlinkAsync(pathFile);
    returnSucess(res, results);
  } catch (error) {
    returnError(req, res, error);
  }
}
