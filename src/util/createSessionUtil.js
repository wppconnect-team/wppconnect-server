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
  startChatWootClient(client) {
    if (client.config.chatWoot && !client._chatWootClient)
      client._chatWootClient = new chatWootClient(client.config.chatWoot, client.session);
    return client._chatWootClient;
  }

  async createSessionUtil(req, clientsArray, session, res) {
    try {
      let client = this.getClient(session);
      if (client.status != null && client.status !== 'CLOSED') return;
      client.status = 'INITIALIZING';
      client.config = req.body;

      const tokenStore = new Factory();
      const myTokenStore = tokenStore.createTokenStory(client);

      await myTokenStore.getToken(session);
      this.startChatWootClient(client);

      if (req.serverOptions.customUserDataDir) {
        req.serverOptions.createOptions.puppeteerOptions = {
          userDataDir: req.serverOptions.customUserDataDir + session,
        };
      }

      let wppClient = await create(
        Object.assign({}, { tokenStore: myTokenStore }, req.serverOptions.createOptions, {
          session: session,
          deviceName: req.serverOptions.deviceName,
          poweredBy: req.serverOptions.poweredBy || 'WPPConnect-Server',
          catchQR: (base64Qr, asciiQR, attempt, urlCode) => {
            this.exportQR(req, base64Qr, urlCode, client, res);
          },
          onLoadingScreen: (percent, message) => {
            req.logger.info(`[${session}] ${percent}% - ${message}`);
          },
          statusFind: (statusFind) => {
            try {
              eventEmitter.emit(`status-${client.session}`, client, statusFind);
              if (statusFind === 'autocloseCalled' || statusFind === 'desconnectedMobile') {
                client.status = 'CLOSED';
                client.qrcode = null;
                client.close();
                clientsArray[session] = undefined;
              }
              callWebHook(client, req, 'status-find', { status: statusFind });
              req.logger.info(statusFind + '\n\n');
            } catch (error) {}
          },
        })
      );

      client = clientsArray[session] = Object.assign(wppClient, client);
      await this.start(req, client);

      if (req.serverOptions.webhook.onParticipantsChanged) {
        await this.onParticipantsChanged(req, client);
      }

      if (req.serverOptions.webhook.onReactionMessage) {
        await this.onReactionMessage(client, req);
      }
    } catch (e) {
      req.logger.error(e);
    }
  }

  async opendata(req, session, res) {
    await this.createSessionUtil(req, clientsArray, session, res);
  }

  exportQR(req, qrCode, urlCode, client, res) {
    eventEmitter.emit(`qrcode-${client.session}`, qrCode, urlCode, client);
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
      eventEmitter.emit(`mensagem-${client.session}`, client, message);
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

    await client.onIncomingCall(async (call) => {
      req.io.emit('incomingcall', call);
      callWebHook(client, req, 'incomingcall', call);
    });
  }

  async listenAcks(client, req) {
    await client.onAck(async (ack) => {
      req.io.emit('onack', ack);
      callWebHook(client, req, 'onack', ack);
    });
  }

  async onPresenceChanged(client, req) {
    await client.onPresenceChanged(async (presenceChangedEvent) => {
      req.io.emit('onpresencechanged', presenceChangedEvent);
      callWebHook(client, req, 'onpresencechanged', presenceChangedEvent);
    });
  }

  async onReactionMessage(client, req) {
    await client.isConnected();
    await client.onReactionMessage(async (reaction) => {
      req.io.emit('onreactionmessage', reaction);
      callWebHook(client, req, 'onreactionmessage', reaction);
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
