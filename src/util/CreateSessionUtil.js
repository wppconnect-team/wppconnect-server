import {clientsArray, sessions} from "./SessionUtil";
import {create, SocketState} from "@wppconnect-team/wppconnect";
import fs from "fs";
import path from "path";

let chromiumArgs = ['--disable-web-security', '--no-sandbox', '--disable-web-security', '--aggressive-cache-discard', '--disable-cache', '--disable-application-cache', '--disable-offline-load-stale-cache', '--disk-cache-size=0', '--disable-background-networking', '--disable-default-apps', '--disable-extensions', '--disable-sync', '--disable-translate', '--hide-scrollbars', '--metrics-recording-only', '--mute-audio', '--no-first-run', '--safebrowsing-disable-auto-update', '--ignore-certificate-errors', '--ignore-ssl-errors', '--ignore-certificate-errors-spki-list'];

export async function opendata(req, res, session) {
    await createSessionUtil(req, res, clientsArray, session)

    await res.status(201).json({
        message: 'Inicializando Sessão',
        session: session
    })
}

async function createSessionUtil(req, res, clientsArray, session) {
    try {
        clientsArray[session] = await create(session, (base64Qr, asciiQR) => {
            exportQR(req, res, base64Qr, session);
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

        await start(req, res, clientsArray, session);
    } catch (e) {
        console.log('error create -> ', e)
    }
}

function exportQR(req, res, qrCode, session) {
    qrCode = qrCode.replace('data:image/png;base64,', '');
    const imageBuffer = Buffer.from(qrCode, 'base64');

    fs.writeFileSync(`${session}.png`, imageBuffer);

    req.io.emit('qrCode', {
        data: 'data:image/png;base64,' + imageBuffer.toString('base64'),
        session: session
    });
}

async function start(req, res, client, session) {
    await checkStateSession(req, res, client, session)
    await listenMessages(req, client, session)
}

async function checkStateSession(req, res, client, session) {
    await client[session].onStateChange(async (state) => {
        if (state === 'CONNECTED') {
            req.io.emit('whatsapp-status', true)

            sessions.push(session); //insere a nova sessão no session
            console.log('Status Session -> ', session, ' -> connected');
        }

        const conflits = [
            SocketState.CONFLICT,
            SocketState.UNPAIRED,
            SocketState.UNLAUNCHED,
        ];

        if (conflits.includes(state)) {
            try {
                await client[session].useHere();
            } catch (e) {
                let tokenFile = path.resolve(__dirname, '..', '..', 'tokens', `${session}.data.json`);
                await client[session].close();
                fs.unlinkSync(tokenFile);

                await createSessionUtil(req, res, client, session);
            }
        }
    });
}

async function listenMessages(req, client, session) {
    await client[session].onAnyMessage((message) => {
        console.log(`[${session}]: Mensagem Recebida: \nTelefone: ${message.from}, Mensagem: ${message.body}`)
        message.session = session
        req.io.emit('received-message', {response: message})
    });
}