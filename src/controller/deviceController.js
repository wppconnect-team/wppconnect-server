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
import fs from 'fs';
import { download } from './sessionController';
import { contactToArray, unlinkAsync } from '../util/functions';
import mime from 'mime-types';
import { clientsArray } from '../util/sessionUtil';

export async function setProfileName(req, res) {
    const session = req.session;
    const { name } = req.body;

    if (!name) return res.status(401).send({ message: 'Parameter name is required!' });

    try {
        const result = await req.client.setProfileName(name);
        return res.status(200).json({ status: 'success', response: result });
    } catch (error) {
        req.logger.error(error);
        res.status(400).json({
            response: {
                message: 'Error on set profile name.',
                session: session,
                log: error,
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
        req.logger.error(error);
        res.status(401).json({
            response: 'Error fetching contacts',
            session: session,
        });
    }
}

export async function getAllGroups(req, res) {
    const session = req.session;

    try {
        const response = await req.client.getAllGroups();

        return res.status(200).json({ response: response });
    } catch (e) {
        req.logger.error(e);
        res.status(401).json({
            status: 'Error',
            message: 'Error fetching groups',
            session: session,
        });
    }
}

export async function getAllChats(req, res) {
    try {
        const response = await req.client.getAllChats();
        return res.status(200).json({ status: 'Success', response: response, mapper: 'chat' });
    } catch (e) {
        req.logger.error(e);
        return res.status(401).json({ status: 'Error', response: 'Error on get all chats' });
    }
}

export async function getAllChatsWithMessages(req, res) {
    try {
        const response = await req.client.getAllChatsWithMessages();
        return res.status(200).json({ status: 'success', response: response });
    } catch (e) {
        req.logger.error(e);
        return res.status(401).json({
            status: 'error',
            response: 'Error on get all chats whit messages',
        });
    }
}

export async function getAllMessagesInChat(req, res) {
    try {
        const { includeMe = true, includeNotifications = true } = req.query;

        let response;
        for (const contato of req.body.phone) {
            response = await req.client.getAllMessagesInChat(contato, includeMe, includeNotifications);
        }

        return res.status(200).json({ status: 'success', response: response });
    } catch (e) {
        req.logger.error(e);
        return res.status(401).json({ status: 'error', response: 'Error on get all messages in chat' });
    }
}

export async function getAllNewMessages(req, res) {
    try {
        const response = await req.client.getAllNewMessages();
        return res.status(200).json({ status: 'success', response: response });
    } catch (e) {
        req.logger.error(e);
        return res.status(401).json({ status: 'error', response: 'Error on get all messages in chat' });
    }
}

export async function getAllUnreadMessages(req, res) {
    try {
        const response = await req.client.getAllUnreadMessages();
        return res.status(200).json({ status: 'success', response: response });
    } catch (e) {
        req.logger.error(e);
        return res.status(401).json({ status: 'error', response: 'Error on get all messages in chat' });
    }
}

export async function getChatById(req, res) {
    const { phone } = req.params;
    const { isGroup } = req.query;

    try {
        let allMessages = {};

        if (isGroup) {
            allMessages = await req.client.getAllMessagesInChat(`${phone}@g.us`, true, true);
        } else {
            allMessages = await req.client.getAllMessagesInChat(`${phone}@c.us`, true, true);
        }

        let dir = './WhatsAppImages';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }

        allMessages.map((message) => {
            if (message.type === 'sticker') {
                download(message, req.client, req.logger);
                message.body = `${req.serverOptions.host}:${req.serverOptions.port}/files/file${
                    message.t
                }.${mime.extension(message.mimetype)}`;
            }
        });

        return res.json({ status: 'Success', response: allMessages });
    } catch (e) {
        req.logger.error(e);
        return res.json({ status: 'Error', response: [] });
    }
}

export async function changePrivacyGroup(req, res) {
    const { phone, status } = req.body;

    try {
        for (const contato of phone) {
            await req.client.setMessagesAdminsOnly(`${contato}@g.us`, status === 'true');
        }

        return res.status(200).json({
            status: 'Success',
            message: 'Group privacy changed successfully',
        });
    } catch (e) {
        req.logger.error(e);
        return res.status(400).json({ status: 'Error', message: 'Error changing group privacy' });
    }
}

export async function getBatteryLevel(req, res) {
    try {
        let response = await req.client.getBatteryLevel();
        return res.status(200).json({ status: 'Success', batterylevel: response });
    } catch (e) {
        req.logger.error(e);
        return res.status(400).json({ status: 'Error retrieving battery status' });
    }
}

export async function getHostDevice(req, res) {
    try {
        const response = await req.client.getHostDevice();
        return res.status(200).json({ status: 'success', response: response });
    } catch (e) {
        req.logger.error(e);
        return res.status(400).json({
            status: 'Error',
            message: 'Erro ao recuperar dados do telefone',
        });
    }
}

export async function getBlockList(req, res) {
    let response = await req.client.getBlockList();

    try {
        const blocked = response.map((contato) => {
            return { phone: contato ? contato.split('@')[0] : '' };
        });

        return res.status(200).json({ status: 'Success', response: blocked });
    } catch (e) {
        req.logger.error(e);
        return res.status(400).json({
            status: 'Error',
            message: 'Error retrieving blocked contact list',
        });
    }
}

export async function deleteChat(req, res) {
    const { phone, isGroup = false } = req.body;

    try {
        if (isGroup) {
            await req.client.deleteChat(`${phone}@g.us`);
        } else {
            await req.client.deleteChat(`${phone}@c.us`);
        }
        return res.status(200).json({ status: 'Success', message: 'Conversa deleteada com sucesso' });
    } catch (e) {
        req.logger.error(e);
        return res.status(400).json({ status: 'Error', message: 'Erro ao deletada conversa' });
    }
}

export async function clearChat(req, res) {
    const { phone, isGroup = false } = req.body;

    try {
        if (isGroup) {
            await req.client.clearChat(`${phone}@g.us`);
        } else {
            await req.client.clearChat(`${phone}@c.us`);
        }
        return res.status(200).json({
            status: 'Success',
            message: 'Successfully cleared conversation',
        });
    } catch (e) {
        req.logger.error(e);
        return res.status(400).json({ status: 'Error', message: 'Error clearing conversation' });
    }
}

export async function archiveChat(req, res) {
    const { phone, value = true, isGroup = false } = req.body;

    try {
        let response;
        if (isGroup) {
            response = await req.client.archiveChat(`${phone}@g.us`, value);
        } else {
            response = await req.client.archiveChat(`${phone}@c.us`, value);
        }
        return res.status(200).json({
            status: 'Success',
            message: 'Chat archived!',
            response: response,
        });
    } catch (e) {
        req.logger.error(e);
        return res.status(400).json({ status: 'Error', message: 'Error on archive chat' });
    }
}

export async function deleteMessage(req, res) {
    const { phone, messageId } = req.body;

    try {
        await req.client.deleteMessage(`${phone}@c.us`, [messageId]);
        return res.status(200).json({ status: 'Success', message: 'Message deleted' });
    } catch (e) {
        req.logger.error(e);
        return res.status(400).json({ status: 'Error', message: 'Error on delete message' });
    }
}

export async function reply(req, res) {
    const { phone, text, messageid } = req.body;

    try {
        let response = await req.client.reply(`${phone}@c.us`, text, messageid);
        return res.status(200).json({
            status: 'Success',
            id: response.id,
            phone: response.chat.id.user,
            content: response.content,
        });
    } catch (e) {
        req.logger.error(e);
        return res.status(400).json({ status: 'Success', message: 'Error replying message' });
    }
}

export async function forwardMessages(req, res) {
    const { phone, messageId } = req.body;

    try {
        let response = await req.client.forwardMessages(`${phone}@c.us`, [messageId], false);
        return res.status(200).json({
            status: 'Success',
            id: response.to._serialized,
            session: req.session,
            phone: response.to.remote.user,
        });
    } catch (e) {
        req.logger.error(e);
        return res.status(400).json({ status: 'Error', message: 'Error forwarding message' });
    }
}

export async function markUnseenMessage(req, res) {
    const { phone, isGroup = false } = req.body;

    try {
        if (isGroup) {
            await req.client.markUnseenMessage(`${phone}@g.us`);
        } else {
            await req.client.markUnseenMessage(`${phone}@c.us`);
        }
        return res.status(200).json({ status: 'Success', message: 'unseen checked' });
    } catch (e) {
        req.logger.error(e);
        return res.status(400).json({ status: 'Error', message: 'Error on mark unseen' });
    }
}

export async function blockContact(req, res) {
    const { phone } = req.body;

    try {
        await req.client.blockContact(`${phone}@c.us`);
        return res.status(200).json({ status: 'Success', message: 'Contact blocked' });
    } catch (e) {
        req.logger.error(e);
        return res.status(400).json({ status: 'Error', message: 'Error on block contact' });
    }
}

export async function unblockContact(req, res) {
    const { phone } = req.body;

    try {
        await req.client.unblockContact(`${phone}@c.us`);
        return res.status(200).json({ status: 'Success', message: 'Contact UnBlocked' });
    } catch (e) {
        req.logger.error(e);
        return res.status(400).json({ status: 'Error', message: 'Error on unlock contact' });
    }
}

export async function pinChat(req, res) {
    const { phone, state, isGroup = false } = req.body;

    try {
        if (isGroup) {
            await req.client.pinChat(`${phone}@g.us`, state === 'true', false);
        } else {
            await req.client.pinChat(`${phone}@c.us`, state === 'true', false);
        }

        return res.status(200).json({ status: 'Success', message: 'Chat fixed' });
    } catch (e) {
        req.logger.error(e);
        return res.status(400).json({ status: 'Error', message: 'Error on pin chat' });
    }
}

export async function setProfilePic(req, res) {
    if (!req.file) return res.status(400).json({ status: 'Error', message: 'File parameter is required!' });

    try {
        const { path: pathFile } = req.file;

        await req.client.setProfilePic(pathFile);
        await unlinkAsync(pathFile);

        return res.status(200).json({
            status: 'Success',
            message: 'Profile photo successfully changed',
        });
    } catch (e) {
        req.logger.error(e);
        return res.status(400).json({ status: 'Error', message: 'Error changing profile photo' });
    }
}

export async function setGroupProfilePic(req, res) {
    const { phone } = req.body;

    if (!req.file) return res.status(400).json({ status: 'Error', message: 'File parameter is required!' });

    try {
        const { path: pathFile } = req.file;

        for (const contato of phone) {
            await req.client.setProfilePic(pathFile, contato);
        }

        await unlinkAsync(pathFile);

        return res.status(200).json({
            status: 'Success',
            message: 'Group profile photo successfully changed',
        });
    } catch (e) {
        req.logger.error(e);
        return res.status(400).json({ status: 'Success', message: 'Error changing group photo' });
    }
}

export async function getUnreadMessages(req, res) {
    try {
        const response = await req.client.getUnreadMessages(false, false, true);
        return res.status(200).json({ status: 'success', response: response });
    } catch (e) {
        req.logger.error(e);
        return res.status(401).json({ status: 'error', response: 'Error on open list' });
    }
}

export async function getChatIsOnline(req, res) {
    const { phone } = req.params;
    try {
        const response = await req.client.getChatIsOnline(`${phone}@c.us`);
        return res.status(200).json({ status: 'success', response: response });
    } catch (e) {
        req.logger.error(e);
        return res.status(401).json({ status: 'error', response: 'Error on get chat is online' });
    }
}

export async function getLastSeen(req, res) {
    const { phone } = req.params;
    try {
        const response = await req.client.getLastSeen(`${phone}@c.us`);
        return res.status(200).json({ status: 'success', response: response });
    } catch (e) {
        req.logger.error(e);
        return res.status(401).json({ status: 'error', response: 'Error on get chat last seen' });
    }
}

export async function getListMutes(req, res) {
    const { type = 'all' } = req.params;
    try {
        const response = await req.client.getListMutes(type);
        return res.status(200).json({ status: 'success', response: response });
    } catch (e) {
        req.logger.error(e);
        return res.status(401).json({ status: 'error', response: 'Error on get list mutes' });
    }
}

export async function loadAndGetAllMessagesInChat(req, res) {
    const { phone, includeMe = true, includeNotifications = false } = req.params;

    try {
        const response = await req.client.loadAndGetAllMessagesInChat(`${phone}@c.us`, includeMe, includeNotifications);
        return res.status(200).json({ status: 'success', response: response });
    } catch (e) {
        req.logger.error(e);
        return res.status(401).json({ status: 'error', response: 'Error on open list' });
    }
}

export async function sendContactVcard(req, res) {
    const { phone, contactsId } = req.body;

    try {
        let response;
        for (const contato of phone) {
            response = await req.client.sendContactVcard(`${contato}`, contactsId);
        }

        return res.status(200).json({ status: 'success', response: response });
    } catch (e) {
        req.logger.error(e);
        return res.status(400).json({ status: 'error', message: 'Error on send contact vcard' });
    }
}

export async function sendMentioned(req, res) {
    const { phone, message, mentioned } = req.body;

    try {
        let response;
        for (const contato of phone) {
            response = await req.client.sendMentioned(`${contato}`, message, mentioned);
        }

        return res.status(200).json({ status: 'success', response: response });
    } catch (error) {
        return res.status(400).json({ status: 'error', message: 'Error on send message mentioned' });
    }
}

export async function sendMute(req, res) {
    const { phone, time, type = 'hours' } = req.body;

    try {
        let response;
        for (const contato of phone) {
            response = await req.client.sendMute(`${contato}`, time, type);
        }

        return res.status(200).json({ status: 'success', response: response });
    } catch (error) {
        return res.status(400).json({ status: 'error', message: 'Error on send mute' });
    }
}

export async function sendSeen(req, res) {
    const { phone } = req.body;

    try {
        let response;
        for (const contato of phone) {
            response = await req.client.sendSeen(`${contato}`);
        }

        return res.status(200).json({ status: 'success', response: response });
    } catch (error) {
        return res.status(400).json({ status: 'error', message: 'Error on send seen' });
    }
}

export async function setChatState(req, res) {
    const { phone, chatstate } = req.body;

    try {
        let response;
        for (const contato of phone) {
            response = await req.client.setChatState(`${contato}`, chatstate);
        }

        return res.status(200).json({ status: 'success', response: response });
    } catch (error) {
        return res.status(400).json({ status: 'error', message: 'Error on send chat state' });
    }
}

export async function setTemporaryMessages(req, res) {
    const { phone, value = true } = req.body;

    try {
        let response;
        for (const contato of phone) {
            response = await req.client.setTemporaryMessages(`${contato}`, value);
        }

        return res.status(200).json({ status: 'success', response: response });
    } catch (error) {
        return res.status(400).json({ status: 'error', message: 'Error on set temporary messages' });
    }
}

export async function setTyping(req, res) {
    const { phone, value = true } = req.body;
    try {
        let response;

        for (const contato of phone) {
            if (value) response = await req.client.startTyping(contato);
            else response = await req.client.stopTyping(contato);
        }

        return res.status(200).json({ status: 'success', response: response });
    } catch (error) {
        return res.status(400).json({ status: 'error', message: 'Error on set typing' });
    }
}

export async function checkNumberStatus(req, res) {
    const { phone } = req.body;
    try {
        let response;

        for (const contato of phone) {
            response = await req.client.checkNumberStatus(`${contato}`);
        }

        return res.status(200).json({ status: 'success', response: response });
    } catch (error) {
        return res.status(400).json({ status: 'error', message: 'Error on check number status' });
    }
}

export async function getContact(req, res) {
    const { phone } = req.body;
    try {
        let response;
        for (const contato of phone) {
            response = await req.client.getContact(contato);
        }

        return res.status(200).json({ status: 'success', response: response });
    } catch (error) {
        return res.status(400).json({ status: 'error', message: 'Error on get contact' });
    }
}

export async function getAllContacts(req, res) {
    try {
        const response = await req.client.getAllContacts();
        return res.status(200).json({ status: 'success', response: response });
    } catch (error) {
        return res.status(400).json({ status: 'error', message: 'Error on get all constacts' });
    }
}

export async function getNumberProfile(req, res) {
    const { phone } = req.body;
    try {
        let response;
        for (const contato of phone) {
            response = await req.client.getNumberProfile(contato);
        }
        return res.status(200).json({ status: 'success', response: response });
    } catch (error) {
        return res.status(400).json({ status: 'error', message: 'Error on get number profile' });
    }
}

export async function getProfilePicFromServer(req, res) {
    const { phone } = req.body;
    try {
        let response;
        for (const contato of phone) {
            response = await req.client.getProfilePicFromServer(contato);
        }

        return res.status(200).json({ status: 'success', response: response });
    } catch (error) {
        return res.status(400).json({ status: 'error', message: 'Error on  get profile pic' });
    }
}

export async function getStatus(req, res) {
    const { phone } = req.body;
    try {
        let response;
        for (const contato of phone) {
            response = await req.client.getStatus(contato);
        }
        return res.status(200).json({ status: 'success', response: response });
    } catch (error) {
        return res.status(400).json({ status: 'error', message: 'Error on  get status' });
    }
}

export async function setProfileStatus(req, res) {
    const { status } = req.body;

    try {
        return res.status(200).json({
            status: 'Success',
            response: await req.client.setProfileStatus(status),
        });
    } catch (e) {
        req.logger.error(e);
        return res.status(400).json({ status: 'Success', message: 'Error on set profile status' });
    }
}

export async function starMessage(req, res) {
    const { messageId, star = true } = req.body;
    try {
        let response = await req.client.starMessage(messageId, star);

        return res.status(200).json({ status: 'success', response: response });
    } catch (error) {
        return res.status(400).json({ status: 'error', message: 'Error on  start message' });
    }
}

export async function chatWoot(req, res) {
    const { session } = req.params;
    const client = clientsArray[session];
    try {
        if (await client.isConnected()) {
            const {
                event,
                message_type,
                phone = req.body.conversation.meta.sender.phone_number,
                message = req.body.conversation.messages[0],
            } = req.body;

            if (event != 'message_created' && message_type != 'outgoing') return res.status(200);

            for (const contato of contactToArray(phone, false)) {
                if (message.attachments)
                    await client.sendFile(`${contato}`, message.attachments[0].data_url, 'file', message.content);
                else await client.sendText(contato, message.content);
            }
            return res.status(200).json({ status: 'success', message: 'Success on  receive chatwoot' });
        }
    } catch (e) {
        return res.status(400).json({ status: 'error', message: 'Error on  receive chatwoot' });
    }
}

export async function rocketChat(req, res) {
    const session = req.body.visitor.phone;
    const client = clientsArray[session[0].phoneNumber.split('--')[1]];
    try {
        if (await client.isConnected()) {
            const { type, phone = req.body.visitor.username, message = req.body.messages[0].msg } = req.body;

            const contato = contactToArray(phone, false);

            if (type === 'Message') {
                if (req.body.messages[0].fileUpload) {
                    await client.sendFile(
                        `${contato}`,
                        req.body.messages[0].fileUpload.publicFilePath,
                        req.body.messages[0].file.name,
                        message
                    );
                } else {
                    await client.sendText(contato, message);
                }
            } else if (type === 'LivechatSession') {
                await client.sendText(contato, 'Atendimento Finalizado');
            } else if (type === 'LivechatSessionTaken') {
                await client.sendText(contato, `Você está está sendo antedido(a) por ${req.body.agent.name}`);
            }

            return res.status(200).json({ status: 'success', message: 'Success on  receive rocketChat' });
        }
    } catch (e) {
        return res.status(400).json({ status: 'error', message: 'Error on  receive chatwoot' });
    }
}
