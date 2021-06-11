/*
 * Copyright 2021 WPPConnect Team
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import api from "axios";
import {config} from "./sessionUtil"
import path from "path";
import fs from "fs";
import {promisify} from "util";

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
        for (let contact of arrContacts) {
            contact = number.split('@')[0];
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

export async function callWebHook(client, req, event, data) {
    if (client && client.webhook) {
        if (req.serverOptions.webhook.autoDownload)
            await autoDownload(client, data);
        try {
            api.post(client.webhook, Object.assign({event: event, session: client.session}, data))
                .then(() => {
                    const events = ["unreadmessages", "onmessage"];
                    if (events.includes(event) && req.serverOptions.webhook.readMessage)
                        client.sendSeen(data.chatId._serialized || data.from || data.chatId);
                })
                .catch((e) => {
                    req.logger.error(e);
                });
        } catch (e) {
            req.logger.error(e);
        }
    }
}

async function autoDownload(client, message) {
    if (message && (message['mimetype'] || message.isMedia || message.isMMS)) {
        let buffer = await client.decryptFile(message);
        message.body = await buffer.toString('base64');
    }
}

export async function startAllSessions(config, logger) {
    try {
        await api.post(`${config.host}:${config.port}/api/${config.secretKey}/start-all`)
    } catch (e) {
        logger.error(e);
    }

}

export async function startHelper(client, req) {
    if (req.serverOptions.webhook.allUnreadOnStart)
        await sendUnread(client, req);

    if (req.serverOptions.archive.enable)
        await archive(client, req);
}

async function sendUnread(client, req) {
    req.logger.info(`${client.session} : Inicio enviar mensagens não lidas`);

    try {
        const chats = await client.getAllChatsWithMessages(true);

        if (chats && chats.length > 0) {
        for (let i = 0; i < chats.length; i++)
            for (let j = 0; j < chats[i].msgs.length; j++) {
                callWebHook(client, req, 'unreadmessages', chats[i].msgs[j]);
            }
        }

        req.logger.info(`${client.session} : Fim enviar mensagens não lidas`);
    } catch (ex) {
        req.logger.error(ex);
    }

}

async function archive(client, req) {
    async function sleep(time) {
        return new Promise((resolve) => setTimeout(resolve, time * 10));
    }

    req.logger.info(`${client.session} : Inicio arquivando chats`);

    try {
        let chats = await client.getAllChats();
        if (chats && chats.length > 0) {
            for (let i = 0; i < chats.length; i++) {
                let date = new Date(chats[i].t * 1000);

                if (DaysBetween(date) > req.serverOptions.archive.daysToArchive) {
                    await client.archiveChat(chats[i].id.id || chats[i].id._serialized, true);
                    await sleep(Math.floor(Math.random() * req.serverOptions.archive.waitTime + 1));
                }
            }
        }
        req.logger.info(`${client.session} : Fim arquivando chats`);
    } catch (ex) {
        req.logger.error(ex);
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
    const __dirname = path.resolve(path.dirname(''));
    let dirFiles = path.resolve(__dirname, "..", "..", "WhatsAppImages");
    if (!fs.existsSync(dirFiles)) {
        fs.mkdirSync(dirFiles);
    }

    let dirUpload = path.resolve(__dirname, "..", "..", "uploads");
    if (!fs.existsSync(dirUpload)) {
        fs.mkdirSync(dirUpload);
    }
}

export function strToBool(s) {
    return (/^(true|1)$/i).test(s);
}

export let unlinkAsync = promisify(fs.unlink);
