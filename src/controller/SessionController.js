import { clientsArray, sessions } from "../util/SessionUtil";
import { callWebHook } from "../util/functions";
import { opendata } from "../util/CreateSessionUtil";
import getAllTokens from "../util/GetAllTokens";
import api from "axios";
import fs from "fs";
import mime from "mime-types";

async function downloadFileFunction(message, session) {
    try {
        const buffer = await clientsArray[session].decryptFile(message);

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
                    console.log(err);
                }
            });

            return result;
        } else {
            return `${filename}.${mime.extension(message.mimetype)}`;
        }
    } catch (e) {
        console.log("Erro ao descriptografar a midia, tentando fazer o download direto...");
        try {
            const buffer = await clientsArray[session].downloadMedia(message);
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
                        console.log(err);
                    }
                });

                return result;
            } else {
                return `${filename}.${mime.extension(message.mimetype)}`;
            }
        } catch (e) {
            console.log("Não foi possível baixar a mídia...");
        }
    }
}

export async function download(message, session) {
    try {
        const path = await downloadFileFunction(message, session);
        return path.replace("./", "");
    } catch (e) {
        console.log(e);
    }
}

export async function startAllSessions(req, res) {
    const { secretkey } = req.params;
    const { authorization: token } = req.headers;

    let tokenDecrypt = "";

    if (secretkey === undefined) {
        tokenDecrypt = token.split(" ")[0];
    } else {
        tokenDecrypt = secretkey;
    }

    const allSessions = await getAllTokens();

    if (tokenDecrypt !== process.env.SECRET_KEY) {
        return res.status(400).json({
            response: false,
            message: "O token informado está incorreto."
        });
    }

    allSessions.map(async (session) => {
        await opendata(req, res, session.replace("data.json", ""));
    });

    return await res.status(201).json({ status: "Success", message: "Iniciando todas as sessões" });
}

export async function startSession(req, res) {
    const session = req.session;

    await res.status(201).json({
        message: "Inicializando Sessão",
        session: session
    });

    await opendata(req, session);
}

export async function closeSession(req, res) {
    const session = req.session;

    await clientsArray[session].close();
    sessions.filter(item => item !== session);
    clientsArray[session].status = null;
    req.io.emit("whatsapp-status", false);
    callWebHook(clientsArray[session], "closesession", { "message": `Session: ${session} disconnected`, connected: false });

    return res.status(200).json({ status: true, message: "Sessão Fechada com sucesso" });
}

export async function checkConnectionSession(req, res) {
    const session = req.session;
    try {
        await clientsArray[session].isConnected();

        return res.status(200).json({ status: true, message: "Connected" });
    } catch (error) {
        return res.status(200).json({ status: false, message: "Disconnected" });
    }
}

export async function showAllSessions(req, res) {
    return res.status(200).json(sessions);
}

export async function checkSessionConnected(req, res) {
    const session = req.session;

    try {
        const response = await clientsArray[session].isConnected();
        return res.status(200).json({
            response: response,
            message: "A sessão está ativa."
        });

    } catch (error) {
        return res.status(200).json({
            response: false,
            message: "A sessão não está ativa."
        });
    }
}

export async function downloadMediaByMessage(req, res) {
    const session = req.session;
    const { getMessageById } = req.body;

    let result = "";

    if (message.isMedia === true) {
        await download(message, session);
        result = `http://localhost:21465/files/file${message.t}.${mime.extension(message.mimetype)}`;
    } else if (message.type === "ptt" || message.type === "sticker") {
        await download(message, session);
        result = `http://localhost:21465/files/file${message.t}.${mime.extension(message.mimetype)}`;
    }

    return res.status(200).json(result);
}

export async function getMediaByMessage(req, res) {
    const session = req.session;
    const { messageId } = req.params;

    try {
        const message = await clientsArray[session].getMessageById(messageId);

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


        const buffer = await clientsArray[session].decryptFile(message);

        return res.status(200).json(await buffer.toString('base64'));
    } catch (ex) {
        return res.status(400).json({
            response: false,
            message: "A sessão não está ativa."
        });
    }


}

export async function getSessionState(req, res) {
    const session = req.session;

    try {
        const client = await clientsArray[session];

        return res.status(200).json({ status: client.status, qrcode: client.qrcode });
    } catch (ex) {
        return res.status(400).json({
            response: false,
            message: "A sessão não está ativa."
        });
    }


}