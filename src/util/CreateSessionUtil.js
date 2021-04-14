import {clientsArray, WEBHOOK_URL, sessions} from "./SessionUtil";
import {create, SocketState} from "@wppconnect-team/wppconnect";
import fs from "fs";
import api from 'axios'
import {download} from "../controller/SessionController";

let chromiumArgs = ['--disable-web-security', '--no-sandbox', '--disable-web-security', '--aggressive-cache-discard', '--disable-cache', '--disable-application-cache', '--disable-offline-load-stale-cache', '--disk-cache-size=0', '--disable-background-networking', '--disable-default-apps', '--disable-extensions', '--disable-sync', '--disable-translate', '--hide-scrollbars', '--metrics-recording-only', '--mute-audio', '--no-first-run', '--safebrowsing-disable-auto-update', '--ignore-certificate-errors', '--ignore-ssl-errors', '--ignore-certificate-errors-spki-list'];

export async function opendata(req, session) {
    await createSessionUtil(req, clientsArray, session)
}

async function createSessionUtil(req, clientsArray, session) {
    try {
        clientsArray[session] = await create(session, (base64Qr, asciiQR) => {
            exportQR(req, base64Qr, session);
        }, (statusFind) => {
            console.log(statusFind + '\n\n')
        }, {
            headless: true,
            devtools: false,
            useChrome: true,
            debug: false,
            logQR: true,
            browserArgs: chromiumArgs,
            refreshQR: 15000,
            disableSpins: true,
        })

        await start(req, clientsArray, session);
        sessions.push({session: req.session, token: req.token});
    } catch (e) {
        console.log('error create -> ', e)
    }
}

function exportQR(req, qrCode, session) {
    qrCode = qrCode.replace('data:image/png;base64,', '');
    const imageBuffer = Buffer.from(qrCode, 'base64');

    fs.writeFileSync(`${session}.png`, imageBuffer);

    req.io.emit('qrCode', {
        data: 'data:image/png;base64,' + imageBuffer.toString('base64'),
        session: session
    });
}

async function start(req, client, session) {
    try {
        await clientsArray[session].isConnected();

        console.log(`Started Session: ${session}`);
        req.io.emit('session-logged', {status: true, session: session})
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
        if (WEBHOOK_URL) {
            try {
                await api.post(WEBHOOK_URL, {message: message})
            } catch (e) {
                console.log('erro ao enviar a mensagem');
            }
        }
    })

    await client[session].onAnyMessage((message) => {
        message.session = session;

        if (message.type === 'sticker') {
            download(message, session)
        }

        req.io.emit('received-message', {response: message});
    });
}

async function listenAcks(client, session) {
    await client[session].onAck(async (ack) => {
        if (WEBHOOK_URL) {
            try {
                await api.post(WEBHOOK_URL, {ack: ack})
            } catch (e) {
                console.log('erro ao enviar o ack')
            }
        }
    });

}