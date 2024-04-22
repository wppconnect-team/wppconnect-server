"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.addNewLabel = addNewLabel;exports.addOrRemoveLabels = addOrRemoveLabels;exports.deleteAllLabels = deleteAllLabels;exports.deleteLabel = deleteLabel;exports.getAllLabels = getAllLabels; /*
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



async function addNewLabel(req, res) {
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
  return res.status(401).send({
    message: 'Name was not informed'
  });

  try {
    const result = await req.client.addNewLabel(name, options);
    res.status(201).json({ status: 'success', response: result });
  } catch (error) {
    res.status(500).json({
      status: 'Error',
      message: 'Erro ao adicionar etiqueta.',
      error: error
    });
  }
}

async function addOrRemoveLabels(req, res) {
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
  return res.status(401).send({
    message: 'chatIds or options was not informed'
  });

  try {
    const result = await req.client.addOrRemoveLabels(chatIds, options);
    res.status(201).json({ status: 'success', response: result });
  } catch (error) {
    res.status(500).json({
      status: 'Error',
      message: 'Erro ao adicionar/deletar etiqueta.',
      error: error
    });
  }
}

async function getAllLabels(req, res) {
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
      error: error
    });
  }
}

async function deleteAllLabels(req, res) {
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
      error: error
    });
  }
}

async function deleteLabel(req, res) {
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
      error: error
    });
  }
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJhZGROZXdMYWJlbCIsInJlcSIsInJlcyIsIm5hbWUiLCJvcHRpb25zIiwiYm9keSIsInN0YXR1cyIsInNlbmQiLCJtZXNzYWdlIiwicmVzdWx0IiwiY2xpZW50IiwianNvbiIsInJlc3BvbnNlIiwiZXJyb3IiLCJhZGRPclJlbW92ZUxhYmVscyIsImNoYXRJZHMiLCJnZXRBbGxMYWJlbHMiLCJkZWxldGVBbGxMYWJlbHMiLCJkZWxldGVMYWJlbCIsImlkIiwicGFyYW1zIl0sInNvdXJjZXMiOlsiLi4vLi4vc3JjL2NvbnRyb2xsZXIvbGFiZWxzQ29udHJvbGxlci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKlxyXG4gKiBDb3B5cmlnaHQgMjAyMSBXUFBDb25uZWN0IFRlYW1cclxuICpcclxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcclxuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxyXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcclxuICpcclxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxyXG4gKlxyXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXHJcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcclxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXHJcbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcclxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXHJcbiAqL1xyXG5cclxuaW1wb3J0IHsgUmVxdWVzdCwgUmVzcG9uc2UgfSBmcm9tICdleHByZXNzJztcclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBhZGROZXdMYWJlbChyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpIHtcclxuICAvKipcclxuICAgICAjc3dhZ2dlci50YWdzID0gW1wiTGFiZWxzXCJdXHJcbiAgICAgI3N3YWdnZXIuYXV0b0JvZHk9ZmFsc2VcclxuICAgICAjc3dhZ2dlci5zZWN1cml0eSA9IFt7XHJcbiAgICAgICAgICAgIFwiYmVhcmVyQXV0aFwiOiBbXVxyXG4gICAgIH1dXHJcbiAgICAgI3N3YWdnZXIucGFyYW1ldGVyc1tcInNlc3Npb25cIl0gPSB7XHJcbiAgICAgIHNjaGVtYTogJ05FUkRXSEFUU19BTUVSSUNBJ1xyXG4gICAgIH1cclxuICAgICAjc3dhZ2dlci5yZXF1ZXN0Qm9keSA9IHtcclxuICAgICAgcmVxdWlyZWQ6IHRydWUsXHJcbiAgICAgIGNvbnRlbnQ6IHtcclxuICAgICAgICBcImFwcGxpY2F0aW9uL2pzb25cIjoge1xyXG4gICAgICAgICAgc2NoZW1hOiB7XHJcbiAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAkbmFtZTogeyB0eXBlOiBcInN0cmluZ1wiIH0sXHJcbiAgICAgICAgICAgICAgJG9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgIGxhYmVsQ29sb3I6IHsgdHlwZTogXCJudW1iZXJcIiB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICByZXF1aXJlZDogW1wibmFtZVwiLCBcIm9wdGlvbnNcIl1cclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICBleGFtcGxlczoge1xyXG4gICAgICAgICAgICBcIkRlZmF1bHRcIjoge1xyXG4gICAgICAgICAgICAgIHZhbHVlOiB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcIk5hbWUgb2YgeW91ciBsYWJlbFwiLFxyXG4gICAgICAgICAgICAgICAgb3B0aW9uczogeyBsYWJlbENvbG9yOiA0MjkyODQ5MzkyIH1cclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgKi9cclxuICBjb25zdCB7IG5hbWUsIG9wdGlvbnMgfSA9IHJlcS5ib2R5O1xyXG4gIGlmICghbmFtZSlcclxuICAgIHJldHVybiByZXMuc3RhdHVzKDQwMSkuc2VuZCh7XHJcbiAgICAgIG1lc3NhZ2U6ICdOYW1lIHdhcyBub3QgaW5mb3JtZWQnLFxyXG4gICAgfSk7XHJcblxyXG4gIHRyeSB7XHJcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCByZXEuY2xpZW50LmFkZE5ld0xhYmVsKG5hbWUsIG9wdGlvbnMpO1xyXG4gICAgcmVzLnN0YXR1cygyMDEpLmpzb24oeyBzdGF0dXM6ICdzdWNjZXNzJywgcmVzcG9uc2U6IHJlc3VsdCB9KTtcclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgcmVzLnN0YXR1cyg1MDApLmpzb24oe1xyXG4gICAgICBzdGF0dXM6ICdFcnJvcicsXHJcbiAgICAgIG1lc3NhZ2U6ICdFcnJvIGFvIGFkaWNpb25hciBldGlxdWV0YS4nLFxyXG4gICAgICBlcnJvcjogZXJyb3IsXHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBhZGRPclJlbW92ZUxhYmVscyhyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpIHtcclxuICAvKipcclxuICAgICAjc3dhZ2dlci50YWdzID0gW1wiTGFiZWxzXCJdXHJcbiAgICAgI3N3YWdnZXIuYXV0b0JvZHk9ZmFsc2VcclxuICAgICAjc3dhZ2dlci5zZWN1cml0eSA9IFt7XHJcbiAgICAgICAgICAgIFwiYmVhcmVyQXV0aFwiOiBbXVxyXG4gICAgIH1dXHJcbiAgICAgI3N3YWdnZXIucGFyYW1ldGVyc1tcInNlc3Npb25cIl0gPSB7XHJcbiAgICAgIHNjaGVtYTogJ05FUkRXSEFUU19BTUVSSUNBJ1xyXG4gICAgIH1cclxuICAgICAjc3dhZ2dlci5yZXF1ZXN0Qm9keSA9IHtcclxuICAgICAgcmVxdWlyZWQ6IHRydWUsXHJcbiAgICAgIGNvbnRlbnQ6IHtcclxuICAgICAgICBcImFwcGxpY2F0aW9uL2pzb25cIjoge1xyXG4gICAgICAgICAgc2NoZW1hOiB7XHJcbiAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICBjaGF0SWRzOiB7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiBcImFycmF5XCIsXHJcbiAgICAgICAgICAgICAgICBpdGVtczoge1xyXG4gICAgICAgICAgICAgICAgICB0eXBlOiBcInN0cmluZ1wiXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICBvcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiBcImFycmF5XCIsXHJcbiAgICAgICAgICAgICAgICBpdGVtczoge1xyXG4gICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGFiZWxJZDogeyB0eXBlOiBcInN0cmluZ1wiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogeyB0eXBlOiBcInN0cmluZ1wiIH1cclxuICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJjaGF0SWRzXCJdXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgZXhhbXBsZXM6IHtcclxuICAgICAgICAgICAgXCJEZWZhdWx0XCI6IHtcclxuICAgICAgICAgICAgICB2YWx1ZToge1xyXG4gICAgICAgICAgICAgICAgY2hhdElkczogW1wiNTUyMTk5OTk5OTk5OVwiXSxcclxuICAgICAgICAgICAgICAgIG9wdGlvbnM6IFtcclxuICAgICAgICAgICAgICAgICAgeyBsYWJlbElkOiBcIjc2XCIsIHR5cGU6IFwiYWRkXCIgfSxcclxuICAgICAgICAgICAgICAgICAgeyBsYWJlbElkOiBcIjc1XCIsIHR5cGU6IFwicmVtb3ZlXCIgfVxyXG4gICAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAqL1xyXG4gIGNvbnN0IHsgY2hhdElkcywgb3B0aW9ucyB9ID0gcmVxLmJvZHk7XHJcbiAgaWYgKCFjaGF0SWRzIHx8ICFvcHRpb25zKVxyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNDAxKS5zZW5kKHtcclxuICAgICAgbWVzc2FnZTogJ2NoYXRJZHMgb3Igb3B0aW9ucyB3YXMgbm90IGluZm9ybWVkJyxcclxuICAgIH0pO1xyXG5cclxuICB0cnkge1xyXG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcmVxLmNsaWVudC5hZGRPclJlbW92ZUxhYmVscyhjaGF0SWRzLCBvcHRpb25zKTtcclxuICAgIHJlcy5zdGF0dXMoMjAxKS5qc29uKHsgc3RhdHVzOiAnc3VjY2VzcycsIHJlc3BvbnNlOiByZXN1bHQgfSk7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIHJlcy5zdGF0dXMoNTAwKS5qc29uKHtcclxuICAgICAgc3RhdHVzOiAnRXJyb3InLFxyXG4gICAgICBtZXNzYWdlOiAnRXJybyBhbyBhZGljaW9uYXIvZGVsZXRhciBldGlxdWV0YS4nLFxyXG4gICAgICBlcnJvcjogZXJyb3IsXHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRBbGxMYWJlbHMocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKSB7XHJcbiAgLyoqXHJcbiAgICAgI3N3YWdnZXIudGFncyA9IFtcIkxhYmVsc1wiXVxyXG4gICAgICNzd2FnZ2VyLmF1dG9Cb2R5PWZhbHNlXHJcbiAgICAgI3N3YWdnZXIuc2VjdXJpdHkgPSBbe1xyXG4gICAgICAgICAgICBcImJlYXJlckF1dGhcIjogW11cclxuICAgICB9XVxyXG4gICAgICNzd2FnZ2VyLnBhcmFtZXRlcnNbXCJzZXNzaW9uXCJdID0ge1xyXG4gICAgICBzY2hlbWE6ICdORVJEV0hBVFNfQU1FUklDQSdcclxuICAgICB9XHJcbiAgICovXHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHJlcS5jbGllbnQuZ2V0QWxsTGFiZWxzKCk7XHJcbiAgICByZXMuc3RhdHVzKDIwMSkuanNvbih7IHN0YXR1czogJ3N1Y2Nlc3MnLCByZXNwb25zZTogcmVzdWx0IH0pO1xyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICByZXMuc3RhdHVzKDUwMCkuanNvbih7XHJcbiAgICAgIHN0YXR1czogJ0Vycm9yJyxcclxuICAgICAgbWVzc2FnZTogJ0Vycm8gYW8gYnVzY2FyIGV0aXF1ZXRhcy4nLFxyXG4gICAgICBlcnJvcjogZXJyb3IsXHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBkZWxldGVBbGxMYWJlbHMocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKSB7XHJcbiAgLyoqXHJcbiAgICAgI3N3YWdnZXIudGFncyA9IFtcIkxhYmVsc1wiXVxyXG4gICAgICNzd2FnZ2VyLmF1dG9Cb2R5PWZhbHNlXHJcbiAgICAgI3N3YWdnZXIuc2VjdXJpdHkgPSBbe1xyXG4gICAgICAgICAgICBcImJlYXJlckF1dGhcIjogW11cclxuICAgICB9XVxyXG4gICAgICNzd2FnZ2VyLnBhcmFtZXRlcnNbXCJzZXNzaW9uXCJdID0ge1xyXG4gICAgICBzY2hlbWE6ICdORVJEV0hBVFNfQU1FUklDQSdcclxuICAgICB9XHJcbiAgICovXHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHJlcS5jbGllbnQuZGVsZXRlQWxsTGFiZWxzKCk7XHJcbiAgICByZXMuc3RhdHVzKDIwMSkuanNvbih7IHN0YXR1czogJ3N1Y2Nlc3MnLCByZXNwb25zZTogcmVzdWx0IH0pO1xyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICByZXMuc3RhdHVzKDUwMCkuanNvbih7XHJcbiAgICAgIHN0YXR1czogJ0Vycm9yJyxcclxuICAgICAgbWVzc2FnZTogJ0Vycm8gYW8gZGVsZXRhciB0b2RhcyBhcyBldGlxdWV0YXMuJyxcclxuICAgICAgZXJyb3I6IGVycm9yLFxyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZGVsZXRlTGFiZWwocmVxOiBSZXF1ZXN0LCByZXM6IFJlc3BvbnNlKSB7XHJcbiAgLyoqXHJcbiAgICAgI3N3YWdnZXIudGFncyA9IFtcIkxhYmVsc1wiXVxyXG4gICAgICNzd2FnZ2VyLmF1dG9Cb2R5PWZhbHNlXHJcbiAgICAgI3N3YWdnZXIuc2VjdXJpdHkgPSBbe1xyXG4gICAgICAgICAgICBcImJlYXJlckF1dGhcIjogW11cclxuICAgICB9XVxyXG4gICAgICNzd2FnZ2VyLnBhcmFtZXRlcnNbXCJzZXNzaW9uXCJdID0ge1xyXG4gICAgICBzY2hlbWE6ICdORVJEV0hBVFNfQU1FUklDQSdcclxuICAgICB9XHJcbiAgICAgI3N3YWdnZXIucGFyYW1ldGVyc1tcImlkXCJdID0ge1xyXG4gICAgICBzY2hlbWE6ICc8bGFiZWxJZD4nXHJcbiAgICAgfVxyXG4gICAqL1xyXG4gIGNvbnN0IHsgaWQgfSA9IHJlcS5wYXJhbXM7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHJlcS5jbGllbnQuZGVsZXRlTGFiZWwoaWQpO1xyXG4gICAgcmVzLnN0YXR1cygyMDEpLmpzb24oeyBzdGF0dXM6ICdzdWNjZXNzJywgcmVzcG9uc2U6IHJlc3VsdCB9KTtcclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgcmVzLnN0YXR1cyg1MDApLmpzb24oe1xyXG4gICAgICBzdGF0dXM6ICdFcnJvcicsXHJcbiAgICAgIG1lc3NhZ2U6ICdFcnJvIGFvIGRlbGV0YXIgZXRpcXVldGEuJyxcclxuICAgICAgZXJyb3I6IGVycm9yLFxyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcbiJdLCJtYXBwaW5ncyI6IjRRQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQUlPLGVBQWVBLFdBQVdBLENBQUNDLEdBQVksRUFBRUMsR0FBYSxFQUFFO0VBQzdEO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDRSxNQUFNLEVBQUVDLElBQUksRUFBRUMsT0FBTyxDQUFDLENBQUMsR0FBR0gsR0FBRyxDQUFDSSxJQUFJO0VBQ2xDLElBQUksQ0FBQ0YsSUFBSTtFQUNQLE9BQU9ELEdBQUcsQ0FBQ0ksTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDQyxJQUFJLENBQUM7SUFDMUJDLE9BQU8sRUFBRTtFQUNYLENBQUMsQ0FBQzs7RUFFSixJQUFJO0lBQ0YsTUFBTUMsTUFBTSxHQUFHLE1BQU1SLEdBQUcsQ0FBQ1Ms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