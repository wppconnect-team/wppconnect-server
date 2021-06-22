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
import axios from 'axios';

export default class chatWootClient {
    constructor(config) {
        this.config = config;
        this.account_id = this.config.account_id;
        this.inbox_id = this.config.inbox_id;
        this.api = axios.create({
            baseURL: this.config.baseURL,
            headers: { api_access_token: this.config.token },
        });
    }

    async sendMessage(message) {
        let contact = await this.createContact(message);
        let conversation = await this.createConversation(contact, message.id);

        try {
            let body = {
                content: message.body,
                message_type: 'incoming',
            };
            const { data } = await this.api.post(
                `api/v1/accounts/${this.account_id}/conversations/${conversation.id}/messages`,
                body
            );
            return data;
        } catch (e) {
            return null;
        }
    }

    async findContact(query) {
        try {
            const { data } = await this.api.get(`api/v1/accounts/${this.account_id}/contacts/search/?q=${query}`);
            return data;
        } catch (e) {
            return null;
        }
    }

    async createContact(message) {
        let body = {
            inbox_id: this.inbox_id,
            name: message.sender.isMyContact
                ? message.sender.formattedName
                : message.sender.pushname || message.sender.formattedName,
            phone_number:
                typeof message.sender.id == 'object' ? message.sender.id.user : message.sender.id.split('@')[0],
        };
        body.phone_number = `+${body.phone_number}`;
        var contact = await this.findContact(body.phone_number.replace('+', ''));
        if (contact.meta.count > 0) return contact.payload[0];

        try {
            const data = await this.api.post(`api/v1/accounts/${this.account_id}/contacts`, body);
            return data.data.payload.contact;
        } catch (e) {
            return null;
        }
    }

    async findConversation(contact) {
        try {
            const { data } = await this.api.get(`api/v1/accounts/${this.account_id}/conversations?status=open`);
            return data.data.payload.find((e) => e.meta.sender.id == contact.id);
        } catch (e) {
            return null;
        }
    }

    async createConversation(contact, source_id) {
        var conversation = await this.findConversation(contact);
        if (conversation) return conversation;

        let body = {
            source_id: source_id,
            inbox_id: this.inbox_id,
            contact_id: contact.id,
            status: 'open',
        };

        try {
            const { data } = await this.api.post(`api/v1/accounts/${this.account_id}/conversations`, body);
            return data;
        } catch (e) {
            return null;
        }
    }
}
