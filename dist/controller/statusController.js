"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.sendImageStorie = sendImageStorie;exports.sendTextStorie = sendTextStorie;exports.sendVideoStorie = sendVideoStorie;

var _functions = require("../util/functions");

function returnError(req, res, error) {
  req.logger.error(error);
  res.
  status(500).
  json({ status: 'Error', message: 'Erro ao enviar status.', error: error });
}

async function returnSucess(res, data) {
  res.status(201).json({ status: 'success', response: data, mapper: 'return' });
}

async function sendTextStorie(req, res) {
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
  return res.status(401).send({
    message: 'Text was not informed'
  });

  try {
    const results = [];
    results.push(await req.client.sendTextStatus(text, options));

    if (results.length === 0)
    return res.status(400).json('Error sending the text of stories');
    returnSucess(res, results);
  } catch (error) {
    returnError(req, res, error);
  }
}

async function sendImageStorie(req, res) {
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
  return res.status(401).send({
    message: 'Sending the image is mandatory'
  });

  const pathFile = path || req.file?.path;

  try {
    const results = [];
    results.push(await req.client.sendImageStatus(pathFile));

    if (results.length === 0)
    return res.status(400).json('Error sending the image of stories');
    returnSucess(res, results);
  } catch (error) {
    returnError(req, res, error);
  }
}

async function sendVideoStorie(req, res) {
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
  return res.status(401).send({
    message: 'Sending the Video is mandatory'
  });

  const pathFile = path || req.file?.path;

  try {
    const results = [];

    results.push(await req.client.sendVideoStatus(pathFile));

    if (results.length === 0)
    return res.status(400).json('Error sending message');
    if (req.file) await (0, _functions.unlinkAsync)(pathFile);
    returnSucess(res, results);
  } catch (error) {
    returnError(req, res, error);
  }
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfZnVuY3Rpb25zIiwicmVxdWlyZSIsInJldHVybkVycm9yIiwicmVxIiwicmVzIiwiZXJyb3IiLCJsb2dnZXIiLCJzdGF0dXMiLCJqc29uIiwibWVzc2FnZSIsInJldHVyblN1Y2VzcyIsImRhdGEiLCJyZXNwb25zZSIsIm1hcHBlciIsInNlbmRUZXh0U3RvcmllIiwidGV4dCIsIm9wdGlvbnMiLCJib2R5Iiwic2VuZCIsInJlc3VsdHMiLCJwdXNoIiwiY2xpZW50Iiwic2VuZFRleHRTdGF0dXMiLCJsZW5ndGgiLCJzZW5kSW1hZ2VTdG9yaWUiLCJwYXRoIiwiZmlsZSIsInBhdGhGaWxlIiwic2VuZEltYWdlU3RhdHVzIiwic2VuZFZpZGVvU3RvcmllIiwic2VuZFZpZGVvU3RhdHVzIiwidW5saW5rQXN5bmMiXSwic291cmNlcyI6WyIuLi8uLi9zcmMvY29udHJvbGxlci9zdGF0dXNDb250cm9sbGVyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFJlcXVlc3QsIFJlc3BvbnNlIH0gZnJvbSAnZXhwcmVzcyc7XHJcblxyXG5pbXBvcnQgeyB1bmxpbmtBc3luYyB9IGZyb20gJy4uL3V0aWwvZnVuY3Rpb25zJztcclxuXHJcbmZ1bmN0aW9uIHJldHVybkVycm9yKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSwgZXJyb3I6IGFueSkge1xyXG4gIHJlcS5sb2dnZXIuZXJyb3IoZXJyb3IpO1xyXG4gIHJlc1xyXG4gICAgLnN0YXR1cyg1MDApXHJcbiAgICAuanNvbih7IHN0YXR1czogJ0Vycm9yJywgbWVzc2FnZTogJ0Vycm8gYW8gZW52aWFyIHN0YXR1cy4nLCBlcnJvcjogZXJyb3IgfSk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHJldHVyblN1Y2VzcyhyZXM6IFJlc3BvbnNlLCBkYXRhOiBhbnkpIHtcclxuICByZXMuc3RhdHVzKDIwMSkuanNvbih7IHN0YXR1czogJ3N1Y2Nlc3MnLCByZXNwb25zZTogZGF0YSwgbWFwcGVyOiAncmV0dXJuJyB9KTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNlbmRUZXh0U3RvcmllKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSkge1xyXG4gIC8qKlxyXG4gICAgICNzd2FnZ2VyLnRhZ3MgPSBbXCJTdGF0dXMgU3Rvcmllc1wiXVxyXG4gICAgICNzd2FnZ2VyLmF1dG9Cb2R5PWZhbHNlXHJcbiAgICAgI3N3YWdnZXIuc2VjdXJpdHkgPSBbe1xyXG4gICAgICAgICAgICBcImJlYXJlckF1dGhcIjogW11cclxuICAgICB9XVxyXG4gICAgICNzd2FnZ2VyLnBhcmFtZXRlcnNbXCJzZXNzaW9uXCJdID0ge1xyXG4gICAgICBzY2hlbWE6ICdORVJEV0hBVFNfQU1FUklDQSdcclxuICAgICB9XHJcbiAgICAgI3N3YWdnZXIucGFyYW1ldGVyc1tcIm9ialwiXSA9IHtcclxuICAgICAgaW46ICdib2R5JyxcclxuICAgICAgc2NoZW1hOiB7XHJcbiAgICAgICAgdGV4dDogJ015IG5ldyBzdG9yaWUnLFxyXG4gICAgICAgIG9wdGlvbnM6IHsgYmFja2dyb3VuZENvbG9yOiAnIzAyNzVkOCcsIGZvbnQ6IDJ9LFxyXG4gICAgICB9XHJcbiAgICAgfVxyXG4gICAgICNzd2FnZ2VyLnJlcXVlc3RCb2R5ID0ge1xyXG4gICAgICByZXF1aXJlZDogdHJ1ZSxcclxuICAgICAgY29udGVudDoge1xyXG4gICAgICAgICdhcHBsaWNhdGlvbi9qc29uJzoge1xyXG4gICAgICAgICAgc2NoZW1hOiB7XHJcbiAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxyXG4gICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgdGV4dDogeyB0eXBlOiAnc3RyaW5nJyB9LFxyXG4gICAgICAgICAgICAgIG9wdGlvbnM6IHsgdHlwZTogJ29iamVjdCcgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgcmVxdWlyZWQ6IFsndGV4dCddLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIGV4YW1wbGVzOiB7XHJcbiAgICAgICAgICAgICdEZWZhdWx0Jzoge1xyXG4gICAgICAgICAgICAgIHZhbHVlOiB7XHJcbiAgICAgICAgICAgICAgICB0ZXh0OiAnTXkgbmV3IHN0b3JpZScsXHJcbiAgICAgICAgICAgICAgICBvcHRpb25zOiB7IGJhY2tncm91bmRDb2xvcjogJyMwMjc1ZDgnLCBmb250OiAyfSxcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgfVxyXG4gICAqL1xyXG4gIGNvbnN0IHsgdGV4dCwgb3B0aW9ucyB9ID0gcmVxLmJvZHk7XHJcblxyXG4gIGlmICghdGV4dClcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDQwMSkuc2VuZCh7XHJcbiAgICAgIG1lc3NhZ2U6ICdUZXh0IHdhcyBub3QgaW5mb3JtZWQnLFxyXG4gICAgfSk7XHJcblxyXG4gIHRyeSB7XHJcbiAgICBjb25zdCByZXN1bHRzOiBhbnkgPSBbXTtcclxuICAgIHJlc3VsdHMucHVzaChhd2FpdCByZXEuY2xpZW50LnNlbmRUZXh0U3RhdHVzKHRleHQsIG9wdGlvbnMpKTtcclxuXHJcbiAgICBpZiAocmVzdWx0cy5sZW5ndGggPT09IDApXHJcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbignRXJyb3Igc2VuZGluZyB0aGUgdGV4dCBvZiBzdG9yaWVzJyk7XHJcbiAgICByZXR1cm5TdWNlc3MocmVzLCByZXN1bHRzKTtcclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgcmV0dXJuRXJyb3IocmVxLCByZXMsIGVycm9yKTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzZW5kSW1hZ2VTdG9yaWUocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKSB7XHJcbiAgLyoqXHJcbiAgICAgI3N3YWdnZXIudGFncyA9IFtcIlN0YXR1cyBTdG9yaWVzXCJdXHJcbiAgICAgI3N3YWdnZXIuYXV0b0JvZHk9ZmFsc2VcclxuICAgICAjc3dhZ2dlci5zZWN1cml0eSA9IFt7XHJcbiAgICAgICAgICAgIFwiYmVhcmVyQXV0aFwiOiBbXVxyXG4gICAgIH1dXHJcbiAgICAgI3N3YWdnZXIucGFyYW1ldGVyc1tcInNlc3Npb25cIl0gPSB7XHJcbiAgICAgIHNjaGVtYTogJ05FUkRXSEFUU19BTUVSSUNBJ1xyXG4gICAgIH1cclxuICAgICAjc3dhZ2dlci5yZXF1ZXN0Qm9keSA9IHtcclxuICAgICAgcmVxdWlyZWQ6IHRydWUsXHJcbiAgICAgIGNvbnRlbnQ6IHtcclxuICAgICAgICAnYXBwbGljYXRpb24vanNvbic6IHtcclxuICAgICAgICAgIHNjaGVtYToge1xyXG4gICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcclxuICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgIHBhdGg6IHsgdHlwZTogJ3N0cmluZycgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgcmVxdWlyZWQ6IFsncGF0aCddLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIGV4YW1wbGVzOiB7XHJcbiAgICAgICAgICAgICdEZWZhdWx0Jzoge1xyXG4gICAgICAgICAgICAgIHZhbHVlOiB7XHJcbiAgICAgICAgICAgICAgICBwYXRoOiAnUGF0aCBvZiB5b3VyIGltYWdlJyxcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgfVxyXG4gICAqL1xyXG4gIGNvbnN0IHsgcGF0aCB9ID0gcmVxLmJvZHk7XHJcblxyXG4gIGlmICghcGF0aCAmJiAhcmVxLmZpbGUpXHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDEpLnNlbmQoe1xyXG4gICAgICBtZXNzYWdlOiAnU2VuZGluZyB0aGUgaW1hZ2UgaXMgbWFuZGF0b3J5JyxcclxuICAgIH0pO1xyXG5cclxuICBjb25zdCBwYXRoRmlsZSA9IHBhdGggfHwgcmVxLmZpbGU/LnBhdGg7XHJcblxyXG4gIHRyeSB7XHJcbiAgICBjb25zdCByZXN1bHRzOiBhbnkgPSBbXTtcclxuICAgIHJlc3VsdHMucHVzaChhd2FpdCByZXEuY2xpZW50LnNlbmRJbWFnZVN0YXR1cyhwYXRoRmlsZSkpO1xyXG5cclxuICAgIGlmIChyZXN1bHRzLmxlbmd0aCA9PT0gMClcclxuICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKCdFcnJvciBzZW5kaW5nIHRoZSBpbWFnZSBvZiBzdG9yaWVzJyk7XHJcbiAgICByZXR1cm5TdWNlc3MocmVzLCByZXN1bHRzKTtcclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgcmV0dXJuRXJyb3IocmVxLCByZXMsIGVycm9yKTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzZW5kVmlkZW9TdG9yaWUocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKSB7XHJcbiAgLyoqXHJcbiAgICAgI3N3YWdnZXIudGFncyA9IFtcIlN0YXR1cyBTdG9yaWVzXCJdXHJcbiAgICAgI3N3YWdnZXIuYXV0b0JvZHk9ZmFsc2VcclxuICAgICAjc3dhZ2dlci5zZWN1cml0eSA9IFt7XHJcbiAgICAgICAgICAgIFwiYmVhcmVyQXV0aFwiOiBbXVxyXG4gICAgIH1dXHJcbiAgICAgI3N3YWdnZXIucGFyYW1ldGVyc1tcInNlc3Npb25cIl0gPSB7XHJcbiAgICAgIHNjaGVtYTogJ05FUkRXSEFUU19BTUVSSUNBJ1xyXG4gICAgIH1cclxuICAgICAjc3dhZ2dlci5yZXF1ZXN0Qm9keSA9IHtcclxuICAgICAgcmVxdWlyZWQ6IHRydWUsXHJcbiAgICAgIGNvbnRlbnQ6IHtcclxuICAgICAgICBcImFwcGxpY2F0aW9uL2pzb25cIjoge1xyXG4gICAgICAgICAgc2NoZW1hOiB7XHJcbiAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICBwYXRoOiB7IHR5cGU6IFwic3RyaW5nXCIgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICByZXF1aXJlZDogW1wicGF0aFwiXVxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIGV4YW1wbGVzOiB7XHJcbiAgICAgICAgICAgIFwiRGVmYXVsdFwiOiB7XHJcbiAgICAgICAgICAgICAgdmFsdWU6IHtcclxuICAgICAgICAgICAgICAgIHBhdGg6IFwiUGF0aCBvZiB5b3VyIHZpZGVvXCJcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgKi9cclxuICBjb25zdCB7IHBhdGggfSA9IHJlcS5ib2R5O1xyXG5cclxuICBpZiAoIXBhdGggJiYgIXJlcS5maWxlKVxyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAxKS5zZW5kKHtcclxuICAgICAgbWVzc2FnZTogJ1NlbmRpbmcgdGhlIFZpZGVvIGlzIG1hbmRhdG9yeScsXHJcbiAgICB9KTtcclxuXHJcbiAgY29uc3QgcGF0aEZpbGUgPSBwYXRoIHx8IHJlcS5maWxlPy5wYXRoO1xyXG5cclxuICB0cnkge1xyXG4gICAgY29uc3QgcmVzdWx0czogYW55ID0gW107XHJcblxyXG4gICAgcmVzdWx0cy5wdXNoKGF3YWl0IHJlcS5jbGllbnQuc2VuZFZpZGVvU3RhdHVzKHBhdGhGaWxlKSk7XHJcblxyXG4gICAgaWYgKHJlc3VsdHMubGVuZ3RoID09PSAwKVxyXG4gICAgICByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oJ0Vycm9yIHNlbmRpbmcgbWVzc2FnZScpO1xyXG4gICAgaWYgKHJlcS5maWxlKSBhd2FpdCB1bmxpbmtBc3luYyhwYXRoRmlsZSk7XHJcbiAgICByZXR1cm5TdWNlc3MocmVzLCByZXN1bHRzKTtcclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgcmV0dXJuRXJyb3IocmVxLCBy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