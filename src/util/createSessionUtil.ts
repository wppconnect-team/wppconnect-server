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
import { create, SocketState } from '@wppconnect-team/wppconnect';
import { Request } from 'express';

import { download } from '../controller/sessionController';
import { WhatsAppServer } from '../types/WhatsAppServer';
import chatWootClient from './chatWootClient';
import { callSocket, callWebHook, startHelper } from './functions';
import { clientsArray, eventEmitter } from './sessionUtil';
import Factory from './tokenStore/factory';

export default class CreateSessionUtil {
  startChatWootClient(client: any) {
    if (client.config.chatWoot && !client._chatWootClient)
      client._chatWootClient = new chatWootClient(
        client.config.chatWoot,
        client.session
      );
    return client._chatWootClient;
  }

  async createSessionUtil(
    req: any,
    clientsArray: any,
    session: string,
    res?: any
  ) {
    try {
      let client = this.getClient(session) as any;
      if (client.status != null && client.status !== 'CLOSED') return;
      client.status = 'INITIALIZING';
      client.config = req.body;

      const tokenStore = new Factory();
      const myTokenStore = tokenStore.createTokenStory(client);
      const tokenData = await myTokenStore.getToken(session);

      if (!tokenData) {
        myTokenStore.setToken(session, {});
      }

      this.startChatWootClient(client);

      if (req.serverOptions.customUserDataDir) {
        req.serverOptions.createOptions.puppeteerOptions = {
          userDataDir: req.serverOptions.customUserDataDir + session,
        };
      }

      const wppClient = await create(
        Object.assign(
          {},
          { tokenStore: myTokenStore },
          req.serverOptions.createOptions,
          {
            session: session,
            deviceName: req.serverOptions.deviceName,
            poweredBy: req.serverOptions.poweredBy || 'WPPConnect-Server',
            catchQR: (
              base64Qr: any,
              asciiQR: any,
              attempt: any,
              urlCode: string
            ) => {
              this.exportQR(req, base64Qr, urlCode, client, res);
            },
            onLoadingScreen: (percent: string, message: string) => {
              req.logger.info(`[${session}] ${percent}% - ${message}`);
            },
            statusFind: (statusFind: string) => {
              try {
                eventEmitter.emit(
                  `status-${client.session}`,
                  client,
                  statusFind
                );
                if (
                  statusFind === 'autocloseCalled' ||
                  statusFind === 'desconnectedMobile'
                ) {
                  client.status = 'CLOSED';
                  client.qrcode = null;
                  client.close();
                  clientsArray[session] = undefined;
                }
                callSocket(req, 'status-find', {
                  status: statusFind,
                  session: client.session,
                });
                callWebHook(client, req, 'status-find', {
                  status: statusFind,
                  session: client.session,
                });
                req.logger.info(statusFind + '\n\n');
              } catch (error) {}
            },
          }
        )
      );

      client = clientsArray[session] = Object.assign(wppClient, client);
      await this.start(req, client);

      if (req.serverOptions.webhook.onParticipantsChanged) {
        await this.onParticipantsChanged(req, client);
      }

      if (req.serverOptions.webhook.onReactionMessage) {
        await this.onReactionMessage(client, req);
      }

      if (req.serverOptions.webhook.onRevokedMessage) {
        await this.onRevokedMessage(client, req);
      }

      if (req.serverOptions.webhook.onPollResponse) {
        await this.onPollResponse(client, req);
      }
      if (req.serverOptions.webhook.onLabelUpdated) {
        await this.onLabelUpdated(client, req);
      }
    } catch (e) {
      req.logger.error(e);
    }
  }

  async opendata(req: Request, session: string, res?: any) {
    await this.createSessionUtil(req, clientsArray, session, res);
  }

  exportQR(
    req: any,
    qrCode: any,
    urlCode: any,
    client: WhatsAppServer,
    res?: any
  ) {
    eventEmitter.emit(`qrcode-${client.session}`, qrCode, urlCode, client);
    Object.assign(client, {
      status: 'QRCODE',
      qrcode: qrCode,
      urlcode: urlCode,
    });

    qrCode = qrCode.replace('data:image/png;base64,', '');
    const imageBuffer = Buffer.from(qrCode, 'base64');

    callSocket(req, 'qr-code', {
      data: 'data:image/png;base64,' + imageBuffer.toString('base64'),
      session: client.session,
    });

    callWebHook(client, req, 'qrcode', { qrcode: qrCode, urlcode: urlCode });
    if (res && !res._headerSent)
      res
        .status(200)
        .json({ status: 'qrcode', qrcode: qrCode, urlcode: urlCode });
  }

  async onParticipantsChanged(req: any, client: any) {
    await client.isConnected();
    await client.onParticipantsChanged((message: any) => {
      callWebHook(client, req, 'onparticipantschanged', message);
    });
  }

  async start(req: Request, client: WhatsAppServer) {
    try {
      await client.isConnected();
      Object.assign(client, { status: 'CONNECTED', qrcode: null });

      req.logger.info(`Started Session: ${client.session}`);
      //callWebHook(client, req, 'session-logged', { status: 'CONNECTED'});

      callSocket(req, 'session-logged', {
        status: true,
        session: client.session,
      });
      startHelper(client, req);
    } catch (error) {
      req.logger.error(error);

      callSocket(req, 'session-error', {
        session: client.session,
      });
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

  async checkStateSession(client: WhatsAppServer, req: Request) {
    await client.onStateChange((state) => {
      req.logger.info(`State Change ${state}: ${client.session}`);
      const conflits = [SocketState.CONFLICT];

      if (conflits.includes(state)) {
        client.useHere();
      }
    });
  }

  async listenMessages(client: WhatsAppServer, req: Request) {
    await client.onMessage(async (message: any) => {
      eventEmitter.emit(`mensagem-${client.session}`, client, message);
      callWebHook(client, req, 'onmessage', message);
      if (message.type === 'location')
        client.onLiveLocation(message.sender.id, (location) => {
          callWebHook(client, req, 'location', location);
        });
    });

    await client.onAnyMessage((message: any) => {
      message.session = client.session;

      if (message.type === 'sticker') {
        download(message, client, req.logger);
      }

      callSocket(req, 'received-message', {
        message,
      });
    });

    await client.onIncomingCall(async (call) => {
      callSocket(req, 'incoming-call', {
        call,
      });
      callWebHook(client, req, 'incomingcall', call);
    });
  }

  async listenAcks(client: WhatsAppServer, req: Request) {
    await client.onAck(async (ack) => {
      callSocket(req, 'on-ack', {
        ack,
      });
      callWebHook(client, req, 'onack', ack);
    });
  }

  async onPresenceChanged(client: WhatsAppServer, req: Request) {
    await client.onPresenceChanged(async (presenceChangedEvent) => {
      callSocket(req, 'on-presence-changed', {
        presenceChangedEvent,
      });
      callWebHook(client, req, 'onpresencechanged', presenceChangedEvent);
    });
  }

  async onReactionMessage(client: WhatsAppServer, req: Request) {
    await client.isConnected();
    await client.onReactionMessage(async (reaction: any) => {
      callSocket(req, 'on-reaction-message', {
        reaction,
      });
      callWebHook(client, req, 'onreactionmessage', reaction);
    });
  }

  async onRevokedMessage(client: WhatsAppServer, req: Request) {
    await client.isConnected();
    await client.onRevokedMessage(async (response: any) => {
      callSocket(req, 'on-revoked-message', {
        response,
      });
      callWebHook(client, req, 'onrevokedmessage', response);
    });
  }
  async onPollResponse(client: WhatsAppServer, req: Request) {
    await client.isConnected();
    await client.onPollResponse(async (response: any) => {
      callSocket(req, 'on-poll-response', {
        response,
      });
      callWebHook(client, req, 'onpollresponse', response);
    });
  }
  async onLabelUpdated(client: WhatsAppServer, req: Request) {
    await client.isConnected();
    await client.onUpdateLabel(async (response: any) => {
      callSocket(req, 'on-update-label', {
        response,
      });
      callWebHook(client, req, 'onupdatelabel', response);
    });
  }

  encodeFunction(data: any, webhook: any) {
    data.webhook = webhook;
    return JSON.stringify(data);
  }

  decodeFunction(text: any, client: any) {
    const object = JSON.parse(text);
    if (object.webhook && !client.webhook) client.webhook = object.webhook;
    delete object.webhook;
    return object;
  }

  getClient(session: any) {
    let client = clientsArray[session];

    if (!client)
      client = clientsArray[session] = {
        status: null,
        session: session,
      } as any;
    return client;
  }
}
