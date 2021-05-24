import {chromiumArgs, clientsArray, config} from "./sessionUtil";
import {create, SocketState, tokenStore} from "@wppconnect-team/wppconnect";
import {callWebHook, startHelper} from "./functions";
import {download} from "../controller/sessionController";
import Logger from "./logger"
import fs from "fs";

export default class CreateSessionUtil {
    async createSessionUtil(req, clientsArray, session) {
        try {
            let {webhook} = req.body;
            webhook = webhook === undefined ? config.webhook.url : webhook;

            let client = this.getClient(session);
            if (client.status != null && client.status !== 'CLOSED')
                return;
            client.status = "INITIALIZING";
            client.webhook = webhook;

            let myTokenStore = new tokenStore.FileTokenStore({
                encodeFunction: (data) => {
                    return this.encodeFunction(data, client.webhook);
                },
                decodeFunction: (text) => {
                    return this.decodeFunction(text, client);
                }
            });

            let wppClient = await create(
                {
                    session: session,
                    headless: true,
                    devtools: false,
                    useChrome: true,
                    debug: false,
                    logQR: true,
                    browserArgs: chromiumArgs,
                    refreshQR: 15000,
                    disableSpins: true,
                    tokenStore: myTokenStore,
                    autoClose: 0,
                    catchQR: (base64Qr, asciiQR) => {
                        this.exportQR(req, base64Qr, client);
                    },
                    statusFind: (statusFind) => {
                        if (statusFind === 'autocloseCalled') {
                            client.status = 'CLOSED';
                            client.qrcode = null;
                        }
                        Logger.info(statusFind + '\n\n')
                    }
                });

            client = clientsArray[session] = Object.assign(wppClient, client);
            await this.start(req, client);
        } catch (e) {
            Logger.error(e);
        }
    }

    async opendata(req, session) {
        await this.createSessionUtil(req, clientsArray, session);
    }

    exportQR(req, qrCode, client) {
        Object.assign(client, {status: 'QRCODE', qrcode: qrCode});

        qrCode = qrCode.replace('data:image/png;base64,', '');
        const imageBuffer = Buffer.from(qrCode, 'base64');

        fs.writeFileSync(`${client.session}.png`, imageBuffer);

        req.io.emit("qrCode", {
            data: "data:image/png;base64," + imageBuffer.toString("base64"),
            session: client.session
        });

        callWebHook(client, "qrcode", qrCode);
    }

    async start(req, client) {
        try {
            await client.isConnected();
            Object.assign(client, {status: 'CONNECTED', qrcode: null});

            Logger.info(`Started Session: ${client.session}`);
            req.io.emit("session-logged", {status: true, session: client.session});
            await startHelper(client);
        } catch (error) {
            Logger.error(error);
            req.io.emit("session-error", client.session);
        }

        await this.checkStateSession(client);
        await this.listenMessages(req, client);
        await this.listenAcks(client);
        await this.onPresenceChanged(client);
    }

    async checkStateSession(client) {
        await client.onStateChange((state) => {
            Logger.info(`State Change ${state}: ${client.session}`);
            const conflits = [
                SocketState.CONFLICT
            ];

            if (conflits.includes(state)) {
                client.useHere();
            }
        });
    }

    async listenMessages(req, client) {
        await client.onMessage(async (message) => {
            callWebHook(client, "onmessage", message)
        });

        await client.onAnyMessage((message) => {
            message.session = client.session;

            if (message.type === "sticker") {
                download(message, client);
            }

            req.io.emit("received-message", {response: message});
        });
    }

    async listenAcks(client) {
        await client.onAck(async (ack) => {
            callWebHook(client, "onack", ack)
        });

    }

    async onPresenceChanged(client) {
        await client.onPresenceChanged(async (presenceChangedEvent) => {
            callWebHook(client, "onpresencechanged", presenceChangedEvent)
        });
    }

    encodeFunction(data, webhook) {
        data.webhook = webhook;
        return JSON.stringify(data);
    }

    decodeFunction(text, client) {
        let object = JSON.parse(text);
        if (object.webhook && !client.webhook)
            client.webhook = object.webhook;
        return object;
    }

    getClient(session) {
        let client = clientsArray[session];

        if (!client)
            client = clientsArray[session] = {status: null, session: session};
        return client;
    }
}