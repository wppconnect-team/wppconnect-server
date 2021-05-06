import fs from "fs";
import {download} from "./SessionController";
import {contactToArray} from "../util/functions";
import Logger from "../util/logger";

export async function setProfileName(req, res) {
    const session = req.session;
    const {name} = req.body;

    if (!name)
        return res.status(401).send({message: "Digite um novo nome de perfil."});

    try {
        await req.client.setProfileName(name);
        return res.status(201).json({
            response: {
                status: true,
                name: name,
                session: session
            },
        });
    } catch (error) {
        Logger.error(error);
        res.status(400).json({
            response: {
                message: "O nome de usuário de perfil não foi alterado.",
                session: session,
                log: error
            },
        });
    }
}

export async function showAllContacts(req, res) {
    const session = req.session;

    try {
        const contacts = await req.client.getAllContacts();
        res.status(200).json({
            response: contacts,
            session: session,
        });
    } catch (error) {
        Logger.error(error);
        res.status(401).json({
            response: "Erro ao buscar os contatos.",
            session: session,
        });
    }
}

export async function getAllGroups(req, res) {
    const session = req.session;

    try {
        const response = await req.client.getAllGroups();

        let groups = response.map(function (data) {
            return {
                "id": data.id.user,
                "name": data.name,
            };
        });

        return res.status(200).json({"groups": groups});
    } catch (e) {
        Logger.error(e);
        res.status(401).json({
            status: "Error",
            message: "Erro ao buscar os grupos.",
            session: session,
        });
    }
}

export async function getAllChats(req, res) {
    const session = req.session;

    try {
        const response = await req.client.getAllChats();
        return res.status(200).json({status: "success", response: response});
    } catch (e) {
        Logger.error(e);
        return res.status(401).json({status: "error", response: "Error on open list"});
    }
}

export async function getChatById(req, res) {
    const {phone, isGroup = false} = req.body;

    try {
        let allMessages = {};

        if (isGroup) {
            allMessages = await req.client.getAllMessagesInChat(`${phone}@g.us`, true, true);
        } else {
            allMessages = await req.client.getAllMessagesInChat(`${phone}@c.us`, true, true);
        }


        let dir = "./WhatsAppImages";
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }

        allMessages.map((message) => {
            if (message.type === "sticker") {
                download(message, req.client);
                message.body = `${process.env.HOST}:${process.env.PORT}/files/file${message.t}.${mime.extension(message.mimetype)}`;
            }
        });

        return res.json({status: "Success", response: allMessages});
    } catch (e) {
        Logger.error(e);
        return res.json({status: "Error", response: []});
    }
}

export async function changePrivacyGroup(req, res) {
    const {phone, status} = req.body;

    try {
        for (const contato of contactToArray(phone)) {
            await req.client.setMessagesAdminsOnly(`${contato}@g.us`, status === "true");
        }

        return res.status(200).json("Privacidade do grupo alterada com sucesso");
    } catch (e) {
        Logger.error(e);
        return res.status(400).json({"messages": "Erro ao alterar privacidade do grupo"});
    }
}

//

export async function getBatteryLevel(req, res) {
    try {
        let response = await req.client.getBatteryLevel();
        return res.status(200).json({status: "Success", "batterylevel": response});
    } catch (e) {
        Logger.error(e);
        return res.status(400).json({status: "Erro ao recuperar status da bateria"});
    }
}

export async function getHostDevice(req, res) {
    try {
        const response = await req.client.getHostDevice();
        return res.status(200).json({
            "phone": response.id.user,
            "connected": response.connected,
            "plataform": response.plataform,
            "locales": response.locales,
            "batery": response.batery,
            "pushname": response.pushname
        });
    } catch (e) {
        Logger.error(e);
        return res.status(400).json({status: "Error", message: "Erro ao recuperar dados do telefone"});
    }
}


export async function getBlockList(req, res) {
    let response = await req.client.getBlockList();

    try {
        const blocked = response.map((contato) => {
            return {phone: contato ? contato.split("@")[0] : ""};
        });

        return res.status(200).json({status: "Success", contacts: blocked});
    } catch (e) {
        Logger.error(e);
        return res.status(400).json({status: "Error", message: "Erro ao recuperar lista de contatos bloqueados"});
    }
}

export async function deleteChat(req, res) {
    const {phone} = req.body;

    try {
        req.client.deleteChat(`${phone}@c.us`);
        return res.status(200).json({status: "Success", message: "Conversa deletada com sucesso"});
    } catch (e) {
        Logger.error(e);
        return res.status(400).json({status: "Error", message: "Erro ao deletar conversa"});
    }
}

export async function clearChat(req, res) {
    const {phone, isGroup = false} = req.body;

    try {
        if (isGroup) {
            await req.client.clearChat(`${phone}@g.us`);
        } else {
            await req.client.clearChat(`${phone}@c.us`);
        }
        return res.status(200).json({status: "Success", message: "Conversa limpa com sucesso"});
    } catch (e) {
        Logger.error(e);
        return res.status(400).json({status: "Error", message: "Erro ao limpar conversa"});
    }
}

export async function archiveChat(req, res) {    
    const {phone, isGroup = false} = req.body;

    try {
        if (isGroup) {
            await req.client.archiveChat(`${phone}@g.us`, true);
        } else {
            await req.client.archiveChat(`${phone}@c.us`, true);
        }
        return res.status(200).json({status: "Success", message: "Conversa arquivada com sucesso"});
    } catch (e) {
        Logger.error(e);
        return res.status(400).json({status: "Error", message: "Erro ao arquivar conversa"});
    }
}

export async function deleteMessage(req, res) {    
    const {phone, messageId} = req.body;

    try {
        await req.client.deleteMessage(`${phone}@c.us`, [messageId]);
        return res.status(200).json({status: "Success", message: "Conversa deletada com sucesso"});
    } catch (e) {
        Logger.error(e);
        return res.status(400).json({status: "Error", message: "Erro ao arquivar conversa"});
    }
}

export async function reply(req, res) {    
    const {phone, text, messageid} = req.body;

    try {
        let response = await req.client.reply(`${phone}@c.us`, text, messageid);
        return res.status(200).json({
            status: "Success",
            id: response.id,
            phone: response.chat.id.user,
            content: response.content
        });
    } catch (e) {
        Logger.error(e);
        return res.status(400).json({status: "Success", message: "Erro ao responder mensagem"});
    }
}

export async function forwardMessages(req, res) {    
    const {phone, messageId} = req.body;

    try {
        let response = await req.client.forwardMessages(`${phone}@c.us`, [messageId], false);
        return res.status(200).json({
            status: "Success",
            id: response.to._serialized,
            session: req.session,
            phone: response.to.remote.user,
        });
    } catch (e) {
        Logger.error(e);
        return res.status(400).json({status: "Error", message: "Erro ao encaminhar mensagem"});
    }
}

export async function markUnseenMessage(req, res) {    
    const {phone, isGroup = false} = req.body;

    try {
        if (isGroup) {
            await req.client.markUnseenMessage(`${phone}@g.us`);
        } else {
            await req.client.markUnseenMessage(`${phone}@c.us`);
        }
        return res.status(200).json({status: "Success", message: "Mensagem marcada como não lida"});
    } catch (e) {
        Logger.error(e);
        return res.status(400).json({status: "Error", message: "Erro ao desmarcar visto da mensagem"});
    }
}

export async function blockContact(req, res) {    
    const {phone} = req.body;

    try {
        await req.client.blockContact(`${phone}@c.us`);
        return res.status(200).json({status: "Success", message: "Contato bloqueado com sucesso"});
    } catch (e) {
        Logger.error(e);
        return res.status(400).json({status: "Error", message: "Erro ao bloquear contato"});
    }
}

export async function unblockContact(req, res) {    
    const {phone} = req.body;

    try {
        await req.client.unblockContact(`${phone}@c.us`);
        return res.status(200).json({status: "Success", message: "Contato desbloqueado com sucesso"});
    } catch (e) {
        Logger.error(e);
        return res.status(400).json({status: "Error", message: "Erro ao desbloquear contato"});
    }
}

export async function pinChat(req, res) {    
    const {phone, state, isGroup = false} = req.body;

    try {
        if (isGroup) {
            await req.client.pinChat(`${phone}@g.us`, state === "true", false);
        } else {
            await req.client.pinChat(`${phone}@c.us`, state === "true", false);
        }

        return res.status(200).json({status: "Success", message: "Conversa fixada com sucesso"});
    } catch (e) {
        Logger.error(e);
        return res.status(400).json({status: "Success", message: "Erro ao fixar conversa"});
    }
}

export async function setProfilePic(req, res) {    
    const {phone, path, isGroup = false} = req.body;

    if (!path) {
        return res.status(400).json({status: "Error", message: "Informe o caminho da imagem"});
    }

    try {
        for (const contato of contactToArray(phone)) {
            if (isGroup) {
                await req.client.setProfilePic(path, `${contato}@g.us`);
            } else {
                await req.client.setProfilePic(path, `${contato}@c.us`);
            }
        }

        return res.status(200).json({status: "Success", message: "Foto de perfil alterada com sucesso"});
    } catch (e) {
        Logger.error(e);
        return res.status(400).json({status: "Success", message: "Erro ao alterar foto de perfil"});
    }
}
