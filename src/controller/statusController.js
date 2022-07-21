import { unlinkAsync } from '../util/functions';

function returnError(req, res, error) {
  req.logger.error(error);
  res.status(500).json({ status: 'Error', message: 'Erro ao enviar status.' });
}

async function returnSucess(res, data) {
  res.status(201).json({ status: 'success', response: data, mapper: 'return' });
}

export async function sendTextStorie(req, res) {
  const { text, options } = req.body;

  if (!text)
    return res.status(401).send({
      message: 'Text was not informed',
    });

  try {
    let results = [];
    results.push(await req.client.sendTextStatus(text, options));

    if (results.length === 0) return res.status(400).json('Error sending the text of stories');
    returnSucess(res, results);
  } catch (error) {
    returnError(req, res, error);
  }
}

export async function sendImageStorie(req, res) {
  const { path, options } = req.body;

  if (!path && !req.file)
    return res.status(401).send({
      message: 'Sending the image is mandatory',
    });

  const pathFile = path || req.file.path;

  try {
    let results = [];
    results.push(await req.client.sendImageStatus(pathFile, options));

    if (results.length === 0) return res.status(400).json('Error sending the image of stories');
    returnSucess(res, results);
  } catch (error) {
    returnError(req, res, error);
  }
}

export async function sendVideoStorie(req, res) {
  const { path } = req.body;

  if (!path && !req.file)
    return res.status(401).send({
      message: 'Sending the Video is mandatory',
    });

  const pathFile = path || req.file.path;

  try {
    let results = [];

    results.push(await req.client.sendVideoStatus(pathFile));

    if (results.length === 0) return res.status(400).json('Error sending message');
    if (req.file) await unlinkAsync(pathFile);
    returnSucess(res, results);
  } catch (error) {
    returnError(req, res, error);
  }
}
