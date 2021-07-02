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
import fs from 'fs';
import FormData from 'form-data';
import path from 'path';

export default class rocketChatClient {
    constructor(config) {
        this.config = config;
        this.api = axios.create({
            baseURL: this.config.baseURL,
            headers: {
                'Content-type': 'application/json',
                'X-Auth-Token': this.config.authToken,
                'X-User-Id': this.config.userId,
            },
        });
    }

    async Base64decoder(base) {
        let buff = new Buffer.from(base.body, 'base64');
        if (!base.filename) {
            var tempPath = base.mimetype.split('/')[1].split(';')[0];
        } else {
            var tempPath = base.filename.split('.')[1];
        }
        fs.writeFileSync(path.join(__dirname, '../public/' + base.chatId.split('@')[0] + '.' + tempPath), buff);
    }

    async sendMessage(client, message) {
        if (message.mimetype) {
            await this.typeMessage(client, message);
            return;
        }else if (message.type == 'location'){
            message.body = `http://maps.google.com/maps?q=${message.lat},${message.lng}&ll=${message.lat},${message.lng}&z=17`
        }
        let body = {
            From: `${message.chatId.split('@')[0]}--${client.session}`,
            Body: message.body,
            MediaContentType0: 'Null',
            MediaUrl0: 'Null',
            NumMedia: '0',
        };

       
        try {
            const { data } = await this.api.post(`/api/v1/livechat/sms-incoming/twilio`, body);
            
            const { data: result } = await this.api.get(`/api/v1/livechat/rooms?open=true`);
            
            if (data == "<Response><Message>Sorry, no online agents</Message></Response>"){
                let body = {
                    channel: "#general",
                    text: `*Contato do Cliente:* ${message.chatId.split('@')[0]}\n *Mensagem:* Tentativa de Contato, nenhum agente online`
                }
                const result = await this.api.post(`/api/v1/chat.postMessage`, body);
                return
            }
            return data;
        } catch (e) {
            return null;
        }
    }

    async sendInit(client, message) {
        let body = {
            From: `${message.chatId.split('@')[0]}--${client.session}`,
            Body: '',
            MediaContentType0: 'Null',
            MediaUrl0: 'Null',
            NumMedia: '0',
        };

        try {
            const { data } = await this.api.post(`/api/v1/livechat/sms-incoming/twilio`, body);


        } catch (e) {
            return null;
        }
    }
    async typeMessage(client, type) {
        await this.Base64decoder(type);
        const { data: result } = await this.api.get(`/api/v1/livechat/rooms?open=true`);
        if (!type.filename) {
            var tempPath = type.mimetype.split('/')[1].split(';')[0];
        } else {
            var tempPath = type.filename.split('.')[1];
        }
        const pathSend = type.chatId.split('@')[0] + '.' + tempPath;

        const captionMessage = type.caption ? type.caption : '';

        if (result.count == 0) {
            await this.sendInit(client, type);
            await this.typeMessage(client, type);
        }
        var count = 0;
        for (let item in result.rooms) {
            if (result.rooms[item].v.username === type.chatId.split('@')[0]) {
                count = count + 1;
                await this.uploadMedia(
                    result.rooms[item].v.token,
                    result.rooms[item]._id,
                    pathSend,
                    captionMessage,
                    type
                );
            }
            if (count == 0) {
                await this.sendInit(type);
                await this.typeMessage(type);
            }
        }
        return;
    }

    async uploadMedia(token, rid, pathToUpload, description, message) {
        let data = new FormData();
        const fileData = {
            filename: pathToUpload,
            filepath: pathToUpload,
        };

        data.append('file', fs.createReadStream(path.join(__dirname, '../public/' + pathToUpload)), fileData);
        data.append('msg', description);

        this.apiMedia = axios.create({
            baseURL: this.config.baseURL,
            headers: {
                'Content-Type': `multipart/form-data; boundary=${data._boundary}`,
                'x-visitor-token': token,
            },
            maxContentLength: 'Infinity',
            maxBodyLength: 'Infinity',
        });
        try {
            const { data: upload } = await this.apiMedia.post('/api/v1/livechat/upload/' + rid, data);
            return;
        } catch (err) {
            console.log(err);
            return 'erro';
        }
    }
}
