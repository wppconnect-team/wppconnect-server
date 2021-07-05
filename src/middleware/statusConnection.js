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
import { contactToArray } from '../util/functions';
let preFligthContact = new Map();

export default async function statusConnection(req, res, next) {
    try {
        if (req.client) {
            await req.client.isConnected();
            req.body.phone = contactToArray(req.body.phone || req.params.phone, req.body.isGroup);

            if (req.serverOptions.sendPreFlight && req.body.phone && !req.body.isGroup) {
                let localArr = [];
                for (let phone of req.body.phone) {
                    if (preFligthContact.has(phone)) localArr.push(preFligthContact.get(phone));
                    else {
                        const contact = await req.client.checkNumberStatus(phone);
                        preFligthContact.set(phone, contact.id._serialized);
                        localArr.push(contact.id._serialized);
                    }
                }
                req.body.phone = localArr;
            }
        } else {
            return res.status(400).json({
                response: false,
                status: 'Disconnected',
                message: 'A sessão do WhatsApp não está ativa.',
            });
        }
        next();
    } catch (error) {
        req.logger.error(error);
        return res.status(400).json({
            response: false,
            status: 'Disconnected',
            message: 'A sessão do WhatsApp não está ativa.',
        });
    }
}
