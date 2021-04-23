import { clientsArray, IP_BASE, sessions } from "./SessionUtil";
import { create, SocketState, tokenStore } from "@wppconnect-team/wppconnect";
import fs from "fs";
import api from 'axios'
import { download } from "../controller/SessionController";

let chromiumArgs = ['--disable-web-security', '--no-sandbox', '--disable-web-security', '--aggressive-cache-discard', '--disable-cache', '--disable-application-cache', '--disable-offline-load-stale-cache', '--disk-cache-size=0', '--disable-background-networking', '--disable-default-apps', '--disable-extensions', '--disable-sync', '--disable-translate', '--hide-scrollbars', '--metrics-recording-only', '--mute-audio', '--no-first-run', '--safebrowsing-disable-auto-update', '--ignore-certificate-errors', '--ignore-ssl-errors', '--ignore-certificate-errors-spki-list'];

export async function opendata(req, session) {
    await createSessionUtil(req, clientsArray, session)
}

async function createSessionUtil(req, clientsArray, session) {
    try {
        let { webhook } = req.body;
        webhook = webhook == undefined ? IP_BASE : webhook;

        let myTokenStore = new tokenStore.FileTokenStore({
            encodeFunction: (data) => {
                return encodeFunction(data, webhook);
            }
        });

        clientsArray[session] = await create(
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
                catchQR: (base64Qr, asciiQR) => {
                    exportQR(req, base64Qr, session);
                },
                statusFind: (statusFind) => {
                    console.log(statusFind + '\n\n')
                }
            });

        await start(req, clientsArray, session, webhook);
        sessions.push({ session: req.session, token: req.token });
    } catch (e) {
        console.log('error create -> ', e)
    }
}

function encodeFunction(data, webhook) {
    data.webhook = webhook;
    return JSON.stringify(data);
}

function exportQR(req, qrCode, session) {
    qrCode = qrCode.replace('data:image/png;base64,', '');
    const imageBuffer = Buffer.from(qrCode, 'base64');
    clientsArray[session].base64Qr = qrCode;

    fs.writeFileSync(`${session}.png`, imageBuffer);

    req.io.emit('qrCode', {
        data: 'data:image/png;base64,' + imageBuffer.toString('base64'),
        session: session
    });
}

async function start(req, client, session, webhook) {
    try {
        await clientsArray[session].isConnected();
        clientsArray[session].webhook = webhook;
        console.log(`Started Session: ${session}`);
        req.io.emit('session-logged', { status: true, session: session })
    } catch (error) {
        console.log(`Error Session: ${session}`)
        req.io.emit('session-error', session)
    }

    await checkStateSession(client, session);
    await listenMessages(req, client, session)
    await listenAcks(client, session)
}

async function checkStateSession(client, session) {
    await client[session].onStateChange((state) => {
        console.log(`State Change ${state}: ${session}`);
        const conflits = [
            SocketState.CONFLICT,
            SocketState.UNPAIRED,
            SocketState.UNLAUNCHED,
        ];

        if (conflits.includes(state)) {
            client[session].useHere();
        }
    });
}

async function listenMessages(req, client, session) {
    await client[session].onMessage(async (message) => {
        try {
            await api.post(client.webhook, { message: message })
        } catch (e) {
            console.log('erro ao enviar o ack');
        }
    })

    await client[session].onAnyMessage((message) => {
        message.session = session;

        if (message.type === 'sticker') {
            download(message, session)
        }

        req.io.emit('received-message', { response: message });
    });
}

async function listenAcks(client, session) {
    await client[session].onAck(async (ack) => {
        try {
            await api.post(client.webhook, { ack: ack })
        } catch (e) {
            console.log('erro ao enviar o ack')
        }
    });

}