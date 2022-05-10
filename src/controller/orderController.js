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
function returnSucess(res, session, phone, data) {
  res.status(201).json({
    status: 'Success',
    response: {
      message: 'Information retrieved successfully.',
      contact: phone,
      session: session,
      data: data,
    },
  });
}

function returnError(req, res, session, error) {
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

export async function getBusinessProfilesProducts(req, res) {
  const session = req.session;
  const { phone } = req.body;

  try {
    let results = [];

    for (const contato of phone) {
      results.push(await req.client.getBusinessProfilesProducts(contato));
    }

    returnSucess(res, session, phone, results);
  } catch (error) {
    returnError(req, res, session, error);
  }
}
export async function getOrderbyMsg(req, res) {
  const session = req.session;
  const { messageId } = req.body;

  try {
    let result;

    result = await req.client.getOrderbyMsg(messageId);

    returnSucess(res, session, null, result);
  } catch (error) {
    returnError(req, res, session, error);
  }
}
