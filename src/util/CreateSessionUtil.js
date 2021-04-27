import { clientsArray, sessions } from "./SessionUtil";
import { create, SocketState, tokenStore } from "@wppconnect-team/wppconnect";
import fs from "fs";
import { callWebHook } from "../util/functions";
import { download } from "../controller/SessionController";

let chromiumArgs = ["--disable-web-security", "--no-sandbox", "--disable-web-security", "--aggressive-cache-discard", "--disable-cache", "--disable-application-cache", "--disable-offline-load-stale-cache", "--disk-cache-size=0", "--disable-background-networking", "--disable-default-apps", "--disable-extensions", "--disable-sync", "--disable-translate", "--hide-scrollbars", "--metrics-recording-only", "--mute-audio", "--no-first-run", "--safebrowsing-disable-auto-update", "--ignore-certificate-errors", "--ignore-ssl-errors", "--ignore-certificate-errors-spki-list"];

export async function opendata(req, session) {
    await createSessionUtil(req, clientsArray, session);
}

async function createSessionUtil(req, clientsArray, session) {
    try {
        let { webhook } = req.body;
        webhook = webhook == undefined ? process.env.WEBHOOK_URL : webhook;

        let myTokenStore = new tokenStore.FileTokenStore({
            encodeFunction: (data) => {
                return encodeFunction(data, webhook);
            }
        });

        let client = getClient(session);
        if (client.status != null)
            return;
        client.status = "INITIALIZING";
        client.webhook = webhook;

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
                    exportQR(req, base64Qr, client);
                },
                statusFind: (statusFind) => {
                    console.log(statusFind + '\n\n')
                }
            });

        client = clientsArray[session] = Object.assign(wppClient, client);
        await start(req, client);
        sessions.push({ session: req.session, token: req.token });
    } catch (e) {
        console.log("error create -> ", e);
    }
}

function encodeFunction(data, webhook) {
    data.webhook = webhook;
    return JSON.stringify(data);
}

function exportQR(req, qrCode, client) {
    Object.assign(client, { status: 'QRCODE', qrcode: qrCode });

    qrCode = qrCode.replace('data:image/png;base64,', '');
    const imageBuffer = Buffer.from(qrCode, 'base64');

    fs.writeFileSync(`${client.session}.png`, imageBuffer);

    req.io.emit("qrCode", {
        data: "data:image/png;base64," + imageBuffer.toString("base64"),
        session: client.session
    });
    callWebHook(client, "qrcode", { qrcode: qrCode });
}

async function start(req, client) {
    try {
        await client.isConnected();
        Object.assign(client, { status: 'CONNECTED' });

        console.log(`Started Session: ${client.session}`);
        req.io.emit("session-logged", { status: true, session: client.session });
    } catch (error) {
        console.log(`Error Session: ${client.session}`);
        req.io.emit("session-error", client.session);
    }

    await checkStateSession(client);
    await listenMessages(req, client);
    await listenAcks(client);
}

async function checkStateSession(client) {
    await client.onStateChange((state) => {
        console.log(`State Change ${state}: ${client.session}`);
        const conflits = [
            SocketState.CONFLICT,
            SocketState.UNPAIRED,
            SocketState.UNLAUNCHED,
        ];

        if (conflits.includes(state)) {
            client.useHere();
        }
    });
}

async function listenMessages(req, client) {
    await client.onMessage(async (message) => {
        try {
            await callWebHook(client, "onmessage", message)
        } catch (e) {
            console.log("A URL do Webhook não foi informado.");
        }
    });

    await client.onAnyMessage((message) => {
        message.session = client.session;

        if (message.type === "sticker") {
            download(message, client.session);
        }

        req.io.emit("received-message", { response: message });
    });
}

async function listenAcks(client) {
    await client.onAck(async (ack) => {
        try {
            await callWebHook(client, "onack", { ack: ack })
        } catch (e) {
            console.log("A URL do Webhook não foi informado.");
        }
    });

}

function getClient(session) {
    let client = clientsArray[session];

    if (!client)
        client = clientsArray[session] = { status: null, session: session };
    return client;
}