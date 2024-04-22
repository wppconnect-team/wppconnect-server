"use strict";var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");Object.defineProperty(exports, "__esModule", { value: true });exports.backupAllSessions = backupAllSessions;exports.clearSessionData = clearSessionData;exports.restoreAllSessions = restoreAllSessions;exports.setLimit = setLimit;exports.takeScreenshot = takeScreenshot;
















var _fs = _interopRequireDefault(require("fs"));

var _ = require("..");
var _config = _interopRequireDefault(require("../config"));
var _manageSession = require("../util/manageSession");
var _sessionUtil = require("../util/sessionUtil"); /*
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
 */async function backupAllSessions(req, res) {/**
     * #swagger.tags = ["Misc"]
     * #swagger.description = 'Please, open the router in your browser, in swagger this not run'
     * #swagger.produces = ['application/octet-stream']
     * #swagger.consumes = ['application/octet-stream']
       #swagger.autoBody=false
       #swagger.parameters["secretkey"] = {
          required: true,
          schema: 'THISISMYSECURETOKEN'
       }
       #swagger.responses[200] = {
        description: 'A ZIP file contaings your backup. Please, open this link in your browser',
        content: {
          "application/zip": {
            schema: {}
          }
        },
      }
     */const { secretkey } = req.params;if (secretkey !== _config.default.secretKey) {return res.status(400).json({ response: 'error', message: 'The token is incorrect' });}try {res.setHeader('Content-Type', 'application/zip');
    return res.send(await (0, _manageSession.backupSessions)(req));
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: 'Error on backup session',
      error: error
    });
  }
}

async function restoreAllSessions(req, res) {
  /**
   #swagger.tags = ["Misc"]
   #swagger.autoBody=false
    #swagger.parameters["secretkey"] = {
    required: true,
    schema: 'THISISMYSECURETOKEN'
    }
    #swagger.requestBody = {
      required: true,
      content: {
        "multipart/form-data": {
          schema: {
            type: 'object',
            properties: {
              file: {
                type: "string",
                format: "binary"
              }
            },
            required: ['file'],
          }
        }
      }
    }
  */
  const { secretkey } = req.params;

  if (secretkey !== _config.default.secretKey) {
    return res.status(400).json({
      response: 'error',
      message: 'The token is incorrect'
    });
  }

  try {
    const result = await (0, _manageSession.restoreSessions)(req, req.file);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: 'Error on restore session',
      error: error
    });
  }
}

async function takeScreenshot(req, res) {
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
    const result = await req.client.takeScreenshot();
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: 'Error on take screenshot',
      error: error
    });
  }
}

async function clearSessionData(req, res) {
  /**
   #swagger.tags = ["Misc"]
   #swagger.autoBody=false
    #swagger.parameters["secretkey"] = {
    required: true,
    schema: 'THISISMYSECURETOKEN'
    }
    #swagger.parameters["session"] = {
    schema: 'NERDWHATS_AMERICA'
    }
  */

  try {
    const { secretkey, session } = req.params;

    if (secretkey !== _config.default.secretKey) {
      return res.status(400).json({
        response: 'error',
        message: 'The token is incorrect'
      });
    }
    if (req?.client?.page) {
      delete _sessionUtil.clientsArray[req.params.session];
      await req.client.logout();
    }
    const path = _config.default.customUserDataDir + session;
    const pathToken = __dirname + `../../../tokens/${session}.data.json`;
    if (_fs.default.existsSync(path)) {
      await _fs.default.promises.rm(path, {
        recursive: true
      });
    }
    if (_fs.default.existsSync(pathToken)) {
      await _fs.default.promises.rm(pathToken);
    }
    return res.status(200).json({ success: true });
  } catch (error) {
    _.logger.error(error);
    return res.status(500).json({
      status: false,
      message: 'Error on clear session data',
      error: error
    });
  }
}

async function setLimit(req, res) {
  /**
   #swagger.tags = ["Misc"]
   #swagger.description = 'Change limits of whatsapp web. Types value: maxMediaSize, maxFileSize, maxShare, statusVideoMaxDuration, unlimitedPin;'
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
              type: { type: 'string' },
              value: { type: 'any' },
            },
            required: ['type', 'value'],
          },
          examples: {
            'Default': {
              value: {
                type: 'maxFileSize',
                value: 104857600
              },
            },
          },
        },
      },
    }
  */

  try {
    const { type, value } = req.body;
    if (!type || !value) throw new Error('Send de type and value');

    const result = await req.client.setLimit(type, value);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: 'Error on set limit',
      error: error
    });
  }
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfZnMiLCJfaW50ZXJvcFJlcXVpcmVEZWZhdWx0IiwicmVxdWlyZSIsIl8iLCJfY29uZmlnIiwiX21hbmFnZVNlc3Npb24iLCJfc2Vzc2lvblV0aWwiLCJiYWNrdXBBbGxTZXNzaW9ucyIsInJlcSIsInJlcyIsInNlY3JldGtleSIsInBhcmFtcyIsImNvbmZpZyIsInNlY3JldEtleSIsInN0YXR1cyIsImpzb24iLCJyZXNwb25zZSIsIm1lc3NhZ2UiLCJzZXRIZWFkZXIiLCJzZW5kIiwiYmFja3VwU2Vzc2lvbnMiLCJlcnJvciIsInJlc3RvcmVBbGxTZXNzaW9ucyIsInJlc3VsdCIsInJlc3RvcmVTZXNzaW9ucyIsImZpbGUiLCJ0YWtlU2NyZWVuc2hvdCIsImNsaWVudCIsImNsZWFyU2Vzc2lvbkRhdGEiLCJzZXNzaW9uIiwicGFnZSIsImNsaWVudHNBcnJheSIsImxvZ291dCIsInBhdGgiLCJjdXN0b21Vc2VyRGF0YURpciIsInBhdGhUb2tlbiIsIl9fZGlybmFtZSIsImZzIiwiZXhpc3RzU3luYyIsInByb21pc2VzIiwicm0iLCJyZWN1cnNpdmUiLCJzdWNjZXNzIiwibG9nZ2VyIiwic2V0TGltaXQiLCJ0eXBlIiwidmFsdWUiLCJib2R5IiwiRXJyb3IiXSwic291cmNlcyI6WyIuLi8uLi9zcmMvY29udHJvbGxlci9taXNjQ29udHJvbGxlci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKlxyXG4gKiBDb3B5cmlnaHQgMjAyMyBXUFBDb25uZWN0IFRlYW1cclxuICpcclxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcclxuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxyXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcclxuICpcclxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxyXG4gKlxyXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXHJcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcclxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXHJcbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcclxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXHJcbiAqL1xyXG5cclxuaW1wb3J0IHsgUmVxdWVzdCwgUmVzcG9uc2UgfSBmcm9tICdleHByZXNzJztcclxuaW1wb3J0IGZzIGZyb20gJ2ZzJztcclxuXHJcbmltcG9ydCB7IGxvZ2dlciB9IGZyb20gJy4uJztcclxuaW1wb3J0IGNvbmZpZyBmcm9tICcuLi9jb25maWcnO1xyXG5pbXBvcnQgeyBiYWNrdXBTZXNzaW9ucywgcmVzdG9yZVNlc3Npb25zIH0gZnJvbSAnLi4vdXRpbC9tYW5hZ2VTZXNzaW9uJztcclxuaW1wb3J0IHsgY2xpZW50c0FycmF5IH0gZnJvbSAnLi4vdXRpbC9zZXNzaW9uVXRpbCc7XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gYmFja3VwQWxsU2Vzc2lvbnMocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKSB7XHJcbiAgLyoqXHJcbiAgICAgKiAjc3dhZ2dlci50YWdzID0gW1wiTWlzY1wiXVxyXG4gICAgICogI3N3YWdnZXIuZGVzY3JpcHRpb24gPSAnUGxlYXNlLCBvcGVuIHRoZSByb3V0ZXIgaW4geW91ciBicm93c2VyLCBpbiBzd2FnZ2VyIHRoaXMgbm90IHJ1bidcclxuICAgICAqICNzd2FnZ2VyLnByb2R1Y2VzID0gWydhcHBsaWNhdGlvbi9vY3RldC1zdHJlYW0nXVxyXG4gICAgICogI3N3YWdnZXIuY29uc3VtZXMgPSBbJ2FwcGxpY2F0aW9uL29jdGV0LXN0cmVhbSddXHJcbiAgICAgICAjc3dhZ2dlci5hdXRvQm9keT1mYWxzZVxyXG4gICAgICAgI3N3YWdnZXIucGFyYW1ldGVyc1tcInNlY3JldGtleVwiXSA9IHtcclxuICAgICAgICAgIHJlcXVpcmVkOiB0cnVlLFxyXG4gICAgICAgICAgc2NoZW1hOiAnVEhJU0lTTVlTRUNVUkVUT0tFTidcclxuICAgICAgIH1cclxuICAgICAgICNzd2FnZ2VyLnJlc3BvbnNlc1syMDBdID0ge1xyXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnQSBaSVAgZmlsZSBjb250YWluZ3MgeW91ciBiYWNrdXAuIFBsZWFzZSwgb3BlbiB0aGlzIGxpbmsgaW4geW91ciBicm93c2VyJyxcclxuICAgICAgICBjb250ZW50OiB7XHJcbiAgICAgICAgICBcImFwcGxpY2F0aW9uL3ppcFwiOiB7XHJcbiAgICAgICAgICAgIHNjaGVtYToge31cclxuICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICB9XHJcbiAgICAgKi9cclxuICBjb25zdCB7IHNlY3JldGtleSB9ID0gcmVxLnBhcmFtcztcclxuXHJcbiAgaWYgKHNlY3JldGtleSAhPT0gY29uZmlnLnNlY3JldEtleSkge1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHtcclxuICAgICAgcmVzcG9uc2U6ICdlcnJvcicsXHJcbiAgICAgIG1lc3NhZ2U6ICdUaGUgdG9rZW4gaXMgaW5jb3JyZWN0JyxcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgdHJ5IHtcclxuICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi96aXAnKTtcclxuICAgIHJldHVybiByZXMuc2VuZChhd2FpdCBiYWNrdXBTZXNzaW9ucyhyZXEpKTtcclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgc3RhdHVzOiBmYWxzZSxcclxuICAgICAgbWVzc2FnZTogJ0Vycm9yIG9uIGJhY2t1cCBzZXNzaW9uJyxcclxuICAgICAgZXJyb3I6IGVycm9yLFxyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVzdG9yZUFsbFNlc3Npb25zKHJlcTogUmVxdWVzdCwgcmVzOiBSZXNwb25zZSkge1xyXG4gIC8qKlxyXG4gICAjc3dhZ2dlci50YWdzID0gW1wiTWlzY1wiXVxyXG4gICAjc3dhZ2dlci5hdXRvQm9keT1mYWxzZVxyXG4gICAgI3N3YWdnZXIucGFyYW1ldGVyc1tcInNlY3JldGtleVwiXSA9IHtcclxuICAgIHJlcXVpcmVkOiB0cnVlLFxyXG4gICAgc2NoZW1hOiAnVEhJU0lTTVlTRUNVUkVUT0tFTidcclxuICAgIH1cclxuICAgICNzd2FnZ2VyLnJlcXVlc3RCb2R5ID0ge1xyXG4gICAgICByZXF1aXJlZDogdHJ1ZSxcclxuICAgICAgY29udGVudDoge1xyXG4gICAgICAgIFwibXVsdGlwYXJ0L2Zvcm0tZGF0YVwiOiB7XHJcbiAgICAgICAgICBzY2hlbWE6IHtcclxuICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXHJcbiAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICBmaWxlOiB7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiBcInN0cmluZ1wiLFxyXG4gICAgICAgICAgICAgICAgZm9ybWF0OiBcImJpbmFyeVwiXHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICByZXF1aXJlZDogWydmaWxlJ10sXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgKi9cclxuICBjb25zdCB7IHNlY3JldGtleSB9ID0gcmVxLnBhcmFtcztcclxuXHJcbiAgaWYgKHNlY3JldGtleSAhPT0gY29uZmlnLnNlY3JldEtleSkge1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAwKS5qc29uKHtcclxuICAgICAgcmVzcG9uc2U6ICdlcnJvcicsXHJcbiAgICAgIG1lc3NhZ2U6ICdUaGUgdG9rZW4gaXMgaW5jb3JyZWN0JyxcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHJlc3RvcmVTZXNzaW9ucyhyZXEsIHJlcS5maWxlIGFzIGFueSk7XHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24ocmVzdWx0KTtcclxuICB9IGNhdGNoIChlcnJvcjogYW55KSB7XHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oe1xyXG4gICAgICBzdGF0dXM6IGZhbHNlLFxyXG4gICAgICBtZXNzYWdlOiAnRXJyb3Igb24gcmVzdG9yZSBzZXNzaW9uJyxcclxuICAgICAgZXJyb3I6IGVycm9yLFxyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdGFrZVNjcmVlbnNob3QocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKSB7XHJcbiAgLyoqXHJcbiAgICNzd2FnZ2VyLnRhZ3MgPSBbXCJNaXNjXCJdXHJcbiAgICNzd2FnZ2VyLmF1dG9Cb2R5PWZhbHNlXHJcbiAgICAjc3dhZ2dlci5zZWN1cml0eSA9IFt7XHJcbiAgICAgICAgICBcImJlYXJlckF1dGhcIjogW11cclxuICAgIH1dXHJcbiAgICAjc3dhZ2dlci5wYXJhbWV0ZXJzW1wic2Vzc2lvblwiXSA9IHtcclxuICAgIHNjaGVtYTogJ05FUkRXSEFUU19BTUVSSUNBJ1xyXG4gICAgfVxyXG4gICovXHJcblxyXG4gIHRyeSB7XHJcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCByZXEuY2xpZW50LnRha2VTY3JlZW5zaG90KCk7XHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24ocmVzdWx0KTtcclxuICB9IGNhdGNoIChlcnJvcjogYW55KSB7XHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oe1xyXG4gICAgICBzdGF0dXM6IGZhbHNlLFxyXG4gICAgICBtZXNzYWdlOiAnRXJyb3Igb24gdGFrZSBzY3JlZW5zaG90JyxcclxuICAgICAgZXJyb3I6IGVycm9yLFxyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY2xlYXJTZXNzaW9uRGF0YShyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpIHtcclxuICAvKipcclxuICAgI3N3YWdnZXIudGFncyA9IFtcIk1pc2NcIl1cclxuICAgI3N3YWdnZXIuYXV0b0JvZHk9ZmFsc2VcclxuICAgICNzd2FnZ2VyLnBhcmFtZXRlcnNbXCJzZWNyZXRrZXlcIl0gPSB7XHJcbiAgICByZXF1aXJlZDogdHJ1ZSxcclxuICAgIHNjaGVtYTogJ1RISVNJU01ZU0VDVVJFVE9LRU4nXHJcbiAgICB9XHJcbiAgICAjc3dhZ2dlci5wYXJhbWV0ZXJzW1wic2Vzc2lvblwiXSA9IHtcclxuICAgIHNjaGVtYTogJ05FUkRXSEFUU19BTUVSSUNBJ1xyXG4gICAgfVxyXG4gICovXHJcblxyXG4gIHRyeSB7XHJcbiAgICBjb25zdCB7IHNlY3JldGtleSwgc2Vzc2lvbiB9ID0gcmVxLnBhcmFtcztcclxuXHJcbiAgICBpZiAoc2VjcmV0a2V5ICE9PSBjb25maWcuc2VjcmV0S2V5KSB7XHJcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7XHJcbiAgICAgICAgcmVzcG9uc2U6ICdlcnJvcicsXHJcbiAgICAgICAgbWVzc2FnZTogJ1RoZSB0b2tlbiBpcyBpbmNvcnJlY3QnLFxyXG4gICAgICB9KTtcclxuICAgIH1cclxuICAgIGlmIChyZXE/LmNsaWVudD8ucGFnZSkge1xyXG4gICAgICBkZWxldGUgY2xpZW50c0FycmF5W3JlcS5wYXJhbXMuc2Vzc2lvbl07XHJcbiAgICAgIGF3YWl0IHJlcS5jbGllbnQubG9nb3V0KCk7XHJcbiAgICB9XHJcbiAgICBjb25zdCBwYXRoID0gY29uZmlnLmN1c3RvbVVzZXJEYXRhRGlyICsgc2Vzc2lvbjtcclxuICAgIGNvbnN0IHBhdGhUb2tlbiA9IF9fZGlybmFtZSArIGAuLi8uLi8uLi90b2tlbnMvJHtzZXNzaW9ufS5kYXRhLmpzb25gO1xyXG4gICAgaWYgKGZzLmV4aXN0c1N5bmMocGF0aCkpIHtcclxuICAgICAgYXdhaXQgZnMucHJvbWlzZXMucm0ocGF0aCwge1xyXG4gICAgICAgIHJlY3Vyc2l2ZTogdHJ1ZSxcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBpZiAoZnMuZXhpc3RzU3luYyhwYXRoVG9rZW4pKSB7XHJcbiAgICAgIGF3YWl0IGZzLnByb21pc2VzLnJtKHBhdGhUb2tlbik7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cygyMDApLmpzb24oeyBzdWNjZXNzOiB0cnVlIH0pO1xyXG4gIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcclxuICAgIGxvZ2dlci5lcnJvcihlcnJvcik7XHJcbiAgICByZXR1cm4gcmVzLnN0YXR1cyg1MDApLmpzb24oe1xyXG4gICAgICBzdGF0dXM6IGZhbHNlLFxyXG4gICAgICBtZXNzYWdlOiAnRXJyb3Igb24gY2xlYXIgc2Vzc2lvbiBkYXRhJyxcclxuICAgICAgZXJyb3I6IGVycm9yLFxyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2V0TGltaXQocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKSB7XHJcbiAgLyoqXHJcbiAgICNzd2FnZ2VyLnRhZ3MgPSBbXCJNaXNjXCJdXHJcbiAgICNzd2FnZ2VyLmRlc2NyaXB0aW9uID0gJ0NoYW5nZSBsaW1pdHMgb2Ygd2hhdHNhcHAgd2ViLiBUeXBlcyB2YWx1ZTogbWF4TWVkaWFTaXplLCBtYXhGaWxlU2l6ZSwgbWF4U2hhcmUsIHN0YXR1c1ZpZGVvTWF4RHVyYXRpb24sIHVubGltaXRlZFBpbjsnXHJcbiAgICNzd2FnZ2VyLmF1dG9Cb2R5PWZhbHNlXHJcbiAgICAjc3dhZ2dlci5zZWN1cml0eSA9IFt7XHJcbiAgICAgICAgICBcImJlYXJlckF1dGhcIjogW11cclxuICAgIH1dXHJcbiAgICAjc3dhZ2dlci5wYXJhbWV0ZXJzW1wic2Vzc2lvblwiXSA9IHtcclxuICAgIHNjaGVtYTogJ05FUkRXSEFUU19BTUVSSUNBJ1xyXG4gICAgfVxyXG4gICAgICNzd2FnZ2VyLnJlcXVlc3RCb2R5ID0ge1xyXG4gICAgICByZXF1aXJlZDogdHJ1ZSxcclxuICAgICAgY29udGVudDoge1xyXG4gICAgICAgICdhcHBsaWNhdGlvbi9qc29uJzoge1xyXG4gICAgICAgICAgc2NoZW1hOiB7XHJcbiAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxyXG4gICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgdHlwZTogeyB0eXBlOiAnc3RyaW5nJyB9LFxyXG4gICAgICAgICAgICAgIHZhbHVlOiB7IHR5cGU6ICdhbnknIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHJlcXVpcmVkOiBbJ3R5cGUnLCAndmFsdWUnXSxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICBleGFtcGxlczoge1xyXG4gICAgICAgICAgICAnRGVmYXVsdCc6IHtcclxuICAgICAgICAgICAgICB2YWx1ZToge1xyXG4gICAgICAgICAgICAgICAgdHlwZTogJ21heEZpbGVTaXplJyxcclxuICAgICAgICAgICAgICAgIHZhbHVlOiAxMDQ4NTc2MDBcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgfVxyXG4gICovXHJcblxyXG4gIHRyeSB7XHJcbiAgICBjb25zdCB7IHR5cGUsIHZhbHVlIH0gPSByZXEuYm9keTtcclxuICAgIGlmICghdHlwZSB8fCAhdmFsdWUpIHRocm93IG5ldyBFcnJvcignU2VuZCBkZSB0eXBlIGFuZCB2YWx1ZScpO1xyXG5cclxuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHJlcS5jbGllbnQuc2V0TGltaXQodHlwZSwgdmFsdWUpO1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5qc29uKHJlc3VsdCk7XHJcbiAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgc3RhdHVzOiBmYWxzZSxcclxuICAgICAgbWVzc2FnZTogJ0Vycm9yIG9uIHNldCBsaW1pdCcsXHJcbiAgICAgIGVycm9yOiBlcnJvcixcclxuICAgIH0pO1xyXG4gIH1cclxufVxyXG4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBaUJBLElBQUFBLEdBQUEsR0FBQUMsc0JBQUEsQ0FBQUMsT0FBQTs7QUFFQSxJQUFBQyxDQUFBLEdBQUFELE9BQUE7QUFDQSxJQUFBRSxPQUFBLEdBQUFILHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBRyxjQUFBLEdBQUFILE9BQUE7QUFDQSxJQUFBSSxZQUFBLEdBQUFKLE9BQUEsd0JBQW1ELENBdEJuRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FVTyxlQUFlSyxpQkFBaUJBLENBQUNDLEdBQVksRUFBRUMsR0FBYSxFQUFFLENBQ25FO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BQ0UsTUFBTSxFQUFFQyxTQUFTLENBQUMsQ0FBQyxHQUFHRixHQUFHLENBQUNHLE1BQU0sQ0FFaEMsSUFBSUQsU0FBUyxLQUFLRSxlQUFNLENBQUNDLFNBQVMsRUFBRSxDQUNsQyxPQUFPSixHQUFHLENBQUNLLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQ0MsSUFBSSxDQUFDLEVBQzFCQyxRQUFRLEVBQUUsT0FBTyxFQUNq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