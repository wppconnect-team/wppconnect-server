import {clientsArray, config} from "../util/sessionUtil";
import {callWebHook} from "../util/functions";
import {opendata} from "../util/createSessionUtil";
import getAllTokens from "../util/getAllTokens";
import Logger from "../util/logger";
import api from "axios";
import fs from "fs";
import mime from "mime-types";

async function downloadFileFunction(message, client) {
    try {
        const buffer = await client.decryptFile(message);

        let filename = `./WhatsAppImages/file${message.t}`;
        if (!fs.existsSync(filename)) {
            let result = "";
            if (message.type === "ptt") {
                result = `${filename}.oga`;
            } else {
                result = `${filename}.${mime.extension(message.mimetype)}`;
            }

            await fs.writeFile(result, buffer, (err) => {
                if (err) {
                    Logger.error(err);
                }
            });

            return result;
        } else {
            return `${filename}.${mime.extension(message.mimetype)}`;
        }
    } catch (e) {
        Logger.error(e);
        Logger.warn("Erro ao descriptografar a midia, tentando fazer o download direto...");
        try {
            const buffer = await client.downloadMedia(message);
            const filename = `./WhatsAppImages/file${message.t}`;
            if (!fs.existsSync(filename)) {
                let result = "";
                if (message.type === "ptt") {
                    result = `${filename}.oga`;
                } else {
                    result = `${filename}.${mime.extension(message.mimetype)}`;
                }

                await fs.writeFile(result, buffer, (err) => {
                    if (err) {
                        Logger.error(err);
                    }
                });

                return result;
            } else {
                return `${filename}.${mime.extension(message.mimetype)}`;
            }
        } catch (e) {
            Logger.error(e);
            Logger.warn("Não foi possível baixar a mídia...");
        }
    }
}

export async function download(message, client) {
    try {
        const path = await downloadFileFunction(message, client);
        return path.replace("./", "");
    } catch (e) {
        Logger.error(e);
    }
}

export async function startAllSessions(req, res) {
    const {secretkey} = req.params;
    const {authorization: token} = req.headers;

    let tokenDecrypt = "";

    if (secretkey === undefined) {
        tokenDecrypt = token.split(" ")[0];
    } else {
        tokenDecrypt = secretkey;
    }

    const allSessions = await getAllTokens();

    if (tokenDecrypt !== config.secretKey) {
        return res.status(400).json({
            response: false,
            message: "O token informado está incorreto."
        });
    }

    allSessions.map(async (session) => {
        await opendata(req, session.replace(".data.json", ""));
    });

    return await res.status(201).json({status: "Success", message: "Iniciando todas as sessões"});
}

export async function startSession(req, res) {
    const session = req.session;

    await getSessionState(req, res);

    await opendata(req, session);
}

export async function closeSession(req, res) {
    const session = req.session;
    try {
        await req.client.close();
        clientsArray[session] = {status: null};

        req.io.emit("whatsapp-status", false);
        callWebHook(req.client, "closesession", {"message": `Session: ${session} disconnected`, connected: false});

        return await res.status(200).json({status: true, message: "Sessão Fechada com sucesso"});
    } catch (error) {
        return await res.status(400).json({status: false, message: "Error ao fechar sessão", error});
    }

}

export async function logOutSession(req, res) {
    try {
        const session = req.session;
        await req.client.logout();

        req.io.emit("whatsapp-status", false);
        callWebHook(req.client, "logoutsession", {"message": `Session: ${session} logged out`, connected: false});

        return await res.status(200).json({status: true, message: "Sessão Fechada com sucesso"});
    } catch (error) {
        return await res.status(400).json({status: false, message: "Error ao fechar sessão", error});
    }

}

export async function checkConnectionSession(req, res) {
    const session = req.session;
    try {
        await req.client.isConnected();

        return res.status(200).json({status: true, message: "Connected"});
    } catch (error) {
        return res.status(200).json({status: false, message: "Disconnected"});
    }
}

export async function showAllSessions(req, res) {
    const allSessions = await clientsArray.map((client) => {
        console.log(client);
        return client.session;
    });

    console.log(allSessions);
    return res.status(200).json(allSessions);
}

export async function downloadMediaByMessage(req, res) {
    const session = req.session;
    const {messageId} = req.body;

    let result = "";

    if (messageId.isMedia === true) {
        await download(messageId, req.client);
        result = `${config.host}:${config.port}/files/file${messageId.t}.${mime.extension(messageId.mimetype)}`;
    } else if (messageId.type === "ptt" || messageId.type === "sticker") {
        await download(messageId, req.client);
        result = `${config.host}:${config.port}/files/file${messageId.t}.${mime.extension(messageId.mimetype)}`;
    }

    return res.status(200).json(result);
}

export async function getMediaByMessage(req, res) {
    const session = req.session;
    const client = req.client;
    const {messageId} = req.params;

    try {
        const message = await client.getMessageById(messageId);

        if (!message)
            return res.status(400).json(
                {
                    response: false,
                    message: "Mensagem não encontrada !"
                });

        if (!(message['mimetype'] || message.isMedia || message.isMMS))
            return res.status(400).json(
                {
                    response: false,
                    message: "Mensagem não contem midia !"
                });


        const buffer = await client.decryptFile(message);

        return res.status(200).json(await buffer.toString('base64'));
    } catch (ex) {
        Logger.error(ex);
        return res.status(400).json({
            response: false,
            message: "A sessão não está ativa."
        });
    }


}

export async function getSessionState(req, res) {
    const session = req.session;

    try {
        const client = req.client;

        if (client == null)
            return res.status(200).json({status: 'CLOSED', qrcode: null});
        return res.status(200).json({status: client.status, qrcode: client.qrcode});

    } catch (ex) {
        Logger.error(ex);
        return res.status(400).json({
            response: false,
            message: "A sessão não está ativa."
        });
    }


}

export async function getQrCode(req, res) {
    try {
        var img = Buffer.from(req.client.qrcode.replace(/^data:image\/(png|jpeg|jpg);base64,/, ''), 'base64');

        res.writeHead(200, {
            'Content-Type': 'image/png',
            'Content-Length': img.length
        });
        res.end(img);
    } catch (ex) {
        Logger.error(ex);
        return res.status(400).json({
            response: false,
            message: "Error ao recuperar QRCode !"
        });
    }
}
