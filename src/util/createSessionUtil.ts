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
import { create, SocketState, StatusFind } from '@wppconnect-team/wppconnect';
import { Request } from 'express';

import { download } from '../controller/sessionController';
import { WhatsAppServer } from '../types/WhatsAppServer';
import chatWootClient from './chatWootClient';
import { autoDownload, callWebHook, startHelper } from './functions';
import { clientsArray, eventEmitter } from './sessionUtil';
import Factory from './tokenStore/factory';

// Map to track sessions that are currently initializing
const initializingPromises = new Map<string, Promise<void>>();

// Timeout for waiting on another initialization (in milliseconds)
// This covers: browser launch (10s) + page load (15s) + QR scan by user (45s) + connection (10s) + buffer (10s)
// Note: Should be longer than the autoClose timeout in config to allow QR scanning
const INITIALIZATION_WAIT_TIMEOUT = 90000; // 90 seconds

// Helper function to add timeout to a promise
function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    ),
  ]);
}

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
      const client = this.getClient(session) as any;

      req.logger.info(
        `[${session}:server] Checking session status: ${client.status}`
      );

      // Check if session is already active and working
      if (client.status != null && client.status !== 'CLOSED') {
        req.logger.info(
          `[${session}:server] Session already active with status: ${client.status}`
        );
        return;
      }

      // CRITICAL FIX: Check if this session is currently being initialized by another request
      if (initializingPromises.has(session)) {
        req.logger.info(
          `[${session}:server] Session is already being initialized, waiting...`
        );
        try {
          // Wait for the existing initialization to complete (with timeout)
          await withTimeout(
            initializingPromises.get(session)!,
            INITIALIZATION_WAIT_TIMEOUT,
            `Timeout waiting for ${session} initialization`
          );
          req.logger.info(
            `[${session}:server] Session initialization completed by another request`
          );

          // After waiting, get the current client state and return it to the user
          const completedClient = this.getClient(session) as any;
          if (completedClient && res && !res._headerSent) {
            if (completedClient.status === 'CONNECTED') {
              req.logger.info(
                `[${session}:server] Returning CONNECTED status after wait`
              );
              res.status(200).json({
                status: 'CONNECTED',
                message: 'Session connected',
                session: session,
              });
            } else if (completedClient.status === 'QRCODE') {
              req.logger.info(
                `[${session}:server] Returning QRCODE status after wait`
              );
              res.status(200).json({
                status: 'QRCODE',
                qrcode: completedClient.qrcode,
                urlcode: completedClient.urlcode,
                session: session,
              });
            } else if (completedClient.status === 'PHONECODE') {
              req.logger.info(
                `[${session}:server] Returning PHONECODE status after wait`
              );
              res.status(200).json({
                status: 'PHONECODE',
                phone: completedClient.phone,
                phoneCode: completedClient.phoneCode,
                session: session,
              });
            } else {
              // Any other status (including CLOSED, null, etc.)
              req.logger.info(
                `[${session}:server] Returning status ${completedClient.status} after wait`
              );
              res.status(200).json({
                status: completedClient.status || 'CLOSED',
                session: session,
              });
            }
          }
          return;
        } catch (error) {
          if (
            error instanceof Error &&
            error.message.includes('Timeout waiting')
          ) {
            req.logger.error(
              `[${session}:server] Timeout waiting for initialization, cleaning up...`
            );
            // Remove the stale promise so we can retry
            initializingPromises.delete(session);
            // Continue to initialize ourselves
          } else {
            // Initialization failed (e.g., Auto Close, network error, etc.)
            req.logger.warn(
              `[${session}:server] Initialization failed: ${error}`
            );

            // Get the current client state (should be CLOSED after failure)
            const failedClient = this.getClient(session) as any;

            // Don't retry - just inform all waiting requests that the session failed/closed
            // They can send a new request if they want to try again
            if (res && !res._headerSent) {
              res.status(200).json({
                status: failedClient.status || 'CLOSED',
                message: String(error),
                session: session,
              });
            }
            return;
          }
        }
      }

      req.logger.info(
        `[${session}:server] Starting new session initialization`
      );

      // CRITICAL: Register the promise FIRST before any async work
      // This acts as an atomic "lock" - first one to set wins
      const initPromise = this.performInitialization(
        req,
        clientsArray,
        session,
        res,
        client
      );
      initializingPromises.set(session, initPromise);

      req.logger.info(`[${session}:server] Registered initialization promise`);

      // NOW set status and update array (after promise is registered)
      client.status = 'INITIALIZING';
      client.config = req.body;
      clientsArray[session] = client; // Update array so middleware can see it

      req.logger.info(
        `[${session}:server] Updated client status to INITIALIZING and registered in clientsArray`
      );

      // Set a safety timeout to auto-cleanup if initialization hangs
      const cleanupTimeout = setTimeout(() => {
        if (initializingPromises.get(session) === initPromise) {
          req.logger.error(
            `[${session}:server] Initialization exceeded maximum time (95s), forcing cleanup`
          );
          initializingPromises.delete(session);
        }
      }, INITIALIZATION_WAIT_TIMEOUT + 5000); // 95 seconds - 5 seconds buffer after wait timeout

      try {
        await initPromise;
        clearTimeout(cleanupTimeout);
        req.logger.info(
          `[${session}:server] Initialization completed successfully`
        );
      } finally {
        // Always remove from the map when done
        clearTimeout(cleanupTimeout);
        initializingPromises.delete(session);
        req.logger.info(
          `[${session}:server] Cleaned up initialization promise`
        );
      }
    } catch (e) {
      req.logger.error(`[${session}:server] Error in createSessionUtil: ${e}`);
      if (e instanceof Error && e.name == 'TimeoutError') {
        const client = this.getClient(session) as any;
        client.status = 'CLOSED';
        req.logger.error(
          `[${session}:server] TimeoutError - set status to CLOSED`
        );
      }
      // Remove from initializing map on error
      initializingPromises.delete(session);
    }
  }

  private async performInitialization(
    req: any,
    clientsArray: any,
    session: string,
    res: any,
    client: any
  ) {
    // Status and config already set in createSessionUtil

    const tokenStore = new Factory();
    const myTokenStore = tokenStore.createTokenStory(client);
    const tokenData = await myTokenStore.getToken(session);

    // we need this to update phone in config every time session starts, so we can ask for code for it again.
    myTokenStore.setToken(session, tokenData ?? {});

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
        client.config.proxy
          ? {
              proxy: {
                url: client.config.proxy?.url,
                username: client.config.proxy?.username,
                password: client.config.proxy?.password,
              },
            }
          : {},
        req.serverOptions.createOptions,
        {
          session: session,
          phoneNumber: client.config.phone ?? null,
          deviceName:
            client.config.phone == undefined // bug when using phone code this shouldn't be passed (https://github.com/wppconnect-team/wppconnect-server/issues/1687#issuecomment-2099357874)
              ? client.config?.deviceName ||
                req.serverOptions.deviceName ||
                'WppConnect'
              : undefined,
          poweredBy:
            client.config.phone == undefined // bug when using phone code this shouldn't be passed (https://github.com/wppconnect-team/wppconnect-server/issues/1687#issuecomment-2099357874)
              ? client.config?.poweredBy ||
                req.serverOptions.poweredBy ||
                'WPPConnect-Server'
              : undefined,
          catchLinkCode: (code: string) => {
            this.exportPhoneCode(req, client.config.phone, code, client, res);
          },
          catchQR: (
            qrCode: string,
            asciiQR: string,
            attempt: number,
            urlCode?: string
          ) => {
            if (attempt > 1) {
              // Browser must be closed after first qrcode expires, to prevent accidental qrcode scanning and autoclose being called
              client.status = 'CLOSED';
              client.qrcode = null;
              client.urlcode = null; // Clear urlcode to prevent confusion
              client.close();
              clientsArray[session] = undefined;

              eventEmitter.emit(
                `status-${client.session}`,
                client,
                StatusFind.autocloseCalled
              );
              callWebHook(client, req, 'status-find', {
                status: StatusFind.autocloseCalled,
                session: client.session,
              });

              req.logger.info(
                `[${session}:server] Closing Browser as old qrcode is expired!`
              );
            } else {
              this.exportQR(req, qrCode, urlCode, client, res);
            }
          },
          onLoadingScreen: (percent: string, message: string) => {
            req.logger.info(`[${session}] ${percent}% - ${message}`);
          },
          statusFind: (statusFind: StatusFind) => {
            try {
              eventEmitter.emit(`status-${client.session}`, client, statusFind);
              if (
                statusFind === StatusFind.autocloseCalled ||
                statusFind === StatusFind.disconnectedMobile
              ) {
                client.status = 'CLOSED';
                client.qrcode = null;
                client.urlcode = null; // Clear urlcode to prevent confusion
                client.close();
                clientsArray[session] = undefined;
              }
              callWebHook(client, req, 'status-find', {
                status: statusFind,
                session: client.session,
              });
              req.logger.info(
                `\n\n[${session}:server] Status: ${statusFind}\n\n`
              );
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
  }

  async opendata(req: Request, session: string, res?: any) {
    await this.createSessionUtil(req, clientsArray, session, res);
  }

  exportPhoneCode(
    req: any,
    phone: any,
    phoneCode: any,
    client: WhatsAppServer,
    res?: any
  ) {
    eventEmitter.emit(`phoneCode-${client.session}`, phoneCode, client);

    Object.assign(client, {
      status: 'PHONECODE',
      phoneCode: phoneCode,
      phone: phone,
    });

    req.io.emit('phoneCode', {
      data: phoneCode,
      phone: phone,
      session: client.session,
    });

    callWebHook(client, req, 'phoneCode', {
      phoneCode: phoneCode,
      phone: phone,
      session: client.session,
    });

    if (res && !res._headerSent)
      res.status(200).json({
        status: 'phoneCode',
        phone: phone,
        phoneCode: phoneCode,
        session: client.session,
      });
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

    req.io.emit('qrCode', {
      data: 'data:image/png;base64,' + imageBuffer.toString('base64'),
      session: client.session,
    });

    callWebHook(client, req, 'qrcode', {
      qrcode: qrCode,
      urlcode: urlCode,
      session: client.session,
    });
    if (res && !res._headerSent)
      res.status(200).json({
        status: 'qrcode',
        qrcode: qrCode,
        urlcode: urlCode,
        session: client.session,
      });
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

    await client.onAnyMessage(async (message: any) => {
      message.session = client.session;

      if (message.type === 'sticker') {
        download(message, client, req.logger);
      }

      if (
        req.serverOptions?.websocket?.autoDownload ||
        (req.serverOptions?.webhook?.autoDownload && message.fromMe == false)
      ) {
        await autoDownload(client, req, message);
      }

      req.io.emit('received-message', { response: message });
      if (req.serverOptions.webhook.onSelfMessage && message.fromMe)
        callWebHook(client, req, 'onselfmessage', message);
    });

    await client.onIncomingCall(async (call) => {
      req.io.emit('incomingcall', call);
      callWebHook(client, req, 'incomingcall', call);
    });
  }

  async listenAcks(client: WhatsAppServer, req: Request) {
    await client.onAck(async (ack) => {
      req.io.emit('onack', ack);
      callWebHook(client, req, 'onack', ack);
    });
  }

  async onPresenceChanged(client: WhatsAppServer, req: Request) {
    await client.onPresenceChanged(async (presenceChangedEvent) => {
      req.io.emit('onpresencechanged', presenceChangedEvent);
      callWebHook(client, req, 'onpresencechanged', presenceChangedEvent);
    });
  }

  async onReactionMessage(client: WhatsAppServer, req: Request) {
    await client.isConnected();
    await client.onReactionMessage(async (reaction: any) => {
      req.io.emit('onreactionmessage', reaction);
      callWebHook(client, req, 'onreactionmessage', reaction);
    });
  }

  async onRevokedMessage(client: WhatsAppServer, req: Request) {
    await client.isConnected();
    await client.onRevokedMessage(async (response: any) => {
      req.io.emit('onrevokedmessage', response);
      callWebHook(client, req, 'onrevokedmessage', response);
    });
  }
  async onPollResponse(client: WhatsAppServer, req: Request) {
    await client.isConnected();
    await client.onPollResponse(async (response: any) => {
      req.io.emit('onpollresponse', response);
      callWebHook(client, req, 'onpollresponse', response);
    });
  }
  async onLabelUpdated(client: WhatsAppServer, req: Request) {
    await client.isConnected();
    await client.onUpdateLabel(async (response: any) => {
      req.io.emit('onupdatelabel', response);
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
