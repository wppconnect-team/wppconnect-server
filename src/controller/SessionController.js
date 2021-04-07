import {clientsArray, IP_BASE, sessions} from "../util/SessionUtil";
import {opendata} from "../util/CreateSessionUtil";
import getAllTokens from "../util/GetAllTokens";
import api from "axios";
import fs from 'fs';
import mime from 'mime-types';

async function downloadFIle(message, session) {
    try {
        const buffer = await clientsArray[session].decryptFile(message);

        let filename = `./WhatsAppImages/file${message.t}`
        if (!fs.existsSync(filename)) {
            let result = `${filename}.${mime.extension(message.mimetype)}`

            await fs.writeFile(result, buffer, (err) => {
                console.log(err)
            });

            return result
        } else {
            return `${filename}.${mime.extension(message.mimetype)}`
        }
    } catch (e) {
        console.log(e)
    }
}

async function download(message, session) {
    try {
        const path = await downloadFIle(message, session);
        return path.replace('./', '');
    } catch (e) {
        console.log(e);
    }
}

export async function startAllSessions(req, res) {
    const {secretkey} = req.params
    const {authorization: token} = req.headers;

    let tokenDecrypt = '';

    if (secretkey === undefined) {
        tokenDecrypt = token.split(' ')[0];
    } else {
        tokenDecrypt = secretkey;
    }

    const allSessions = await getAllTokens();

    if (tokenDecrypt !== process.env.SECRET_KEY) {
        return res.status(400).json({
            response: false,
            message: 'O token informado está incorreto.'
        })
    }

    allSessions.map(async (session) => {
        await opendata(req, res, session.replace('data.json', ''))
    })

    return await res.status(201).json({status: "Success", message: "Iniciando todas as sessões"})
}

export async function startSession(req, res) {
    const session = req.session;

    await res.status(201).json({
        message: 'Inicializando Sessão',
        session: session
    })

    await opendata(req, session)
}

export async function closeSession(req, res) {
    const session = req.session;

    await clientsArray[session].close();
    sessions.filter(item => item !== session);

    req.io.emit('whatsapp-status', false);
    await api.post(IP_BASE, {'message': `Session: ${session} disconnected`, connected: false})
}

export async function checkConnectionSession(req, res) {
    const session = req.session
    try {
        await clientsArray[session].isConnected();

        return res.status(200).json({status: true, message: "Connected"});
    } catch (error) {
        return res.status(200).json({status: false, message: "Disconnected"});
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
            message: 'A sessão está ativa.'
        })

    } catch (error) {
        return res.status(200).json({
            response: false,
            message: 'A sessão não está ativa.'
        })
    }
}

export async function getChatById(req, res) {
    const session = req.session;
    const {phone} = req.body;

    try {
        const allMessages = await clientsArray[session].getAllMessagesInChat(phone, true, true);


        let dir = './WhatsAppImages';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }

        allMessages.map((message) => {
            if (message.type === 'sticker') {
                download(message, session)
                message.body = `http://localhost:21465/files/file${message.t}.${mime.extension(message.mimetype)}`
            }
        })

        return res.json({status: 'Success', response: allMessages})
    } catch (e) {
        console.log("Não há mensagens")
        return res.json({status: "Error", response: []})
    }
}

export async function downloadMediaByMessage(req, res) {
    const session = req.session;
    const {message} = req.body;

    let result = '';

    if (message.isMedia === true) {
        await download(message, session)
        result = `http://localhost:21465/files/file${message.t}.${mime.extension(message.mimetype)}`
    } else if (message.type === 'ptt' || message.type === 'sticker') {
        await download(message, session)
        result = `http://localhost:21465/files/file${message.t}.${mime.extension(message.mimetype)}`
    }

    return res.status(200).json(result);
}