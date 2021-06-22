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
import { clientsArray } from './sessionUtil';
import { create, SocketState, tokenStore } from '@wppconnect-team/wppconnect';
import { callWebHook, startHelper } from './functions';
import { download } from '../controller/sessionController';
import fs from 'fs';
import chatWootClient from './chatWootClient';

export default class CreateSessionUtil {
    get chatWootClient() {
        if (!this._chatWootClient) this._chatWootClient = new chatWootClient(this.serverOptions.chatWoot);
        return this._chatWootClient;
    }

    async createSessionUtil(req, clientsArray, session, res) {
        try {
            let { webhook } = req.body;
            webhook = webhook === undefined ? req.serverOptions.webhook.url : webhook;
            this.serverOptions = req.serverOptions;
            let client = this.getClient(session);
            if (client.status != null && client.status !== 'CLOSED') return;
            client.status = 'INITIALIZING';
            client.webhook = webhook;

            let myTokenStore = new tokenStore.FileTokenStore({
                encodeFunction: (data) => {
                    return this.encodeFunction(data, client.webhook);
                },
                decodeFunction: (text) => {
                    return this.decodeFunction(text, client);
                },
            });

            let wppClient = await create(
                Object.assign({}, { tokenStore: myTokenStore }, req.serverOptions.createOptions, {
                    session: session,
                    catchQR: (base64Qr, asciiQR, attempt, urlCode) => {
                        this.exportQR(req, base64Qr, urlCode, client, res);
                    },
                    statusFind: (statusFind) => {
                        try {
                            if (statusFind === 'autocloseCalled' || statusFind === 'desconnectedMobile') {
                                client.status = 'CLOSED';
                                client.qrcode = null;
                                client.waPage.close();
                            }
                            req.logger.info(statusFind + '\n\n');
                        } catch (error) {}
                    },
                })
            );

            client = clientsArray[session] = Object.assign(wppClient, client);
            await this.start(req, client);
        } catch (e) {
            req.logger.error(e);
        }
    }

    async opendata(req, session, res) {
        await this.createSessionUtil(req, clientsArray, session, res);
    }

    exportQR(req, qrCode, urlCode, client, res) {
        Object.assign(client, {
            status: 'QRCODE',
            qrcode: qrCode,
            urlcode: urlCode,
        });

        qrCode = qrCode.replace('data:image/png;base64,', '');
        const imageBuffer = Buffer.from(qrCode, 'base64');

        fs.writeFileSync(`${client.session}.png`, imageBuffer);

        req.io.emit('qrCode', {
            data: 'data:image/png;base64,' + imageBuffer.toString('base64'),
            session: client.session,
        });

        callWebHook(client, req, 'qrcode', { qrcode: qrCode, urlcode: urlCode });
        if (res && !res._headerSent) res.status(200).json({ status: 'qrcode', qrcode: qrCode, urlcode: urlCode });
    }

    async start(req, client) {
        try {
            await client.isConnected();
            Object.assign(client, { status: 'CONNECTED', qrcode: null });

            req.logger.info(`Started Session: ${client.session}`);
            req.io.emit('session-logged', { status: true, session: client.session });
            startHelper(client, req);
        } catch (error) {
            req.logger.error(error);
            req.io.emit('session-error', client.session);
        }

        await this.checkStateSession(client, req);
        await this.listenMessages(client, req);
        await this.listenAcks(client, req);
        //await this.onPresenceChanged(client, req);
    }

    async checkStateSession(client, req) {
        await client.onStateChange((state) => {
            req.logger.info(`State Change ${state}: ${client.session}`);
            const conflits = [SocketState.CONFLICT];

            if (conflits.includes(state)) {
                client.useHere();
            }
        });
    }

    async listenMessages(client, req) {
        await client.onMessage(async (message) => {
            callWebHook(client, req, 'onmessage', message);
            if (this.serverOptions.chatWoot.enable) this.chatWootClient.sendMessage(message);

            if (message.type == 'location' && message.isLive)
                try {
                    client.onLiveLocation(message.sender.id, (location) => {
                        callWebHook(client, req, 'locationmessage', location);
                    });
                } catch (e) {}
        });

        await client.onAnyMessage((message) => {
            message.session = client.session;

            if (message.type === 'sticker') {
                download(message, client, req.logger);
            }

            req.io.emit('received-message', { response: message });
        });
    }

    async listenAcks(client, req) {
        await client.onAck(async (ack) => {
            callWebHook(client, req, 'onack', ack);
        });
    }

    async onPresenceChanged(client, req) {
        await client.onPresenceChanged(async (presenceChangedEvent) => {
            callWebHook(client, req, 'onpresencechanged', presenceChangedEvent);
        });
    }

    encodeFunction(data, webhook) {
        data.webhook = webhook;
        return JSON.stringify(data);
    }

    decodeFunction(text, client) {
        let object = JSON.parse(text);
        if (object.webhook && !client.webhook) client.webhook = object.webhook;
        delete object.webhook;
        return object;
    }

    getClient(session) {
        let client = clientsArray[session];

        if (!client) client = clientsArray[session] = { status: null, session: session };
        return client;
    }
}
