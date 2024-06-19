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

function returnSucess(
  res: Response,
  session: string,
  phone: string | null,
  data?: any
) {
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

export async function getBusinessProfilesProducts(req: Request, res: Response) {
  /**
   * #swagger.tags = ["Catalog & Bussiness"]
     #swagger.autoBody=false
     #swagger.security = [{
            "bearerAuth": []
     }]
     #swagger.parameters["session"] = {
      schema: 'NERDWHATS_AMERICA'
     }
     #swagger.parameters["phone"] = {
      in: 'query',
      schema: '5521999999999@c.us',
     }
   */
  const session = req.session;
  const { phone } = req.query as unknown as any;

  try {
    const results: any = [];

    const result = await req.client.getBusinessProfilesProducts(phone);
    results.push(result);

    returnSucess(res, session, phone, results);
  } catch (error) {
    returnError(req, res, session, error);
  }
}
export async function getOrderbyMsg(req: Request, res: Response) {
  /**
   * #swagger.tags = ["Catalog & Bussiness"]
     #swagger.autoBody=false
     #swagger.security = [{
            "bearerAuth": []
     }]
     #swagger.parameters["session"] = {
      schema: 'NERDWHATS_AMERICA'
     }
     #swagger.parameters["messageId"] = {
      schema: 'true_5521999999999@c.us_3EB0E69ACC5B396B21F2FE'
     }
   */
  const session = req.session;
  const { messageId } = req.params;

  try {
    const result = await (req.client as any).getOrder(messageId);

    returnSucess(res, session, null, result);
  } catch (error) {
    returnError(req, res, session, error);
  }
}
