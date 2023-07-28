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
import { default as FormData } from 'form-data';
import mime from 'mime-types';

import bufferUtils from './bufferUtils';
import { eventEmitter } from './sessionUtil';

export default class chatWootClient {
  declare config: any;
  declare session: any;
  declare mobile_name: any;
  declare mobile_number: any;
  declare sender: any;
  declare account_id: any;
  declare inbox_id: any;
  declare api: any;

  constructor(config: any, session: string) {
    this.config = config;
    this.mobile_name = this.config.mobile_name
      ? this.config.mobile_name
      : `WPPConnect`;
    this.mobile_number = this.config.mobile_number
      ? this.config.mobile_number
      : '5511999999999';
    this.sender = {
      pushname: this.mobile_name,
      id: this.mobile_number,
    };
    this.account_id = this.config.account_id;
    this.inbox_id = this.config.inbox_id;
    this.api = axios.create({
      baseURL: this.config.baseURL,
      headers: {
        'Content-Type': 'application/json;charset=utf-8',
        api_access_token: this.config.token,
      },
    });

    //assina o evento do qrcode
    eventEmitter.on(`qrcode-${session}`, (qrCode, urlCode, client) => {
      setTimeout(async () => {
        if (config?.chatwoot?.sendQrCode !== false) {
          this.sendMessage(client, {
            sender: this.sender,
            chatId: this.mobile_number + '@c.us',
            type: 'image',
            timestamp: 'qrcode',
            mimetype: 'image/png',
            caption: 'leia o qrCode',
            qrCode: qrCode.replace('data:image/png;base64,', ''),
          });
        }
      }, 1000);
    });

    //assiona o evento do status
    eventEmitter.on(`status-${session}`, (client, status) => {
      if (config?.chatwoot?.sendStatus !== false) {
        this.sendMessage(client, {
          sender: this.sender,
          chatId: this.mobile_number + '@c.us',
          body: `wppconnect status: ${status} `,
        });
      }
    });

    //assina o evento de mensagem
    eventEmitter.on(`mensagem-${session}`, (client, message) => {
      this.sendMessage(client, message);
    });
  }

  async sendMessage(client: any, message: any) {
    if (message.isGroupMsg || message.chatId.indexOf('@broadcast') > 0) return;
    const contact = await this.createContact(message);
    const conversation = await this.createConversation(
      contact,
      message.chatId.split('@')[0]
    );

    try {
      if (
        message.type == 'image' ||
        message.type == 'video' ||
        message.type == 'in' ||
        message.type == 'document' ||
        message.type == 'ptt' ||
        message.type == 'audio' ||
        message.type == 'sticker'
      ) {
        if (message.mimetype == 'image/webp') message.mimetype = 'image/jpeg';
        const extension = mime.extension(message.mimetype);
        const filename = `${message.timestamp}.${extension}`;
        let b64;

        if (message.qrCode) b64 = message.qrCode;
        else {
          const buffer = await client.decryptFile(message);
          b64 = await buffer.toString('base64');
        }

        const mediaData = Buffer.from(b64, 'base64');

        const data = new FormData();
        if (message.caption) {
          data.append('content', message.caption);
        }

        data.append(
          'attachments[]',
          await bufferUtils.AsyncBufferToStream(mediaData),
          {
            filename: filename,
            contentType: message.mimetype,
          }
        );

        data.append('message_type', 'incoming');
        data.append('private', 'false');

        const configPost = Object.assign(
          {},
          {
            baseURL: this.config.baseURL,
            headers: {
              'Content-Type': 'application/json;charset=utf-8',
              api_access_token: this.config.token,
            },
          }
        );
        configPost.headers = { ...configPost.headers, ...data.getHeaders() };

        const result = await axios.post(
          `api/v1/accounts/${this.account_id}/conversations/${conversation.id}/messages`,
          data,
          configPost
        );

        return result;
      } else {
        const body = {
          content: message.body,
          message_type: 'incoming',
        };
        const { data } = await this.api.post(
          `api/v1/accounts/${this.account_id}/conversations/${conversation.id}/messages`,
          body
        );
        return data;
      }
    } catch (e) {
      return null;
    }
  }

  async findContact(query: string) {
    try {
      const { data } = await this.api.get(
        `api/v1/accounts/${this.account_id}/contacts/search/?q=${query}`
      );
      return data;
    } catch (e) {
      console.log(e);
      return null;
    }
  }

  async createContact(message: any) {
    const body = {
      inbox_id: this.inbox_id,
      name: message.sender.isMyContact
        ? message.sender.formattedName
        : message.sender.pushname || message.sender.formattedName,
      phone_number:
        typeof message.sender.id == 'object'
          ? message.sender.id.user
          : message.sender.id.split('@')[0],
    };
    body.phone_number = `+${body.phone_number}`;
    const contact = await this.findContact(body.phone_number.replace('+', ''));
    if (contact && contact.meta.count > 0) return contact.payload[0];

    try {
      const data = await this.api.post(
        `api/v1/accounts/${this.account_id}/contacts`,
        body
      );
      return data.data.payload.contact;
    } catch (e) {
      console.log(e);
      return null;
    }
  }

  async findConversation(contact: any) {
    try {
      const { data } = await this.api.get(
        `api/v1/accounts/${this.account_id}/contacts/${contact.id}/conversations`
      );
      return data.payload.find(
        (e: any) => e.inbox_id == this.inbox_id && e.status != 'resolved'
      );
    } catch (e) {
      console.log(e);
      return null;
    }
  }

  async createConversation(contact: any, source_id: any) {
    const conversation = await this.findConversation(contact);
    if (conversation) return conversation;

    const body = {
      source_id: source_id,
      inbox_id: this.inbox_id,
      contact_id: contact.id,
      status: 'open',
    };

    try {
      const { data } = await this.api.post(
        `api/v1/accounts/${this.account_id}/conversations`,
        body
      );
      return data;
    } catch (e) {
      console.log(e);
      return null;
    }
  }
}
