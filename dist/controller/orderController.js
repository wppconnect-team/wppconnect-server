"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.getBusinessProfilesProducts = getBusinessProfilesProducts;exports.getOrderbyMsg = getOrderbyMsg; /*
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


function returnSucess(
res,
session,
phone,
data)
{
  res.status(201).json({
    status: 'Success',
    response: {
      message: 'Information retrieved successfully.',
      contact: phone,
      session: session,
      data: data
    }
  });
}

function returnError(
req,
res,
session,
error)
{
  req.logger.error(error);
  res.status(400).json({
    status: 'Error',
    response: {
      message: 'Error retrieving information',
      session: session,
      log: error
    }
  });
}

async function getBusinessProfilesProducts(req, res) {
  /**
   * #swagger.tags = ["Catalog & Bussiness"]
     #swagger.autoBody=false
     #swagger.security = [{
            "bearerAuth": []
     }]
     #swagger.parameters["session"] = {
      schema: 'NERDWHATS_AMERICA'
     }
   */
  const session = req.session;
  const { phone } = req.body;

  try {
    const results = [];

    for (const contato of phone) {
      results.push(await req.client.getBusinessProfilesProducts(contato));
    }

    returnSucess(res, session, phone, results);
  } catch (error) {
    returnError(req, res, session, error);
  }
}
async function getOrderbyMsg(req, res) {
  /**
   * #swagger.tags = ["Catalog & Bussiness"]
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
              messageId: { type: 'string' },
            },
            required: ['messageId'],
          },
          examples: {
            'Default': {
              value: {
                messageId: '<message_id>',
              },
            },
          },
        },
      },
    }
   */
  const session = req.session;
  const { messageId } = req.body;

  try {
    const result = await req.client.getOrderbyMsg(messageId);

    returnSucess(res, session, null, result);
  } catch (error) {
    returnError(req, res, session, error);
  }
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJyZXR1cm5TdWNlc3MiLCJyZXMiLCJzZXNzaW9uIiwicGhvbmUiLCJkYXRhIiwic3RhdHVzIiwianNvbiIsInJlc3BvbnNlIiwibWVzc2FnZSIsImNvbnRhY3QiLCJyZXR1cm5FcnJvciIsInJlcSIsImVycm9yIiwibG9nZ2VyIiwibG9nIiwiZ2V0QnVzaW5lc3NQcm9maWxlc1Byb2R1Y3RzIiwiYm9keSIsInJlc3VsdHMiLCJjb250YXRvIiwicHVzaCIsImNsaWVudCIsImdldE9yZGVyYnlNc2ciLCJtZXNzYWdlSWQiLCJyZXN1bHQiXSwic291cmNlcyI6WyIuLi8uLi9zcmMvY29udHJvbGxlci9vcmRlckNvbnRyb2xsZXIudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLypcclxuICogQ29weXJpZ2h0IDIwMjEgV1BQQ29ubmVjdCBUZWFtXHJcbiAqXHJcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XHJcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cclxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XHJcbiAqXHJcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcclxuICpcclxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxyXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXHJcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxyXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXHJcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxyXG4gKi9cclxuaW1wb3J0IHsgUmVxdWVzdCwgUmVzcG9uc2UgfSBmcm9tICdleHByZXNzJztcclxuXHJcbmZ1bmN0aW9uIHJldHVyblN1Y2VzcyhcclxuICByZXM6IFJlc3BvbnNlLFxyXG4gIHNlc3Npb246IHN0cmluZyxcclxuICBwaG9uZTogc3RyaW5nIHwgbnVsbCxcclxuICBkYXRhPzogYW55XHJcbikge1xyXG4gIHJlcy5zdGF0dXMoMjAxKS5qc29uKHtcclxuICAgIHN0YXR1czogJ1N1Y2Nlc3MnLFxyXG4gICAgcmVzcG9uc2U6IHtcclxuICAgICAgbWVzc2FnZTogJ0luZm9ybWF0aW9uIHJldHJpZXZlZCBzdWNjZXNzZnVsbHkuJyxcclxuICAgICAgY29udGFjdDogcGhvbmUsXHJcbiAgICAgIHNlc3Npb246IHNlc3Npb24sXHJcbiAgICAgIGRhdGE6IGRhdGEsXHJcbiAgICB9LFxyXG4gIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiByZXR1cm5FcnJvcihcclxuICByZXE6IFJlcXVlc3QsXHJcbiAgcmVzOiBSZXNwb25zZSxcclxuICBzZXNzaW9uOiBzdHJpbmcsXHJcbiAgZXJyb3I/OiBhbnlcclxuKSB7XHJcbiAgcmVxLmxvZ2dlci5lcnJvcihlcnJvcik7XHJcbiAgcmVzLnN0YXR1cyg0MDApLmpzb24oe1xyXG4gICAgc3RhdHVzOiAnRXJyb3InLFxyXG4gICAgcmVzcG9uc2U6IHtcclxuICAgICAgbWVzc2FnZTogJ0Vycm9yIHJldHJpZXZpbmcgaW5mb3JtYXRpb24nLFxyXG4gICAgICBzZXNzaW9uOiBzZXNzaW9uLFxyXG4gICAgICBsb2c6IGVycm9yLFxyXG4gICAgfSxcclxuICB9KTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldEJ1c2luZXNzUHJvZmlsZXNQcm9kdWN0cyhyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpIHtcclxuICAvKipcclxuICAgKiAjc3dhZ2dlci50YWdzID0gW1wiQ2F0YWxvZyAmIEJ1c3NpbmVzc1wiXVxyXG4gICAgICNzd2FnZ2VyLmF1dG9Cb2R5PWZhbHNlXHJcbiAgICAgI3N3YWdnZXIuc2VjdXJpdHkgPSBbe1xyXG4gICAgICAgICAgICBcImJlYXJlckF1dGhcIjogW11cclxuICAgICB9XVxyXG4gICAgICNzd2FnZ2VyLnBhcmFtZXRlcnNbXCJzZXNzaW9uXCJdID0ge1xyXG4gICAgICBzY2hlbWE6ICdORVJEV0hBVFNfQU1FUklDQSdcclxuICAgICB9XHJcbiAgICovXHJcbiAgY29uc3Qgc2Vzc2lvbiA9IHJlcS5zZXNzaW9uO1xyXG4gIGNvbnN0IHsgcGhvbmUgfSA9IHJlcS5ib2R5O1xyXG5cclxuICB0cnkge1xyXG4gICAgY29uc3QgcmVzdWx0czogYW55ID0gW107XHJcblxyXG4gICAgZm9yIChjb25zdCBjb250YXRvIG9mIHBob25lKSB7XHJcbiAgICAgIHJlc3VsdHMucHVzaChhd2FpdCByZXEuY2xpZW50LmdldEJ1c2luZXNzUHJvZmlsZXNQcm9kdWN0cyhjb250YXRvKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuU3VjZXNzKHJlcywgc2Vzc2lvbiwgcGhvbmUsIHJlc3VsdHMpO1xyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICByZXR1cm5FcnJvcihyZXEsIHJlcywgc2Vzc2lvbiwgZXJyb3IpO1xyXG4gIH1cclxufVxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0T3JkZXJieU1zZyhyZXE6IFJlcXVlc3QsIHJlczogUmVzcG9uc2UpIHtcclxuICAvKipcclxuICAgKiAjc3dhZ2dlci50YWdzID0gW1wiQ2F0YWxvZyAmIEJ1c3NpbmVzc1wiXVxyXG4gICAgICNzd2FnZ2VyLmF1dG9Cb2R5PWZhbHNlXHJcbiAgICAgI3N3YWdnZXIuc2VjdXJpdHkgPSBbe1xyXG4gICAgICAgICAgICBcImJlYXJlckF1dGhcIjogW11cclxuICAgICB9XVxyXG4gICAgICNzd2FnZ2VyLnBhcmFtZXRlcnNbXCJzZXNzaW9uXCJdID0ge1xyXG4gICAgICBzY2hlbWE6ICdORVJEV0hBVFNfQU1FUklDQSdcclxuICAgICB9XHJcbiAgICAgI3N3YWdnZXIucmVxdWVzdEJvZHkgPSB7XHJcbiAgICAgIHJlcXVpcmVkOiB0cnVlLFxyXG4gICAgICBjb250ZW50OiB7XHJcbiAgICAgICAgJ2FwcGxpY2F0aW9uL2pzb24nOiB7XHJcbiAgICAgICAgICBzY2hlbWE6IHtcclxuICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXHJcbiAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICBtZXNzYWdlSWQ6IHsgdHlwZTogJ3N0cmluZycgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgcmVxdWlyZWQ6IFsnbWVzc2FnZUlkJ10sXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgZXhhbXBsZXM6IHtcclxuICAgICAgICAgICAgJ0RlZmF1bHQnOiB7XHJcbiAgICAgICAgICAgICAgdmFsdWU6IHtcclxuICAgICAgICAgICAgICAgIG1lc3NhZ2VJZDogJzxtZXNzYWdlX2lkPicsXHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgIH1cclxuICAgKi9cclxuICBjb25zdCBzZXNzaW9uID0gcmVxLnNlc3Npb247XHJcbiAgY29uc3QgeyBtZXNzYWdlSWQgfSA9IHJlcS5ib2R5O1xyXG5cclxuICB0cnkge1xyXG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcmVxLmNsaWVudC5nZXRPcmRlcmJ5TXNnKG1lc3NhZ2VJZCk7XHJcblxyXG4gICAgcmV0dXJuU3VjZXNzKHJlcywgc2Vzc2lvbiwgbnVsbCwgcmVzdWx0KTtcclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgcmV0dXJuRXJyb3IocmVxLCByZXMsIHNlc3Npb24sIGVycm9yKTtcclxu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