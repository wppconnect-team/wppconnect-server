"use strict";var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;














var _axios = _interopRequireDefault(require("axios"));
var _formData = _interopRequireDefault(require("form-data"));
var _mimeTypes = _interopRequireDefault(require("mime-types"));

var _bufferutils = _interopRequireDefault(require("./bufferutils"));

var _sessionUtil = require("./sessionUtil"); /*
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
 */ // import bufferUtils from './bufferutils';
class chatWootClient {constructor(config, session) {this.config = config;this.mobile_name = this.config.mobile_name ? this.config.mobile_name :
    `WPPConnect`;
    this.mobile_number = this.config.mobile_number ?
    this.config.mobile_number :
    '5511999999999';
    this.sender = {
      pushname: this.mobile_name,
      id: this.mobile_number
    };
    this.account_id = this.config.account_id;
    this.inbox_id = this.config.inbox_id;
    this.api = _axios.default.create({
      baseURL: this.config.baseURL,
      headers: {
        'Content-Type': 'application/json;charset=utf-8',
        api_access_token: this.config.token
      }
    });

    //assina o evento do qrcode
    _sessionUtil.eventEmitter.on(`qrcode-${session}`, (qrCode, urlCode, client) => {
      setTimeout(async () => {
        if (config?.chatwoot?.sendQrCode !== false) {
          this.sendMessage(client, {
            sender: this.sender,
            chatId: this.mobile_number + '@c.us',
            type: 'image',
            timestamp: 'qrcode',
            mimetype: 'image/png',
            caption: 'leia o qrCode',
            qrCode: qrCode.replace('data:image/png;base64,', '')
          });
        }
      }, 1000);
    });

    //assiona o evento do status
    _sessionUtil.eventEmitter.on(`status-${session}`, (client, status) => {
      if (config?.chatwoot?.sendStatus !== false) {
        this.sendMessage(client, {
          sender: this.sender,
          chatId: this.mobile_number + '@c.us',
          body: `wppconnect status: ${status} `
        });
      }
    });

    //assina o evento de mensagem
    _sessionUtil.eventEmitter.on(`mensagem-${session}`, (client, message) => {
      this.sendMessage(client, message);
    });
  }

  // async sendMessage(client: any, message: any) {
  //   if (message.isGroupMsg || message.chatId.indexOf('@broadcast') > 0) return;
  //   const contact = await this.createContact(message);
  //   const conversation = await this.createConversation(
  //     contact,
  //     message.chatId.split('@')[0]
  //   );

  //   try {
  //     if (
  //       message.type == 'image' ||
  //       message.type == 'video' ||
  //       message.type == 'in' ||
  //       message.type == 'document' ||
  //       message.type == 'ptt' ||
  //       message.type == 'audio' ||
  //       message.type == 'sticker'
  //     ) {
  //       if (message.mimetype == 'image/webp') message.mimetype = 'image/jpeg';
  //       const extension = mime.extension(message.mimetype);
  //       const filename = `${message.timestamp}.${extension}`;
  //       let b64;

  //       if (message.qrCode) b64 = message.qrCode;
  //       else {
  //         const buffer = await client.decryptFile(message);
  //         b64 = await buffer.toString('base64');
  //       }

  //       const mediaData = Buffer.from(b64, 'base64');

  //       // Create a readable stream from the Buffer
  //       const stream = new Readable();
  //       stream.push(mediaData);
  //       stream.push(null); // Signaling the end of the stream

  //       const data = new FormData();
  //       if (message.caption) {
  //         data.append('content', message.caption);
  //       }

  //       data.append('attachments[]', stream, {
  //         filename: filename,
  //         contentType: message.mimetype,
  //       });

  //       data.append('message_type', 'incoming');
  //       data.append('private', 'false');

  //       const configPost = Object.assign(
  //         {},
  //         {
  //           baseURL: this.config.baseURL,
  //           headers: {
  //             'Content-Type': 'application/json;charset=utf-8',
  //             api_access_token: this.config.token,
  //           },
  //         }
  //       );

  //       configPost.headers = { ...configPost.headers, ...data.getHeaders() };
  //       console.log('PRÉ-REQUEST');
  //       const result = await axios.post(
  //         `api/v1/accounts/${this.account_id}/conversations/${conversation.id}/messages`,
  //         data,
  //         configPost
  //       );
  //       console.log('POS-REQUEST');
  //       return result;
  //     } else {
  //       const body = {
  //         content: message.body,
  //         message_type: 'incoming',
  //       };
  //       const { data } = await this.api.post(
  //         `api/v1/accounts/${this.account_id}/conversations/${conversation.id}/messages`,
  //         body
  //       );
  //       return data;
  //     }
  //   } catch (e) {
  //     return null;
  //   }
  // }

  async sendMessage(client, message) {
    if (message.isGroupMsg || message.chatId.indexOf('@broadcast') > 0) return;

    const contact = await this.createContact(message);
    const conversation = await this.createConversation(
      contact,
      message.chatId.split('@')[0]
    );

    try {
      if (
      [
      'image',
      'video',
      'in',
      'document',
      'ptt',
      'audio',
      'sticker'].
      includes(message.type))
      {
        if (message.mimetype === 'image/webp') message.mimetype = 'image/jpeg';
        const extension = _mimeTypes.default.extension(message.mimetype);
        const filename = `${message.timestamp}.${extension}`;
        let b64;

        if (message.qrCode) {
          b64 = message.qrCode;
        } else {
          const buffer = await client.decryptFile(message);
          b64 = buffer.toString('base64');
        }

        const mediaData = Buffer.from(b64, 'base64');
        const stream = _bufferutils.default.bufferToReadableStream(mediaData);

        const data = new _formData.default();
        if (message.caption) {
          data.append('content', message.caption);
        }

        data.append('attachments[]', stream, {
          filename: filename,
          contentType: message.mimetype
        });

        data.append('message_type', 'incoming');
        data.append('private', 'false');

        const configPost = {
          baseURL: this.config.baseURL,
          headers: {
            api_access_token: this.config.token,
            ...data.getHeaders()
          }
        };
        const endpoint = `api/v1/accounts/${this.account_id}/conversations/${conversation.id}/messages`;

        const result = await _axios.default.post(endpoint, data, configPost);

        return result;
      } else {
        const body = {
          content: message.body,
          message_type: 'incoming'
        };
        const endpoint = `api/v1/accounts/${this.account_id}/conversations/${conversation.id}/messages`;

        const { data } = await this.api.post(endpoint, body);
        return data;
      }
    } catch (e) {
      console.error('Error sending message:', e);
      return null;
    }
  }

  async findContact(query) {
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

  async createContact(message) {
    const body = {
      inbox_id: this.inbox_id,
      name: message.sender.isMyContact ?
      message.sender.formattedName :
      message.sender.pushname || message.sender.formattedName,
      phone_number:
      typeof message.sender.id == 'object' ?
      message.sender.id.user :
      message.sender.id.split('@')[0]
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

  async findConversation(contact) {
    try {
      const { data } = await this.api.get(
        `api/v1/accounts/${this.account_id}/contacts/${contact.id}/conversations`
      );
      return data.payload.find(
        (e) => e.inbox_id == this.inbox_id && e.status != 'resolved'
      );
    } catch (e) {
      console.log(e);
      return null;
    }
  }

  async createConversation(contact, source_id) {
    const conversation = await this.findConversation(contact);
    if (conversation) return conversation;

    const body = {
      source_id: source_id,
      inbox_id: this.inbox_id,
      contact_id: contact.id,
      status: 'open'
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
}exports.default = chatWootClient;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXhpb3MiLCJfaW50ZXJvcFJlcXVpcmVEZWZhdWx0IiwicmVxdWlyZSIsIl9mb3JtRGF0YSIsIl9taW1lVHlwZXMiLCJfYnVmZmVydXRpbHMiLCJfc2Vzc2lvblV0aWwiLCJjaGF0V29vdENsaWVudCIsImNvbnN0cnVjdG9yIiwiY29uZmlnIiwic2Vzc2lvbiIsIm1vYmlsZV9uYW1lIiwibW9iaWxlX251bWJlciIsInNlbmRlciIsInB1c2huYW1lIiwiaWQiLCJhY2NvdW50X2lkIiwiaW5ib3hfaWQiLCJhcGkiLCJheGlvcyIsImNyZWF0ZSIsImJhc2VVUkwiLCJoZWFkZXJzIiwiYXBpX2FjY2Vzc190b2tlbiIsInRva2VuIiwiZXZlbnRFbWl0dGVyIiwib24iLCJxckNvZGUiLCJ1cmxDb2RlIiwiY2xpZW50Iiwic2V0VGltZW91dCIsImNoYXR3b290Iiwic2VuZFFyQ29kZSIsInNlbmRNZXNzYWdlIiwiY2hhdElkIiwidHlwZSIsInRpbWVzdGFtcCIsIm1pbWV0eXBlIiwiY2FwdGlvbiIsInJlcGxhY2UiLCJzdGF0dXMiLCJzZW5kU3RhdHVzIiwiYm9keSIsIm1lc3NhZ2UiLCJpc0dyb3VwTXNnIiwiaW5kZXhPZiIsImNvbnRhY3QiLCJjcmVhdGVDb250YWN0IiwiY29udmVyc2F0aW9uIiwiY3JlYXRlQ29udmVyc2F0aW9uIiwic3BsaXQiLCJpbmNsdWRlcyIsImV4dGVuc2lvbiIsIm1pbWUiLCJmaWxlbmFtZSIsImI2NCIsImJ1ZmZlciIsImRlY3J5cHRGaWxlIiwidG9TdHJpbmciLCJtZWRpYURhdGEiLCJCdWZmZXIiLCJmcm9tIiwic3RyZWFtIiwiYnVmZmVydXRpbHMiLCJidWZmZXJUb1JlYWRhYmxlU3RyZWFtIiwiZGF0YSIsIkZvcm1EYXRhIiwiYXBwZW5kIiwiY29udGVudFR5cGUiLCJjb25maWdQb3N0IiwiZ2V0SGVhZGVycyIsImVuZHBvaW50IiwicmVzdWx0IiwicG9zdCIsImNvbnRlbnQiLCJtZXNzYWdlX3R5cGUiLCJlIiwiY29uc29sZSIsImVycm9yIiwiZmluZENvbnRhY3QiLCJxdWVyeSIsImdldCIsImxvZyIsIm5hbWUiLCJpc015Q29udGFjdCIsImZvcm1hdHRlZE5hbWUiLCJwaG9uZV9udW1iZXIiLCJ1c2VyIiwibWV0YSIsImNvdW50IiwicGF5bG9hZCIsImZpbmRDb252ZXJzYXRpb24iLCJmaW5kIiwic291cmNlX2lkIiwiY29udGFjdF9pZCIsImV4cG9ydHMiLCJkZWZhdWx0Il0sInNvdXJjZXMiOlsiLi4vLi4vc3JjL3V0aWwvY2hhdFdvb3RDbGllbnQudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLypcclxuICogQ29weXJpZ2h0IDIwMjEgV1BQQ29ubmVjdCBUZWFtXHJcbiAqXHJcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XHJcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cclxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XHJcbiAqXHJcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcclxuICpcclxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxyXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXHJcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxyXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXHJcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxyXG4gKi9cclxuaW1wb3J0IGF4aW9zLCB7IEF4aW9zSW5zdGFuY2UsIEF4aW9zUmVxdWVzdENvbmZpZyB9IGZyb20gJ2F4aW9zJztcclxuaW1wb3J0IHsgZGVmYXVsdCBhcyBGb3JtRGF0YSB9IGZyb20gJ2Zvcm0tZGF0YSc7XHJcbmltcG9ydCBtaW1lIGZyb20gJ21pbWUtdHlwZXMnO1xyXG5cclxuaW1wb3J0IGJ1ZmZlcnV0aWxzIGZyb20gJy4vYnVmZmVydXRpbHMnO1xyXG4vLyBpbXBvcnQgYnVmZmVyVXRpbHMgZnJvbSAnLi9idWZmZXJ1dGlscyc7XHJcbmltcG9ydCB7IGV2ZW50RW1pdHRlciB9IGZyb20gJy4vc2Vzc2lvblV0aWwnO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgY2hhdFdvb3RDbGllbnQge1xyXG4gIGRlY2xhcmUgY29uZmlnOiBhbnk7XHJcbiAgZGVjbGFyZSBzZXNzaW9uOiBhbnk7XHJcbiAgZGVjbGFyZSBtb2JpbGVfbmFtZTogYW55O1xyXG4gIGRlY2xhcmUgbW9iaWxlX251bWJlcjogYW55O1xyXG4gIGRlY2xhcmUgc2VuZGVyOiBhbnk7XHJcbiAgZGVjbGFyZSBhY2NvdW50X2lkOiBhbnk7XHJcbiAgZGVjbGFyZSBpbmJveF9pZDogYW55O1xyXG4gIGRlY2xhcmUgYXBpOiBBeGlvc0luc3RhbmNlO1xyXG5cclxuICBjb25zdHJ1Y3Rvcihjb25maWc6IGFueSwgc2Vzc2lvbjogc3RyaW5nKSB7XHJcbiAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZztcclxuICAgIHRoaXMubW9iaWxlX25hbWUgPSB0aGlzLmNvbmZpZy5tb2JpbGVfbmFtZVxyXG4gICAgICA/IHRoaXMuY29uZmlnLm1vYmlsZV9uYW1lXHJcbiAgICAgIDogYFdQUENvbm5lY3RgO1xyXG4gICAgdGhpcy5tb2JpbGVfbnVtYmVyID0gdGhpcy5jb25maWcubW9iaWxlX251bWJlclxyXG4gICAgICA/IHRoaXMuY29uZmlnLm1vYmlsZV9udW1iZXJcclxuICAgICAgOiAnNTUxMTk5OTk5OTk5OSc7XHJcbiAgICB0aGlzLnNlbmRlciA9IHtcclxuICAgICAgcHVzaG5hbWU6IHRoaXMubW9iaWxlX25hbWUsXHJcbiAgICAgIGlkOiB0aGlzLm1vYmlsZV9udW1iZXIsXHJcbiAgICB9O1xyXG4gICAgdGhpcy5hY2NvdW50X2lkID0gdGhpcy5jb25maWcuYWNjb3VudF9pZDtcclxuICAgIHRoaXMuaW5ib3hfaWQgPSB0aGlzLmNvbmZpZy5pbmJveF9pZDtcclxuICAgIHRoaXMuYXBpID0gYXhpb3MuY3JlYXRlKHtcclxuICAgICAgYmFzZVVSTDogdGhpcy5jb25maWcuYmFzZVVSTCxcclxuICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbjtjaGFyc2V0PXV0Zi04JyxcclxuICAgICAgICBhcGlfYWNjZXNzX3Rva2VuOiB0aGlzLmNvbmZpZy50b2tlbixcclxuICAgICAgfSxcclxuICAgIH0pO1xyXG5cclxuICAgIC8vYXNzaW5hIG8gZXZlbnRvIGRvIHFyY29kZVxyXG4gICAgZXZlbnRFbWl0dGVyLm9uKGBxcmNvZGUtJHtzZXNzaW9ufWAsIChxckNvZGUsIHVybENvZGUsIGNsaWVudCkgPT4ge1xyXG4gICAgICBzZXRUaW1lb3V0KGFzeW5jICgpID0+IHtcclxuICAgICAgICBpZiAoY29uZmlnPy5jaGF0d29vdD8uc2VuZFFyQ29kZSAhPT0gZmFsc2UpIHtcclxuICAgICAgICAgIHRoaXMuc2VuZE1lc3NhZ2UoY2xpZW50LCB7XHJcbiAgICAgICAgICAgIHNlbmRlcjogdGhpcy5zZW5kZXIsXHJcbiAgICAgICAgICAgIGNoYXRJZDogdGhpcy5tb2JpbGVfbnVtYmVyICsgJ0BjLnVzJyxcclxuICAgICAgICAgICAgdHlwZTogJ2ltYWdlJyxcclxuICAgICAgICAgICAgdGltZXN0YW1wOiAncXJjb2RlJyxcclxuICAgICAgICAgICAgbWltZXR5cGU6ICdpbWFnZS9wbmcnLFxyXG4gICAgICAgICAgICBjYXB0aW9uOiAnbGVpYSBvIHFyQ29kZScsXHJcbiAgICAgICAgICAgIHFyQ29kZTogcXJDb2RlLnJlcGxhY2UoJ2RhdGE6aW1hZ2UvcG5nO2Jhc2U2NCwnLCAnJyksXHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgIH0sIDEwMDApO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy9hc3Npb25hIG8gZXZlbnRvIGRvIHN0YXR1c1xyXG4gICAgZXZlbnRFbWl0dGVyLm9uKGBzdGF0dXMtJHtzZXNzaW9ufWAsIChjbGllbnQsIHN0YXR1cykgPT4ge1xyXG4gICAgICBpZiAoY29uZmlnPy5jaGF0d29vdD8uc2VuZFN0YXR1cyAhPT0gZmFsc2UpIHtcclxuICAgICAgICB0aGlzLnNlbmRNZXNzYWdlKGNsaWVudCwge1xyXG4gICAgICAgICAgc2VuZGVyOiB0aGlzLnNlbmRlcixcclxuICAgICAgICAgIGNoYXRJZDogdGhpcy5tb2JpbGVfbnVtYmVyICsgJ0BjLnVzJyxcclxuICAgICAgICAgIGJvZHk6IGB3cHBjb25uZWN0IHN0YXR1czogJHtzdGF0dXN9IGAsXHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIC8vYXNzaW5hIG8gZXZlbnRvIGRlIG1lbnNhZ2VtXHJcbiAgICBldmVudEVtaXR0ZXIub24oYG1lbnNhZ2VtLSR7c2Vzc2lvbn1gLCAoY2xpZW50LCBtZXNzYWdlKSA9PiB7XHJcbiAgICAgIHRoaXMuc2VuZE1lc3NhZ2UoY2xpZW50LCBtZXNzYWdlKTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLy8gYXN5bmMgc2VuZE1lc3NhZ2UoY2xpZW50OiBhbnksIG1lc3NhZ2U6IGFueSkge1xyXG4gIC8vICAgaWYgKG1lc3NhZ2UuaXNHcm91cE1zZyB8fCBtZXNzYWdlLmNoYXRJZC5pbmRleE9mKCdAYnJvYWRjYXN0JykgPiAwKSByZXR1cm47XHJcbiAgLy8gICBjb25zdCBjb250YWN0ID0gYXdhaXQgdGhpcy5jcmVhdGVDb250YWN0KG1lc3NhZ2UpO1xyXG4gIC8vICAgY29uc3QgY29udmVyc2F0aW9uID0gYXdhaXQgdGhpcy5jcmVhdGVDb252ZXJzYXRpb24oXHJcbiAgLy8gICAgIGNvbnRhY3QsXHJcbiAgLy8gICAgIG1lc3NhZ2UuY2hhdElkLnNwbGl0KCdAJylbMF1cclxuICAvLyAgICk7XHJcblxyXG4gIC8vICAgdHJ5IHtcclxuICAvLyAgICAgaWYgKFxyXG4gIC8vICAgICAgIG1lc3NhZ2UudHlwZSA9PSAnaW1hZ2UnIHx8XHJcbiAgLy8gICAgICAgbWVzc2FnZS50eXBlID09ICd2aWRlbycgfHxcclxuICAvLyAgICAgICBtZXNzYWdlLnR5cGUgPT0gJ2luJyB8fFxyXG4gIC8vICAgICAgIG1lc3NhZ2UudHlwZSA9PSAnZG9jdW1lbnQnIHx8XHJcbiAgLy8gICAgICAgbWVzc2FnZS50eXBlID09ICdwdHQnIHx8XHJcbiAgLy8gICAgICAgbWVzc2FnZS50eXBlID09ICdhdWRpbycgfHxcclxuICAvLyAgICAgICBtZXNzYWdlLnR5cGUgPT0gJ3N0aWNrZXInXHJcbiAgLy8gICAgICkge1xyXG4gIC8vICAgICAgIGlmIChtZXNzYWdlLm1pbWV0eXBlID09ICdpbWFnZS93ZWJwJykgbWVzc2FnZS5taW1ldHlwZSA9ICdpbWFnZS9qcGVnJztcclxuICAvLyAgICAgICBjb25zdCBleHRlbnNpb24gPSBtaW1lLmV4dGVuc2lvbihtZXNzYWdlLm1pbWV0eXBlKTtcclxuICAvLyAgICAgICBjb25zdCBmaWxlbmFtZSA9IGAke21lc3NhZ2UudGltZXN0YW1wfS4ke2V4dGVuc2lvbn1gO1xyXG4gIC8vICAgICAgIGxldCBiNjQ7XHJcblxyXG4gIC8vICAgICAgIGlmIChtZXNzYWdlLnFyQ29kZSkgYjY0ID0gbWVzc2FnZS5xckNvZGU7XHJcbiAgLy8gICAgICAgZWxzZSB7XHJcbiAgLy8gICAgICAgICBjb25zdCBidWZmZXIgPSBhd2FpdCBjbGllbnQuZGVjcnlwdEZpbGUobWVzc2FnZSk7XHJcbiAgLy8gICAgICAgICBiNjQgPSBhd2FpdCBidWZmZXIudG9TdHJpbmcoJ2Jhc2U2NCcpO1xyXG4gIC8vICAgICAgIH1cclxuXHJcbiAgLy8gICAgICAgY29uc3QgbWVkaWFEYXRhID0gQnVmZmVyLmZyb20oYjY0LCAnYmFzZTY0Jyk7XHJcblxyXG4gIC8vICAgICAgIC8vIENyZWF0ZSBhIHJlYWRhYmxlIHN0cmVhbSBmcm9tIHRoZSBCdWZmZXJcclxuICAvLyAgICAgICBjb25zdCBzdHJlYW0gPSBuZXcgUmVhZGFibGUoKTtcclxuICAvLyAgICAgICBzdHJlYW0ucHVzaChtZWRpYURhdGEpO1xyXG4gIC8vICAgICAgIHN0cmVhbS5wdXNoKG51bGwpOyAvLyBTaWduYWxpbmcgdGhlIGVuZCBvZiB0aGUgc3RyZWFtXHJcblxyXG4gIC8vICAgICAgIGNvbnN0IGRhdGEgPSBuZXcgRm9ybURhdGEoKTtcclxuICAvLyAgICAgICBpZiAobWVzc2FnZS5jYXB0aW9uKSB7XHJcbiAgLy8gICAgICAgICBkYXRhLmFwcGVuZCgnY29udGVudCcsIG1lc3NhZ2UuY2FwdGlvbik7XHJcbiAgLy8gICAgICAgfVxyXG5cclxuICAvLyAgICAgICBkYXRhLmFwcGVuZCgnYXR0YWNobWVudHNbXScsIHN0cmVhbSwge1xyXG4gIC8vICAgICAgICAgZmlsZW5hbWU6IGZpbGVuYW1lLFxyXG4gIC8vICAgICAgICAgY29udGVudFR5cGU6IG1lc3NhZ2UubWltZXR5cGUsXHJcbiAgLy8gICAgICAgfSk7XHJcblxyXG4gIC8vICAgICAgIGRhdGEuYXBwZW5kKCdtZXNzYWdlX3R5cGUnLCAnaW5jb21pbmcnKTtcclxuICAvLyAgICAgICBkYXRhLmFwcGVuZCgncHJpdmF0ZScsICdmYWxzZScpO1xyXG5cclxuICAvLyAgICAgICBjb25zdCBjb25maWdQb3N0ID0gT2JqZWN0LmFzc2lnbihcclxuICAvLyAgICAgICAgIHt9LFxyXG4gIC8vICAgICAgICAge1xyXG4gIC8vICAgICAgICAgICBiYXNlVVJMOiB0aGlzLmNvbmZpZy5iYXNlVVJMLFxyXG4gIC8vICAgICAgICAgICBoZWFkZXJzOiB7XHJcbiAgLy8gICAgICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uO2NoYXJzZXQ9dXRmLTgnLFxyXG4gIC8vICAgICAgICAgICAgIGFwaV9hY2Nlc3NfdG9rZW46IHRoaXMuY29uZmlnLnRva2VuLFxyXG4gIC8vICAgICAgICAgICB9LFxyXG4gIC8vICAgICAgICAgfVxyXG4gIC8vICAgICAgICk7XHJcblxyXG4gIC8vICAgICAgIGNvbmZpZ1Bvc3QuaGVhZGVycyA9IHsgLi4uY29uZmlnUG9zdC5oZWFkZXJzLCAuLi5kYXRhLmdldEhlYWRlcnMoKSB9O1xyXG4gIC8vICAgICAgIGNvbnNvbGUubG9nKCdQUsOJLVJFUVVFU1QnKTtcclxuICAvLyAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBheGlvcy5wb3N0KFxyXG4gIC8vICAgICAgICAgYGFwaS92MS9hY2NvdW50cy8ke3RoaXMuYWNjb3VudF9pZH0vY29udmVyc2F0aW9ucy8ke2NvbnZlcnNhdGlvbi5pZH0vbWVzc2FnZXNgLFxyXG4gIC8vICAgICAgICAgZGF0YSxcclxuICAvLyAgICAgICAgIGNvbmZpZ1Bvc3RcclxuICAvLyAgICAgICApO1xyXG4gIC8vICAgICAgIGNvbnNvbGUubG9nKCdQT1MtUkVRVUVTVCcpO1xyXG4gIC8vICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgLy8gICAgIH0gZWxzZSB7XHJcbiAgLy8gICAgICAgY29uc3QgYm9keSA9IHtcclxuICAvLyAgICAgICAgIGNvbnRlbnQ6IG1lc3NhZ2UuYm9keSxcclxuICAvLyAgICAgICAgIG1lc3NhZ2VfdHlwZTogJ2luY29taW5nJyxcclxuICAvLyAgICAgICB9O1xyXG4gIC8vICAgICAgIGNvbnN0IHsgZGF0YSB9ID0gYXdhaXQgdGhpcy5hcGkucG9zdChcclxuICAvLyAgICAgICAgIGBhcGkvdjEvYWNjb3VudHMvJHt0aGlzLmFjY291bnRfaWR9L2NvbnZlcnNhdGlvbnMvJHtjb252ZXJzYXRpb24uaWR9L21lc3NhZ2VzYCxcclxuICAvLyAgICAgICAgIGJvZHlcclxuICAvLyAgICAgICApO1xyXG4gIC8vICAgICAgIHJldHVybiBkYXRhO1xyXG4gIC8vICAgICB9XHJcbiAgLy8gICB9IGNhdGNoIChlKSB7XHJcbiAgLy8gICAgIHJldHVybiBudWxsO1xyXG4gIC8vICAgfVxyXG4gIC8vIH1cclxuXHJcbiAgYXN5bmMgc2VuZE1lc3NhZ2UoY2xpZW50OiBhbnksIG1lc3NhZ2U6IGFueSkge1xyXG4gICAgaWYgKG1lc3NhZ2UuaXNHcm91cE1zZyB8fCBtZXNzYWdlLmNoYXRJZC5pbmRleE9mKCdAYnJvYWRjYXN0JykgPiAwKSByZXR1cm47XHJcblxyXG4gICAgY29uc3QgY29udGFjdCA9IGF3YWl0IHRoaXMuY3JlYXRlQ29udGFjdChtZXNzYWdlKTtcclxuICAgIGNvbnN0IGNvbnZlcnNhdGlvbiA9IGF3YWl0IHRoaXMuY3JlYXRlQ29udmVyc2F0aW9uKFxyXG4gICAgICBjb250YWN0LFxyXG4gICAgICBtZXNzYWdlLmNoYXRJZC5zcGxpdCgnQCcpWzBdXHJcbiAgICApO1xyXG5cclxuICAgIHRyeSB7XHJcbiAgICAgIGlmIChcclxuICAgICAgICBbXHJcbiAgICAgICAgICAnaW1hZ2UnLFxyXG4gICAgICAgICAgJ3ZpZGVvJyxcclxuICAgICAgICAgICdpbicsXHJcbiAgICAgICAgICAnZG9jdW1lbnQnLFxyXG4gICAgICAgICAgJ3B0dCcsXHJcbiAgICAgICAgICAnYXVkaW8nLFxyXG4gICAgICAgICAgJ3N0aWNrZXInLFxyXG4gICAgICAgIF0uaW5jbHVkZXMobWVzc2FnZS50eXBlKVxyXG4gICAgICApIHtcclxuICAgICAgICBpZiAobWVzc2FnZS5taW1ldHlwZSA9PT0gJ2ltYWdlL3dlYnAnKSBtZXNzYWdlLm1pbWV0eXBlID0gJ2ltYWdlL2pwZWcnO1xyXG4gICAgICAgIGNvbnN0IGV4dGVuc2lvbiA9IG1pbWUuZXh0ZW5zaW9uKG1lc3NhZ2UubWltZXR5cGUpO1xyXG4gICAgICAgIGNvbnN0IGZpbGVuYW1lID0gYCR7bWVzc2FnZS50aW1lc3RhbXB9LiR7ZXh0ZW5zaW9ufWA7XHJcbiAgICAgICAgbGV0IGI2NDtcclxuXHJcbiAgICAgICAgaWYgKG1lc3NhZ2UucXJDb2RlKSB7XHJcbiAgICAgICAgICBiNjQgPSBtZXNzYWdlLnFyQ29kZTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgY29uc3QgYnVmZmVyID0gYXdhaXQgY2xpZW50LmRlY3J5cHRGaWxlKG1lc3NhZ2UpO1xyXG4gICAgICAgICAgYjY0ID0gYnVmZmVyLnRvU3RyaW5nKCdiYXNlNjQnKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IG1lZGlhRGF0YSA9IEJ1ZmZlci5mcm9tKGI2NCwgJ2Jhc2U2NCcpO1xyXG4gICAgICAgIGNvbnN0IHN0cmVhbSA9IGJ1ZmZlcnV0aWxzLmJ1ZmZlclRvUmVhZGFibGVTdHJlYW0obWVkaWFEYXRhKTtcclxuXHJcbiAgICAgICAgY29uc3QgZGF0YSA9IG5ldyBGb3JtRGF0YSgpO1xyXG4gICAgICAgIGlmIChtZXNzYWdlLmNhcHRpb24pIHtcclxuICAgICAgICAgIGRhdGEuYXBwZW5kKCdjb250ZW50JywgbWVzc2FnZS5jYXB0aW9uKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGRhdGEuYXBwZW5kKCdhdHRhY2htZW50c1tdJywgc3RyZWFtLCB7XHJcbiAgICAgICAgICBmaWxlbmFtZTogZmlsZW5hbWUsXHJcbiAgICAgICAgICBjb250ZW50VHlwZTogbWVzc2FnZS5taW1ldHlwZSxcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgZGF0YS5hcHBlbmQoJ21lc3NhZ2VfdHlwZScsICdpbmNvbWluZycpO1xyXG4gICAgICAgIGRhdGEuYXBwZW5kKCdwcml2YXRlJywgJ2ZhbHNlJyk7XHJcblxyXG4gICAgICAgIGNvbnN0IGNvbmZpZ1Bvc3Q6IEF4aW9zUmVxdWVzdENvbmZpZyA9IHtcclxuICAgICAgICAgIGJhc2VVUkw6IHRoaXMuY29uZmlnLmJhc2VVUkwsXHJcbiAgICAgICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgICAgIGFwaV9hY2Nlc3NfdG9rZW46IHRoaXMuY29uZmlnLnRva2VuLFxyXG4gICAgICAgICAgICAuLi5kYXRhLmdldEhlYWRlcnMoKSxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfTtcclxuICAgICAgICBjb25zdCBlbmRwb2ludCA9IGBhcGkvdjEvYWNjb3VudHMvJHt0aGlzLmFjY291bnRfaWR9L2NvbnZlcnNhdGlvbnMvJHtjb252ZXJzYXRpb24uaWR9L21lc3NhZ2VzYDtcclxuXHJcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgYXhpb3MucG9zdChlbmRwb2ludCwgZGF0YSwgY29uZmlnUG9zdCk7XHJcblxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgY29uc3QgYm9keSA9IHtcclxuICAgICAgICAgIGNvbnRlbnQ6IG1lc3NhZ2UuYm9keSxcclxuICAgICAgICAgIG1lc3NhZ2VfdHlwZTogJ2luY29taW5nJyxcclxuICAgICAgICB9O1xyXG4gICAgICAgIGNvbnN0IGVuZHBvaW50ID0gYGFwaS92MS9hY2NvdW50cy8ke3RoaXMuYWNjb3VudF9pZH0vY29udmVyc2F0aW9ucy8ke2NvbnZlcnNhdGlvbi5pZH0vbWVzc2FnZXNgO1xyXG5cclxuICAgICAgICBjb25zdCB7IGRhdGEgfSA9IGF3YWl0IHRoaXMuYXBpLnBvc3QoZW5kcG9pbnQsIGJvZHkpO1xyXG4gICAgICAgIHJldHVybiBkYXRhO1xyXG4gICAgICB9XHJcbiAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHNlbmRpbmcgbWVzc2FnZTonLCBlKTtcclxuICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBhc3luYyBmaW5kQ29udGFjdChxdWVyeTogc3RyaW5nKSB7XHJcbiAgICB0cnkge1xyXG4gICAgICBjb25zdCB7IGRhdGEgfSA9IGF3YWl0IHRoaXMuYXBpLmdldChcclxuICAgICAgICBgYXBpL3YxL2FjY291bnRzLyR7dGhpcy5hY2NvdW50X2lkfS9jb250YWN0cy9zZWFyY2gvP3E9JHtxdWVyeX1gXHJcbiAgICAgICk7XHJcbiAgICAgIHJldHVybiBkYXRhO1xyXG4gICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICBjb25zb2xlLmxvZyhlKTtcclxuICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBhc3luYyBjcmVhdGVDb250YWN0KG1lc3NhZ2U6IGFueSkge1xyXG4gICAgY29uc3QgYm9keSA9IHtcclxuICAgICAgaW5ib3hfaWQ6IHRoaXMuaW5ib3hfaWQsXHJcbiAgICAgIG5hbWU6IG1lc3NhZ2Uuc2VuZGVyLmlzTXlDb250YWN0XHJcbiAgICAgICAgPyBtZXNzYWdlLnNlbmRlci5mb3JtYXR0ZWROYW1lXHJcbiAgICAgICAgOiBtZXNzYWdlLnNlbmRlci5wdXNobmFtZSB8fCBtZXNzYWdlLnNlbmRlci5mb3JtYXR0ZWROYW1lLFxyXG4gICAgICBwaG9uZV9udW1iZXI6XHJcbiAgICAgICAgdHlwZW9mIG1lc3NhZ2Uuc2VuZGVyLmlkID09ICdvYmplY3QnXHJcbiAgICAgICAgICA/IG1lc3NhZ2Uuc2VuZGVyLmlkLnVzZXJcclxuICAgICAgICAgIDogbWVzc2FnZS5zZW5kZXIuaWQuc3BsaXQoJ0AnKVswXSxcclxuICAgIH07XHJcbiAgICBib2R5LnBob25lX251bWJlciA9IGArJHtib2R5LnBob25lX251bWJlcn1gO1xyXG4gICAgY29uc3QgY29udGFjdCA9IGF3YWl0IHRoaXMuZmluZENvbnRhY3QoYm9keS5waG9uZV9udW1iZXIucmVwbGFjZSgnKycsICcnKSk7XHJcbiAgICBpZiAoY29udGFjdCAmJiBjb250YWN0Lm1ldGEuY291bnQgPiAwKSByZXR1cm4gY29udGFjdC5wYXlsb2FkWzBdO1xyXG5cclxuICAgIHRyeSB7XHJcbiAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmFwaS5wb3N0KFxyXG4gICAgICAgIGBhcGkvdjEvYWNjb3VudHMvJHt0aGlzLmFjY291bnRfaWR9L2NvbnRhY3RzYCxcclxuICAgICAgICBib2R5XHJcbiAgICAgICk7XHJcbiAgICAgIHJldHVybiBkYXRhLmRhdGEucGF5bG9hZC5jb250YWN0O1xyXG4gICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICBjb25zb2xlLmxvZyhlKTtcclxuICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBhc3luYyBmaW5kQ29udmVyc2F0aW9uKGNvbnRhY3Q6IGFueSkge1xyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3QgeyBkYXRhIH0gPSBhd2FpdCB0aGlzLmFwaS5nZXQoXHJcbiAgICAgICAgYGFwaS92MS9hY2NvdW50cy8ke3RoaXMuYWNjb3VudF9pZH0vY29udGFjdHMvJHtjb250YWN0LmlkfS9jb252ZXJzYXRpb25zYFxyXG4gICAgICApO1xyXG4gICAgICByZXR1cm4gZGF0YS5wYXlsb2FkLmZpbmQoXHJcbiAgICAgICAgKGU6IGFueSkgPT4gZS5pbmJveF9pZCA9PSB0aGlzLmluYm94X2lkICYmIGUuc3RhdHVzICE9ICdyZXNvbHZlZCdcclxuICAgICAgKTtcclxuICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgY29uc29sZS5sb2coZSk7XHJcbiAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgYXN5bmMgY3JlYXRlQ29udmVyc2F0aW9uKGNvbnRhY3Q6IGFueSwgc291cmNlX2lkOiBhbnkpIHtcclxuICAgIGNvbnN0IGNvbnZlcnNhdGlvbiA9IGF3YWl0IHRoaXMuZmluZENvbnZlcnNhdGlvbihjb250YWN0KTtcclxuICAgIGlmIChjb252ZXJzYXRpb24pIHJldHVybiBjb252ZXJzYXRpb247XHJcblxyXG4gICAgY29uc3QgYm9keSA9IHtcclxuICAgICAgc291cmNlX2lkOiBzb3VyY2VfaWQsXHJcbiAgICAgIGluYm94X2lkOiB0aGlzLmluYm94X2lkLFxyXG4gICAgICBjb250YWN0X2lkOiBjb250YWN0LmlkLFxyXG4gICAgICBzdGF0dXM6ICdvcGVuJyxcclxuICAgIH07XHJcblxyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3QgeyBkYXRhIH0gPSBhd2FpdCB0aGlzLmFwaS5wb3N0KFxyXG4gICAgICAgIGBhcGkvdjEvYWNjb3VudHMvJHt0aGlzLmFjY291bnRfaWR9L2NvbnZlcnNhdGlvbnNgLFxyXG4gICAgICAgIGJvZHlcclxuICAgICAgKTtcclxuICAgICAgcmV0dXJuIGRhdGE7XHJcbiAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKGUpO1xyXG4gICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuICB9XHJcbn1cclxuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFlQSxJQUFBQSxNQUFBLEdBQUFDLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBQyxTQUFBLEdBQUFGLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBRSxVQUFBLEdBQUFILHNCQUFBLENBQUFDLE9BQUE7O0FBRUEsSUFBQUcsWUFBQSxHQUFBSixzQkFBQSxDQUFBQyxPQUFBOztBQUVBLElBQUFJLFlBQUEsR0FBQUosT0FBQSxrQkFBNkMsQ0FyQjdDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQWRBLENBb0JBO0FBR2UsTUFBTUssY0FBYyxDQUFDLENBVWxDQyxXQUFXQSxDQUFDQyxNQUFXLEVBQUVDLE9BQWUsRUFBRSxDQUN4QyxJQUFJLENBQUNELE1BQU0sR0FBR0EsTUFBTSxDQUNwQixJQUFJLENBQUNFLFdBQVcsR0FBRyxJQUFJLENBQUNGLE1BQU0sQ0FBQ0UsV0FBVyxHQUN0QyxJQUFJLENBQUNGLE1BQU0sQ0FBQ0UsV0FBVztJQUN0QixZQUFXO0lBQ2hCLElBQUksQ0FBQ0MsYUFBYSxHQUFHLElBQUksQ0FBQ0gsTUFBTSxDQUFDRyxhQUFhO0lBQzFDLElBQUksQ0FBQ0gsTUFBTSxDQUFDRyxhQUFhO0lBQ3pCLGVBQWU7SUFDbkIsSUFBSSxDQUFDQyxNQUFNLEdBQUc7TUFDWkMsUUFBUSxFQUFFLElBQUksQ0FBQ0gsV0FBVztNQUMxQkksRUFBRSxFQUFFLElBQUksQ0FBQ0g7SUFDWCxDQUFDO0lBQ0QsSUFBSSxDQUFDSSxVQUFVLEdBQUcsSUFBSSxDQUFDUCxNQUFNLENBQUNPLFVBQVU7SUFDeEMsSUFBSSxDQUFDQyxRQUFRLEdBQUcsSUFBSSxDQUFDUixNQUFNLENBQUNRLFFBQVE7SUFDcEMsSUFBSSxDQUFDQyxHQUFHLEdBQUdDLGNBQUssQ0FBQ0MsTUFBTSxDQUFDO01BQ3RCQyxPQUFPLEVBQUUsSUFBSSxDQUFDWixNQUFNLENBQUNZLE9BQU87TUFDNUJDLE9BQU8sRUFBRTtRQUNQLGNBQWMsRUFBRSxnQ0FBZ0M7UUFDaERDLGdCQUFnQixFQUFFLElBQUksQ0FBQ2QsTUFBTSxDQUFDZTtNQUNoQztJQUNGLENBQUMsQ0FBQzs7SUFFRjtJQUNBQyx5QkFBWSxDQUFDQyxFQUFFLENBQUUsVUFBU2hCLE9BQVEsRUFBQyxFQUFFLENBQUNpQixNQUFNLEVBQUVDLE9BQU8sRUFBRUMsTUFBTSxLQUFLO01BQ2hFQyxVQUFVLENBQUMsWUFBWTtRQUNyQixJQUFJckIsTUFBTSxFQUFFc0IsUUFBUSxFQUFFQyxVQUFVLEtBQUssS0FBSyxFQUFFO1VBQzFDLElBQUksQ0FBQ0MsV0FBVyxDQUFDSixNQUFNLEVBQUU7WUFDdkJoQixNQUFNLEVBQUUsSUFBSSxDQUFDQSxNQUFNO1lBQ25CcUIsTUFBTSxFQUFFLElBQUksQ0FBQ3RCLGFBQWEsR0FBRyxPQUFPO1lBQ3BDdUIsSUFBSSxFQUFFLE9BQU87WUFDYkMsU0FBUyxFQUFFLFFBQVE7WUFDbkJDLFFBQVEsRUFBRSxXQUFXO1lBQ3JCQyxPQUFPLEVBQUUsZUFBZTtZQUN4QlgsTUFBTSxFQUFFQSxNQUFNLENBQUNZLE9BQU8sQ0FBQyx3QkFBd0IsRUFBRSxFQUFFO1VBQ3JELENBQUMsQ0FBQztRQUNKO01BQ0YsQ0FBQyxFQUFFLElBQUksQ0FBQztJQUNWLENBQUMsQ0FBQzs7SUFFRjtJQUNBZCx5QkFBWSxDQUFDQyxFQUFFLENBQUUsVUFBU2hCLE9BQVEsRUFBQyxFQUFFLENBQUNtQixNQUFNLEVBQUVXLE1BQU0sS0FBSztNQUN2RCxJQUFJL0IsTUFBTSxFQUFFc0IsUUFBUSxFQUFFVSxVQUFVLEtBQUssS0FBSyxFQUFFO1FBQzFDLElBQUksQ0FBQ1IsV0FBVyxDQUFDSixNQUFNLEVBQUU7VUFDdkJoQixNQUFNLEVBQUUsSUFBSSxDQUFDQSxNQUFNO1VBQ25CcUIsTUFBTSxFQUFFLElBQUksQ0FBQ3RCLGFBQWEsR0FBRyxPQUFPO1VBQ3BDOEIsSUFBSSxFQUFHLHNCQUFxQkYsTUFBTztRQUNyQyxDQUFDLENBQUM7TUFDSjtJQUNGLENBQUMsQ0FBQzs7SUFFRjtJQUNBZix5QkFBWSxDQUFDQyxFQUFFLENBQUUsWUFBV2hCLE9BQVEsRUFBQyxFQUFFLENBQUNtQixNQUFNLEVBQUVjLE9BQU8sS0FBSztNQUMxRCxJQUFJLENBQUNWLFdBQVcsQ0FBQ0osTUFBTSxFQUFFYyxPQUFPLENBQUM7SUFDbkMsQ0FBQyxDQUFDO0VBQ0o7O0VBRUE7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7O0VBRUE7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTs7RUFFQTtFQUNBO0VBQ0E7RUFDQTtFQUNBOztFQUVBOztFQUVBO0VBQ0E7RUFDQTtFQUNBOztFQUVBO0VBQ0E7RUFDQTtFQUNBOztFQUVBO0VBQ0E7RUFDQTtFQUNBOztFQUVBO0VBQ0E7O0VBRUE7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7O0VBRUE7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBOztFQUVBLE1BQU1WLFdBQVdBLENBQUNKLE1BQVcsRUFBRWMsT0FBWSxFQUFFO0lBQzNDLElBQUlBLE9BQU8sQ0FBQ0MsVUFBVSxJQUFJRCxPQUFPLENBQUNULE1BQU0sQ0FBQ1csT0FBTyxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsRUFBRTs7SUFFcEUsTUFBTUMsT0FBTyxHQUFHLE1BQU0sSUFBSSxDQUFDQyxhQUFhLENBQUNKLE9BQU8sQ0FBQztJQUNqRCxNQUFNSyxZQUFZLEdBQUcsTUFBTSxJQUFJLENBQUNDLGtCQUFrQjtNQUNoREgsT0FBTztNQUNQSCxPQUFPLENBQUNULE1BQU0sQ0FBQ2dCLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQzdCLENBQUM7O0lBRUQsSUFBSTtNQUNGO01BQ0U7TUFDRSxPQUFPO01BQ1AsT0FBTztNQUNQLElBQUk7TUFDSixVQUFVO01BQ1YsS0FBSztNQUNMLE9BQU87TUFDUCxTQUFTLENBQ1Y7TUFBQ0MsUUFBUSxDQUFDUixPQUFPLENBQUNSLElBQUksQ0FBQztNQUN4QjtRQUNBLElBQUlRLE9BQU8sQ0FBQ04sUUFBUSxLQUFLLFlBQVksRUFBRU0sT0FBTyxDQUFDTixRQUFRLEdBQUcsWUFBWTtRQUN0RSxNQUFNZSxTQUFTLEdBQUdDLGtCQUFJLENBQUNELFNBQVMsQ0FBQ1QsT0FBTyxDQUFDTixRQUFRLENBQUM7UUFDbEQsTUFBTWlCLFFBQVEsR0FBSSxHQUFFWCxPQUFPLENBQUNQLFNBQVUsSUFBR2dCLFNBQVUsRUFBQztRQUNwRCxJQUFJRyxHQUFHOztRQUVQLElBQUlaLE9BQU8sQ0FBQ2hCLE1BQU0sRUFBRTtVQUNsQjRCLEdBQUcsR0FBR1osT0FBTyxDQUFDaEIsTUFBTTtRQUN0QixDQUFDLE1BQU07VUFDTCxNQUFNNkIsTUFBTSxHQUFHLE1BQU0zQixNQUFNLENBQUM0QixXQUFXLENBQUNkLE9BQU8sQ0FBQztVQUNoRFksR0FBRyxHQUFHQyxNQUFNLENBQUNFLFFBQVEsQ0FBQyxRQUFRLENBQUM7UUFDakM7O1FBRUEsTUFBTUMsU0FBUyxHQUFHQyxNQUFNLENBQUNDLElBQUksQ0FBQ04sR0FBRyxFQUFFLFFBQVEsQ0FBQztRQUM1QyxNQUFNTyxNQUFNLEdBQUdDLG9CQUFXLENBQUNDLHNCQUFzQixDQUFDTCxTQUFTLENBQUM7O1FBRTVELE1BQU1NLElBQUksR0FBRyxJQUFJQyxpQkFBUSxDQUFDLENBQUM7UUFDM0IsSUFBSXZCLE9BQU8sQ0FBQ0wsT0FBTyxFQUFFO1VBQ25CMkIsSUFBSSxDQUFDRSxNQUFNLENBQUMsU0FBUyxFQUFFeEIsT0FBTyxDQUFDTCxPQUFPLENBQUM7UUFDekM7O1FBRUEyQixJQUFJLENBQUNFLE1BQU0sQ0FBQyxlQUFlLEVBQUVMLE1BQU0sRUFBRTtVQUNuQ1IsUUFBUSxFQUFFQSxRQUFRO1VBQ2xCYyxXQUFXLEVBQUV6QixPQUFPLENBQUNOO1FBQ3ZCLENBQUMsQ0FBQzs7UUFFRjRCLElBQUksQ0FBQ0UsTUFBTSxDQUFDLGNBQWMsRUFBRSxVQUFVLENBQUM7UUFDdkNGLElBQUksQ0FBQ0UsTUFBTSxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUM7O1FBRS9CLE1BQU1FLFVBQThCLEdBQUc7VUFDckNoRCxPQUFPLEVBQUUsSUFBSSxDQUFDWixNQUFNLENBQUNZLE9BQU87VUFDNUJDLE9BQU8sRUFBRTtZQUNQQyxnQkFBZ0IsRUFBRSxJQUFJLENBQUNkLE1BQU0sQ0FBQ2UsS0FBSztZQUNuQyxHQUFHeUMsSUFBSSxDQUFDSyxVQUFVLENBQUM7VUFDckI7UUFDRixDQUFDO1FBQ0QsTUFBTUMsUUFBUSxHQUFJLG1CQUFrQixJQUFJLENBQUN2RCxVQUFXLGtCQUFpQmdDLFlBQVksQ0FBQ2pDLEVBQUcsV0FBVTs7UUFFL0YsTUFBTXlELE1BQU0sR0FBRyxNQUFNckQsY0FBSyxDQUFDc0QsSUFBSSxDQUFDRixRQUFRLEVBQUVOLElBQUksRUFBRUksVUFBVSxDQUFDOztRQUUzRCxPQUFPRyxNQUFNO01BQ2YsQ0FBQyxNQUFNO1FBQ0wsTUFBTTlCLElBQUksR0FBRztVQUNYZ0MsT0FBTyxFQUFFL0IsT0FBTyxDQUFDRCxJQUFJO1VBQ3JCaUMsWUFBWSxFQUFFO1FBQ2hCLENBQUM7UUFDRCxNQUFNSixRQUFRLEdBQUksbUJBQWtCLElBQUksQ0FBQ3ZELFVBQVcsa0JBQWlCZ0MsWUFBWSxDQUFDakMsRUFBRyxXQUFVOztRQUUvRixNQUFNLEVBQUVrRCxJQUFJLENBQUMsQ0FBQyxHQUFHLE1BQU0sSUFBSSxDQUFDL0MsR0FBRyxDQUFDdUQsSUFBSSxDQUFDRixRQUFRLEVBQUU3QixJQUFJLENBQUM7UUFDcEQsT0FBT3VCLElBQUk7TUFDYjtJQUNGLENBQUMsQ0FBQyxPQUFPVyxDQUFDLEVBQUU7TUFDVkMsT0FBTyxDQUFDQyxLQUFLLENBQUMsd0JBQXdCLEVBQUVGLENBQUMsQ0FBQztNQUMxQyxPQUFPLElBQUk7SUFDYjtFQUNGOztFQUVBLE1BQU1HLFdBQVdBLENBQUNDLEtBQWEsRUFBRTtJQUMvQixJQUFJO01BQ0YsTUFBTSxFQUFFZixJQUFJLENBQUMsQ0FBQyxHQUFHLE1BQU0sSUFBSSxDQUFDL0MsR0FBRyxDQUFDK0QsR0FBRztRQUNoQyxtQkFBa0IsSUFBSSxDQUFDakUsVUFBVyx1QkFBc0JnRSxLQUFNO01BQ2pFLENBQUM7TUFDRCxPQUFPZixJQUFJO0lBQ2IsQ0FBQyxDQUFDLE9BQU9XLENBQUMsRUFBRTtNQUNWQyxPQUFPLENBQUNLLEdBQUcsQ0FBQ04sQ0FBQyxDQUFDO01BQ2QsT0FBTyxJQUFJO0lBQ2I7RUFDRjs7RUFFQSxNQUFNN0IsYUFBYUEsQ0FBQ0osT0FBWSxFQUFFO0lBQ2hDLE1BQU1ELElBQUksR0FBRztNQUNYekIsUUFBUSxFQUFFLElBQUksQ0FBQ0EsUUFBUTtNQUN2QmtFLElBQUksRUFBRXhDLE9BQU8sQ0FBQzlCLE1BQU0sQ0FBQ3VFLFdBQVc7TUFDNUJ6QyxPQUFPLENBQUM5QixNQUFNLENBQUN3RSxhQUFhO01BQzVCMUMsT0FBTyxDQUFDOUIsTUFBTSxDQUFDQyxRQUFRLElBQUk2QixPQUFPLENBQUM5QixNQUFNLENBQUN3RSxhQUFhO01BQzNEQyxZQUFZO01BQ1YsT0FBTzNDLE9BQU8sQ0FBQzlCLE1BQU0sQ0FBQ0UsRUFBRSxJQUFJLFFBQVE7TUFDaEM0QixPQUFPLENBQUM5QixNQUFNLENBQUNFLEVBQUUsQ0FBQ3dFLElBQUk7TUFDdEI1QyxPQUFPLENBQUM5QixNQUFNLENBQUNFLEVBQUUsQ0FBQ21DLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQ3RDLENBQUM7SUFDRFIsSUFBSSxDQUFDNEMsWUFBWSxHQUFJLElBQUc1QyxJQUFJLENBQUM0QyxZQUFhLEVBQUM7SUFDM0MsTUFBTXhDLE9BQU8sR0FBRyxNQUFNLElBQUksQ0FBQ2lDLFdBQVcsQ0FBQ3JDLElBQUksQ0FBQzRDLFlBQVksQ0FBQy9DLE9BQU8sQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDMUUsSUFBSU8sT0FBTyxJQUFJQSxPQUFPLENBQUMwQyxJQUFJLENBQUNDLEtBQUssR0FBRyxDQUFDLEVBQUUsT0FBTzNDLE9BQU8sQ0FBQzRDLE9BQU8sQ0FBQyxDQUFDLENBQUM7O0lBRWhFLElBQUk7TUFDRixNQUFNekIsSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDL0MsR0FBRyxDQUFDdUQsSUFBSTtRQUM3QixtQkFBa0IsSUFBSSxDQUFDekQsVUFBVyxXQUFVO1FBQzdDMEI7TUFDRixDQUFDO01BQ0QsT0FBT3VCLElBQUksQ0FBQ0EsSUFBSSxDQUFDeUIsT0FBTyxDQUFDNUMsT0FBTztJQUNsQyxDQUFDLENBQUMsT0FBTzhCLENBQUMsRUFBRTtNQUNWQyxPQUFPLENBQUNLLEdBQUcsQ0FBQ04sQ0FBQyxDQUFDO01BQ2QsT0FBTyxJQUFJO0lBQ2I7RUFDRjs7RUFFQSxNQUFNZSxnQkFBZ0JBLENBQUM3QyxPQUFZLEVBQUU7SUFDbkMsSUFBSTtNQUNGLE1BQU0sRUFBRW1CLElBQUksQ0FBQyxDQUFDLEdBQUcsTUFBTSxJQUFJLENBQUMvQyxHQUFHLENBQUMrRCxHQUFHO1FBQ2hDLG1CQUFrQixJQUFJLENBQUNqRSxVQUFXLGFBQVk4QixPQUFPLENBQUMvQixFQUFHO01BQzVELENBQUM7TUFDRCxPQUFPa0QsSUFBSSxDQUFDeUIsT0FBTyxDQUFDRSxJQUFJO1FBQ3RCLENBQUNoQixDQUFNLEtBQUtBLENBQUMsQ0FBQzNELFFBQVEsSUFBSSxJQUFJLENBQUNBLFFBQVEsSUFBSTJELENBQUMsQ0FBQ3BDLE1BQU0sSUFBSTtNQUN6RCxDQUFDO0lBQ0gsQ0FBQyxDQUFDLE9BQU9vQyxDQUFDLEVBQUU7TUFDVkMsT0FBTyxDQUFDSyxHQUFHLENBQUNOLENBQUMsQ0FBQztNQUNkLE9BQU8sSUFBSTtJQUNiO0VBQ0Y7O0VBRUEsTUFBTTNCLGtCQUFrQkEsQ0FBQ0gsT0FBWSxFQUFFK0MsU0FBYyxFQUFFO0lBQ3JELE1BQU03QyxZQUFZLEdBQUcsTUFBTSxJQUFJLENBQUMyQyxnQkFBZ0IsQ0FBQzdDLE9BQU8sQ0FBQztJQUN6RCxJQUFJRSxZQUFZLEVBQUUsT0FBT0EsWUFBWTs7SUFFckMsTUFBTU4sSUFBSSxHQUFHO01BQ1htRCxTQUFTLEVBQUVBLFNBQVM7TUFDcEI1RSxRQUFRLEVBQUUsSUFBSSxDQUFDQSxRQUFRO01BQ3ZCNkUsVUFBVSxFQUFFaEQsT0FBTyxDQUFDL0IsRUFBRTtNQUN0QnlCLE1BQU0sRUFBRTtJQUNWLENBQUM7O0lBRUQsSUFBSTtNQUNGLE1BQU0sRUFBRXlCLElBQUksQ0FBQyxDQUFDLEdBQUcsTUFBTSxJQUFJLENBQUMvQyxHQUFHLENBQUN1RCxJQUFJO1FBQ2pDLG1CQUFrQixJQUFJLENBQUN6RCxVQUFXLGdCQUFlO1FBQ2xEMEI7TUFDRixDQUFDO01BQ0QsT0FBT3VCLElBQUk7SUFDYixDQUFDLENBQUMsT0FBT1csQ0FBQyxFQUFFO01BQ1ZDLE9BQU8sQ0FBQ0ssR0FBRyxDQUFDTixDQUFDLENBQUM7TUFDZCxPQUFPLElBQUk7SUFDYjtFQUNGO0FBQ0YsQ0FBQ21CLE9BQUEsQ0FBQUMsT0FBQSxHQUFBekYsY0FBQSIsImlnbm9yZUxpc3QiOltdfQ==