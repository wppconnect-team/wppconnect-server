import api from "axios";
import Logger from "./logger"
import {config} from "./sessionUtil"
import path from "path";
import fs from "fs";

export function contactToArray(number, isGroup) {
    let localArr = [];
    if (Array.isArray(number)) {
        for (const contact of number) {
            if (contact !== "")
                if (isGroup)
                    localArr.push(`${contact}@g.us`);
                else
                    localArr.push(`${contact}@c.us`);
        }
    } else {
        let arrContacts = number.split(/\s*[,;]\s*/g);
        for (const contact of arrContacts) {
            if (contact !== "")
                if (isGroup)
                    localArr.push(`${contact}@g.us`);
                else
                    localArr.push(`${contact}@c.us`);
        }
    }

    return localArr;
}

export function groupToArray(group) {
    let localArr = [];
    if (Array.isArray(group)) {
        for (const contact of group) {
            if (contact !== "")
                localArr.push(`${contact}@g.us`);
        }
    } else {
        let arrContacts = group.split(/\s*[,;]\s*/g);
        for (const contact of arrContacts) {
            if (contact !== "")
                localArr.push(`${contact}@g.us`);
        }
    }

    return localArr;
}

export function groupNameToArray(group) {
    let localArr = [];
    if (Array.isArray(group)) {
        for (const contact of group) {
            if (contact !== "")
                localArr.push(`${contact}`);
        }
    } else {
        let arrContacts = group.split(/\s*[,;]\s*/g);
        for (const contact of arrContacts) {
            if (contact !== "")
                localArr.push(`${contact}`);
        }
    }

    return localArr;
}

export async function callWebHook(client, event, data) {
    if (client.webhook) {
        if (config.webhook.autoDownload)
            await autoDownload(client, data);
        try {
            api.post(client.webhook, Object.assign({event: event, session: client.session}, data))
                .then(() => {
                    if (event === "onmessage" && config.webhook.readMessage)
                        client.sendSeen(data.chatId || data.id.id || data.id._serialized);
                })
                .catch((e) => {
                    Logger.error(e);
                });
        } catch (e) {
            Logger.error(e);
        }
    }
}

async function autoDownload(client, message) {
    if (message && (message['mimetype'] || message.isMedia || message.isMMS)) {
        let buffer = await client.decryptFile(message);
        message.body = await buffer.toString('base64');
    }
}

export async function startAllSessions() {
    try {
        await api.post(`${config.host}:${config.port}/api/${config.secretKey}/start-all`)
    } catch (e) {
        Logger.error(e);
    }

}

export async function startHelper(client) {
    if (config.webhook.allUnreadOnStart)
        await sendUnread(client);

    if (config.archive.enable)
        await archive(client);
}

async function sendUnread(client) {
    Logger.info(`${client.session} : Inicio enviar mensagens não lidas`);

    try {
        const chats = await client.getUnreadMessages(false, false, true);

        for (let i = 0; i < chats.length; i++)
            for (let j = 0; j < chats[i].messages.length; j++) {
                callWebHook(client, 'unreadmessages', chats[i].messages[j]);
            }

        Logger.info(`${client.session} : Fim enviar mensagens não lidas`);
    } catch (ex) {
        Logger.error(ex);
    }

    const m = await client.getUnreadMessages(false, false, true);
}

async function archive(client) {
    async function sleep(time) {
        return new Promise((resolve) => setTimeout(resolve, time * 100));
    }

    Logger.info(`${client.session} : Inicio arquivando chats`);

    try {
        let chats = await client.getAllChats();

        for (let i = 0; i < chats.length; i++) {
            let date = new Date(chats[i].t * 1000);

            if (DaysBetween(date) > config.archive.daysToArchive) {
                await client.archiveChat(chats[i].id.id || chats[i].id._serialized, true);
                await sleep(Math.floor(Math.random() * config.archive.waitTime + 1));
            }
        }
        Logger.info(`${client.session} : Fim arquivando chats`);
    } catch (ex) {
        Logger.error(ex);
    }
}

function DaysBetween(StartDate) {
    let endDate = new Date();
    // The number of milliseconds in all UTC days (no DST)
    const oneDay = 1000 * 60 * 60 * 24;

    // A day in UTC always lasts 24 hours (unlike in other time formats)
    const start = Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    const end = Date.UTC(StartDate.getFullYear(), StartDate.getMonth(), StartDate.getDate());

    // so it's safe to divide by 24 hours
    return (start - end) / oneDay;
}

export function createFolders() {
    let dirFiles = path.resolve(__dirname, "..", "..", "WhatsAppImages");
    if (!fs.existsSync(dirFiles)) {
        fs.mkdirSync(dirFiles);
    }

    let dirUpload = path.resolve(__dirname, "..", "..", "uploads");
    if (!fs.existsSync(dirUpload)) {
        fs.mkdirSync(dirUpload);
    }
}