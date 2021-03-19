"use strict";
const wppconnect = require('@wppconnect-team/wppconnect');
const fs = require('fs');
const encrypt = require('../config/encrypt')

let clientsArray = [];
let sessions = [];

let chromiumArgs = ['--disable-web-security', '--no-sandbox', '--disable-web-security', '--aggressive-cache-discard', '--disable-cache', '--disable-application-cache', '--disable-offline-load-stale-cache', '--disk-cache-size=0', '--disable-background-networking', '--disable-default-apps', '--disable-extensions', '--disable-sync', '--disable-translate', '--hide-scrollbars', '--metrics-recording-only', '--mute-audio', '--no-first-run', '--safebrowsing-disable-auto-update', '--ignore-certificate-errors', '--ignore-ssl-errors', '--ignore-certificate-errors-spki-list'];

async function opendata(req, res, session) {
    sessions.push(session)

    clientsArray[session] = await wppconnect.create(session, (base64Qr, asciiQR) => {
        exportQR(req, res, base64Qr, session + '.png', session);
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
    }).catch(erro => console.log(erro))

    await start(req, res, clientsArray, session);

    req.io.emit('whatsapp-status', true)
    res.status(201).json({
        response: 'Sessão aberta com sucesso!',
    })
}

function exportQR(req, res, qrCode, path, session) {
    qrCode = qrCode.replace('data:image/png;base64,', '');
    const imageBuffer = Buffer.from(qrCode, 'base64');

    fs.writeFileSync(path, imageBuffer);

    req.io.emit('qrCode', {
        data: 'data:image/png;base64,' + imageBuffer.toString('base64'),
        session: session
    });
}

async function start(req, res, client, session) {
    await client[session].onStateChange((state) => {
        const conflits = [
            wppconnect.SocketState.CONFLICT,
            wppconnect.SocketState.UNPAIRED,
            wppconnect.SocketState.UNLAUNCHED,
        ];
        if (conflits.includes(state)) {
            client[session].useHere();
        }
    });

    await client[session].onAnyMessage((message) => {
        console.log(`[${session}]: Mensagem Recebida: \nTelefone: ' ${message.from}, Mensagem: ${message.body}`)
        message.session = session
        req.io.emit('received-message', { response: message })
    });
}

module.exports = {
    // Session
    async startSession(req, res) {
        const { session } = req.params
        let tokenDec = session.split(":")[0];
        let sessionDec = session.split(":")[0];

        encrypt.decryptSession(sessionDec, tokenDec)
        opendata(req, res, session)
    },
    async closeSession(req, res) {
        const { session } = req.params
        await clientsArray[session].close();

        req.io.emit('whatsapp-status', false)
    },
    async showAllSessions(req, res) {
        res.status(200).json(sessions)
    },
    async checkSessionConnected(req, res) {
        const { session } = req.params

        if (!session)
            return res.status(401).send({ auth: false, message: 'Sessão não informada.' });

        try {
            const response = await clientsArray[session].isConnected();
            return res.status(200).json({
                response: response,
                message: 'O Whatsapp está aberto.'
            })

        } catch (error) {
            return res.status(200).json({
                response: false,
                message: 'O Whatsapp não está aberto.'
            })
        }
    },

    //Message
    async sendMessage(req, res) {
        const { session } = req.params
        const { phone, message, isGroup = false } = req.body
        try {
            if (isGroup) {
                await clientsArray[session].sendText(phone + "@g.us", message);
            } else {
                await clientsArray[session].sendText(phone + "@c.us", message);
            }

            res.status(201).json({
                response: {
                    message: message,
                    contact: phone,
                    session: session
                },
            })

            req.io.emit('mensagem-enviada', { message: message, to: phone });
        } catch (error) {
            res.status(400).json({
                response: {
                    message: 'Sua mensagem não foi enviada.',
                    session: session,
                    log: error
                },
            })
        }
    },
    async sendImage(req, res) {
        const { session } = req.params
        const { phone, caption, path, isGroup = false } = req.body

        if (!phone)
            return res.status(401).send({ message: 'Telefone não informado.' });

        if (!session)
            return res.status(401).send({ message: 'Sessão não informada.' });

        if (!path)
            return res.status(401).send({
                message: 'Informe o caminho da imagem. Exemplo: C:\\folder\\image.jpg.'
            });

        try {
            if (isGroup) {
                await clientsArray[session].sendImage(
                    phone + "@g.us", //phone
                    path, //path
                    'image-api.jpg', //image name
                    caption //msg (caption)
                );
            } else {
                await clientsArray[session].sendImage(
                    phone + "@c.us", //phone
                    path, //path
                    'image-api.jpg', //image name
                    caption //msg (caption)
                );
            }

            return res.status(201).json({
                response: {
                    status: 'Mensagem enviada com sucesso.',
                    contact: phone,
                },
            })
        } catch (error) {
            res.status(400).json({
                response: {
                    message: 'Sua mensagem não foi enviada.',
                    session: session,
                    log: error
                },
            })
        }
    },
    async sendFile(req, res) {
        const { session } = req.params
        const { path, phone, isGroup = false } = req.body

        if (!session)
            return res.status(401).send({ message: 'Sessão não informada.' });

        if (!session)
            return res.status(401).send({ message: 'O caminho do arquivo não foi informado.' });

        try {
            if (isGroup) {
                await clientsArray[session].sendFile(
                    phone + "@c.us", //phone
                    path, //path file
                    'My File', //Title File
                    'Look this file' //Caption
                );
            } else {
                await clientsArray[session].sendFile(
                    phone + "@g.us", //phone
                    path, //path file
                    'My File', //Title File
                    'Look this file' //Caption
                );
            }

            return res.status(200).json({
                response: {
                    message: "Arquivo enviado com sucesso",
                    phone: phone + "@c.us",
                },
            })
        } catch (error) {
            return res.status(400).json({
                response: {
                    message: 'Sua mensagem não foi enviada.',
                    session: session,
                    log: error
                },
            })
        }
    },

    // Group Functions
    async createGroup(req, res) {
        const { session } = req.params
        const { groupname, phone } = req.body

        if (!session)
            return res.status(401).send({ message: 'Sessão não informada.' });

        if (!groupname)
            return res.status(401).send({ message: 'O nome do grupo não foi informado.' });

        if (!phone)
            return res.status(401).send({ message: 'O Telefone não foi informado.' });

        try {
            await clientsArray[session].createGroup(groupname, phone);
            res.status(200).json({
                response: 'O grupo foi criado com sucesso',
                groupname: groupname,
                phones: phone
            })
        } catch (error) {
            res.status(400).json({
                response: {
                    message: 'O grupo não foi criado.',
                    session: session,
                    log: error
                },
            })
        }
    },
    async joinGroupByCode(req, res) {
        const { session } = req.params
        const { inviteCode } = req.body

        if (!session)
            return res.status(401).send({ message: 'A Sessão não foi informada.' });

        if (!inviteCode)
            return res.status(401).send({ message: 'Informe o Codigo de Convite' });

        try {
            await clientsArray[session].joinGroup(inviteCode);
            res.status(201).json({
                response: {
                    message: 'Você entrou no grupo com sucesso.',
                    inviteCode: inviteCode,
                },
            })
        } catch (error) {
            res.status(400).json({
                response: {
                    message: 'Você não entrou no grupo.',
                    session: session,
                    log: error
                },
            })
        }
    },

    // Device Functions
    async setProfileName(req, res) {
        const { session } = req.params
        const { name } = req.body

        if (!session)
            return res.status(401).send({ message: 'Sessão não informada.' });

        if (!name)
            return res.status(401).send({ message: 'Digite um novo nome de perfil.' });

        try {
            await clientsArray[session].setProfileName(name);
            return res.status(201).json({
                response: {
                    status: true,
                    name: name,
                    session: session
                },
            })
        } catch (error) {
            res.status(400).json({
                response: {
                    message: 'O nome de usuário de perfil não foi alterada.',
                    session: session,
                    log: error
                },
            })
        }
    },
    async setProfileImage(req, res) {
        const { session } = req.params
        const { path } = req.body

        if (!session)
            return res.status(401).send({ message: 'Sessão não informada.' });

        if (!path)
            return res.status(401).send({ message: 'Informe o caminho da imagem.' });

        try {
            await clientsArray[session].setProfilePic(pathimage);
            res.status(201).json({
                response: {
                    message: msg,
                    path: path
                },
            })
        } catch (error) {
            res.status(400).json({
                response: {
                    message: 'A foto de perfil não foi alterada.',
                    session: session,
                    log: error
                },
            })
        }
    },
    async showAllContacts(req, res) {
        const { session } = req.params

        if (!session)
            return res.status(401).send({ auth: false, message: 'Sessão não informada.' });

        try {
            const contacts = await clientsArray[session].getAllContacts();
            res.status(200).json({
                response: contacts
            })
        } catch (error) {
            res.status(401).json({
                response: 'O Whatsapp não está conectado'
            })
        }
    },
}