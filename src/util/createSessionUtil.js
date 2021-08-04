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
import { clientsArray, eventEmitter } from './sessionUtil';
import { create, SocketState } from '@wppconnect-team/wppconnect';
import { callWebHook, startHelper } from './functions';
import { download } from '../controller/sessionController';
import Factory from './tokenStore/factory';
import chatWootClient from './chatWootClient';

export default class CreateSessionUtil {
  startChatWootClient() {
    if (this.client.config.chatWoot && !this._chatWootClient)
      this._chatWootClient = new chatWootClient(this.client.config.chatWoot);
    return this._chatWootClient;
  }

  async createSessionUtil(req, clientsArray, session, res) {
    try {
      this.client = this.getClient(session);
      if (this.client.status != null && this.client.status !== 'CLOSED') return;
      this.client.status = 'INITIALIZING';
      this.client.config = req.body;

      const tokenStore = new Factory();
      const myTokenStore = tokenStore.createTokenStory(this.client);

      await myTokenStore.getToken(session);
      this.startChatWootClient();

      let wppClient = await create(
        Object.assign({}, { tokenStore: myTokenStore }, req.serverOptions.createOptions, {
          session: session,
          catchQR: (base64Qr, asciiQR, attempt, urlCode) => {
            this.exportQR(req, base64Qr, urlCode, this.client, res);
          },
          statusFind: (statusFind) => {
            try {
              eventEmitter.emit('status', this.client, statusFind);
              if (statusFind === 'autocloseCalled' || statusFind === 'desconnectedMobile') {
                this.client.status = 'CLOSED';
                this.client.qrcode = null;
                this.client.waPage.close();
              }
              callWebHook(this.client, req, 'status-find', { status: statusFind });
              req.logger.info(statusFind + '\n\n');
            } catch (error) {}
          },
        })
      );

      this.client = clientsArray[session] = Object.assign(wppClient, this.client);
      await this.start(req, this.client);

      if (req.serverOptions.webhook.onParticipantsChanged) {
        await this.onParticipantsChanged(req, this.client);
      }
    } catch (e) {
      req.logger.error(e);
    }
  }

  async opendata(req, session, res) {
    await this.createSessionUtil(req, clientsArray, session, res);
  }

  exportQR(req, qrCode, urlCode, client, res) {
    eventEmitter.emit('qrcode', qrCode, urlCode, client);
    Object.assign(client, {
      status: 'QRCODE',
      qrcode: qrCode,
      urlcode: urlCode,
    });

    qrCode = qrCode.replace('data:image/png;base64,', '');
    const imageBuffer = Buffer.from(qrCode, 'base64');

    req.io.emit('qrCode', {
      data: 'data:image/png;base64,' + imageBuffer.toString('base64'),
      session: client.session,
    });

    callWebHook(client, req, 'qrcode', { qrcode: qrCode, urlcode: urlCode });
    if (res && !res._headerSent) res.status(200).json({ status: 'qrcode', qrcode: qrCode, urlcode: urlCode });
  }

  async onParticipantsChanged(req, client) {
    await client.isConnected();
    await client.onParticipantsChanged((message) => {
      callWebHook(client, req, 'onparticipantschanged', message);
    });
  }

  async start(req, client) {
    try {
      await client.isConnected();
      Object.assign(client, { status: 'CONNECTED', qrcode: null });

      req.logger.info(`Started Session: ${client.session}`);
      //callWebHook(client, req, 'session-logged', { status: 'CONNECTED'});
      req.io.emit('session-logged', { status: true, session: client.session });
      startHelper(client, req);
    } catch (error) {
      req.logger.error(error);
      req.io.emit('session-error', client.session);
    }

    await this.checkStateSession(client, req);
    await this.listenMessages(client, req);

    if (req.serverOptions.webhook.listenAcks) {
      await this.listenAcks(client, req);
    }

    if (req.serverOptions.webhook.onPresenceChanged) {
      await this.onPresenceChanged(client, req);
    }
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
      eventEmitter.emit('mensagem', this.client, message);
      callWebHook(client, req, 'onmessage', message);
      if (message.type === 'location')
        client.onLiveLocation(message.sender.id, (location) => {
          callWebHook(client, req, 'location', location);
        });
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
