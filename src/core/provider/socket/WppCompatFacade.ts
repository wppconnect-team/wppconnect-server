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

import { MethodNotSupportedError } from '../capabilities';
import { createJid } from './jid';

/**
 * Adapts a Baileys socket to the wppconnect client method surface the
 * controllers call (`getClient(req).sendText`, `.getAllGroups`, etc.). This is
 * the single translation point that makes every controller work with the socket
 * providers (baileys, whaileys, zapo) WITHOUT migrating ~150 call sites.
 *
 * Implemented methods map to the Baileys API; methods with no Baileys
 * equivalent throw {@link NotSupportedError} (HTTP 501) so the client gets a
 * clear "not supported by this provider" instead of a crash.
 *
 * Returned shapes loosely mirror wppconnect where it is cheap to do so; exotic
 * fields are omitted. A `raw` field carries the original Baileys payload.
 */
export class WppCompatFacade {
  // session metadata kept in sync by the adapter
  public status = 'CONNECTED';
  public session: string;
  public urlcode?: string;

  constructor(private readonly sock: any, session: string) {
    this.session = session;
  }

  private s() {
    if (!this.sock) {
      throw new MethodNotSupportedError('socket', 'session-not-started');
    }
    return this.sock;
  }

  /* ----------------------------- session ------------------------------ */
  async isConnected() {
    return Boolean(this.sock?.user);
  }
  async getWid() {
    return this.sock?.user?.id?.split(':')[0]?.split('@')[0] ?? null;
  }
  async getHostDevice() {
    return this.sock?.user ?? null;
  }
  async getBatteryLevel() {
    return null; // not exposed by Baileys multidevice
  }
  async close() {
    try {
      this.sock?.end?.(undefined);
    } catch {
      /* ignore */
    }
    return true;
  }
  async logout() {
    await this.sock?.logout?.();
    return true;
  }

  /* ----------------------------- messaging ---------------------------- */
  async sendText(to: string, content: string) {
    const r = await this.s().sendMessage(createJid(to), { text: content });
    return this.msgResult(r);
  }
  async sendFile(to: string, opts: any) {
    const r = await this.s().sendMessage(createJid(to), {
      document: opts?.buffer ?? opts?.path ?? opts,
      fileName: opts?.filename ?? opts?.fileName,
      mimetype: opts?.mimetype ?? 'application/octet-stream',
      caption: opts?.caption,
    });
    return this.msgResult(r);
  }
  async sendImage(to: string, path: any, _name?: string, caption?: string) {
    const r = await this.s().sendMessage(createJid(to), {
      image: this.toBuffer(path),
      caption: caption ?? path?.caption,
    });
    return this.msgResult(r);
  }
  async sendVideoAsGif(to: string, path: any, _n?: string, caption?: string) {
    const r = await this.s().sendMessage(createJid(to), {
      video: this.toBuffer(path),
      caption,
      gifPlayback: true,
    });
    return this.msgResult(r);
  }
  async sendPtt(to: string, path: any) {
    const r = await this.s().sendMessage(createJid(to), {
      audio: this.toBuffer(path),
      ptt: true,
      mimetype: 'audio/ogg; codecs=opus',
    });
    return this.msgResult(r);
  }
  async sendLocation(to: string, opts: any) {
    const r = await this.s().sendMessage(createJid(to), {
      location: {
        degreesLatitude: Number(opts?.lat ?? opts?.latitude),
        degreesLongitude: Number(opts?.lng ?? opts?.longitude),
        name: opts?.name ?? opts?.title,
        address: opts?.address,
      },
    });
    return this.msgResult(r);
  }
  async reply(to: string, content: string, quotedMsgId: any) {
    const r = await this.s().sendMessage(
      createJid(to),
      { text: content },
      { quoted: this.quotedStub(quotedMsgId) }
    );
    return this.msgResult(r);
  }
  async sendReactionToMessage(msgId: any, emoji: string) {
    const key = this.keyFrom(msgId);
    const r = await this.s().sendMessage(key.remoteJid, {
      react: { text: emoji, key },
    });
    return this.msgResult(r);
  }
  async deleteMessage(to: string, msgId: any) {
    const key = this.keyFrom(msgId, createJid(to));
    await this.s().sendMessage(createJid(to), { delete: key });
    return true;
  }
  async forwardMessagesV2(to: string, messages: any) {
    const list = Array.isArray(messages) ? messages : [messages];
    const out: any[] = [];
    for (const m of list) {
      out.push(await this.s().sendMessage(createJid(to), { forward: m }));
    }
    return out.map((r) => this.msgResult(r));
  }
  async sendContactVcard(to: string, contactId: string, name?: string) {
    const number = String(contactId).split('@')[0];
    const vcard =
      'BEGIN:VCARD\nVERSION:3.0\n' +
      `FN:${name ?? number}\n` +
      `TEL;type=CELL;waid=${number}:+${number}\n` +
      'END:VCARD';
    const r = await this.s().sendMessage(createJid(to), {
      contacts: { displayName: name ?? number, contacts: [{ vcard }] },
    });
    return this.msgResult(r);
  }
  async sendSeen(chatId: string) {
    await this.s().readMessages([{ remoteJid: createJid(chatId), id: '' }]);
    return true;
  }

  /* ----------------------------- contacts ----------------------------- */
  async checkNumberStatus(number: string) {
    const jid = createJid(number);
    const [res] = (await this.s().onWhatsApp(jid)) ?? [];
    return {
      id: { _serialized: res?.jid ?? jid, user: String(number).split('@')[0] },
      numberExists: Boolean(res?.exists),
      status: res?.exists ? 200 : 404,
    };
  }
  async getNumberProfile(number: string) {
    return this.checkNumberStatus(number);
  }
  async getContact(id: string) {
    return { id: { _serialized: createJid(id) }, raw: null };
  }
  async getAllContacts() {
    const store = this.sock?.store?.contacts ?? {};
    return Object.values(store);
  }
  async getProfilePicFromServer(id: string) {
    try {
      const url = await this.s().profilePictureUrl(createJid(id), 'image');
      return { eurl: url, imgFull: url };
    } catch {
      return null;
    }
  }
  async getStatus(id: string) {
    try {
      return await this.s().fetchStatus(createJid(id));
    } catch {
      return null;
    }
  }
  async blockContact(id: string) {
    await this.s().updateBlockStatus(createJid(id), 'block');
    return true;
  }
  async unblockContact(id: string) {
    await this.s().updateBlockStatus(createJid(id), 'unblock');
    return true;
  }

  /* ------------------------------ chats ------------------------------- */
  async getAllChats() {
    return Object.values(this.sock?.store?.chats ?? {});
  }
  async listChats() {
    return Object.values(this.sock?.store?.chats ?? {});
  }
  async getChatById(id: string) {
    const jid = createJid(id);
    return { id: { _serialized: jid }, raw: null };
  }
  async archiveChat(chatId: string, value = true) {
    await this.s().chatModify(
      { archive: value, lastMessages: [] },
      createJid(chatId)
    );
    return true;
  }
  async setChatState() {
    return true;
  }
  async startTyping(to: string) {
    await this.s().sendPresenceUpdate('composing', createJid(to));
    return true;
  }
  async stopTyping(to: string) {
    await this.s().sendPresenceUpdate('paused', createJid(to));
    return true;
  }
  async startRecording(to: string) {
    await this.s().sendPresenceUpdate('recording', createJid(to));
    return true;
  }
  async stopRecording(to: string) {
    await this.s().sendPresenceUpdate('paused', createJid(to));
    return true;
  }
  async setOnlinePresence(value = true) {
    await this.s().sendPresenceUpdate(value ? 'available' : 'unavailable');
    return true;
  }
  async subscribePresence(id: string) {
    await this.s().presenceSubscribe(createJid(id));
    return true;
  }

  /* ------------------------------ groups ------------------------------ */
  async getAllGroups() {
    const groups = await this.s().groupFetchAllParticipating();
    return Object.values(groups ?? {}).map((g: any) => ({
      id: { _serialized: g.id },
      name: g.subject,
      groupMetadata: g,
    }));
  }
  async createGroup(name: string, participants: string[]) {
    const list = (
      Array.isArray(participants) ? participants : [participants]
    ).map((p) => createJid(p));
    return this.s().groupCreate(name, list);
  }
  async leaveGroup(groupId: string) {
    await this.s().groupLeave(createJid(groupId));
    return true;
  }
  async getGroupMembers(groupId: string) {
    const meta = await this.s().groupMetadata(createJid(groupId));
    return meta?.participants ?? [];
  }
  async getGroupMembersIds(groupId: string) {
    const meta = await this.s().groupMetadata(createJid(groupId));
    return (meta?.participants ?? []).map((p: any) => ({
      _serialized: p.id,
    }));
  }
  async getGroupAdmins(groupId: string) {
    const meta = await this.s().groupMetadata(createJid(groupId));
    return (meta?.participants ?? [])
      .filter((p: any) => p.admin)
      .map((p: any) => ({ _serialized: p.id }));
  }
  async addParticipant(groupId: string, participants: any) {
    return this.groupUpdate(groupId, participants, 'add');
  }
  async removeParticipant(groupId: string, participants: any) {
    return this.groupUpdate(groupId, participants, 'remove');
  }
  async promoteParticipant(groupId: string, participants: any) {
    return this.groupUpdate(groupId, participants, 'promote');
  }
  async demoteParticipant(groupId: string, participants: any) {
    return this.groupUpdate(groupId, participants, 'demote');
  }
  async getGroupInviteLink(groupId: string) {
    const code = await this.s().groupInviteCode(createJid(groupId));
    return `https://chat.whatsapp.com/${code}`;
  }
  async revokeGroupInviteLink(groupId: string) {
    return this.s().groupRevokeInvite(createJid(groupId));
  }
  async setGroupSubject(groupId: string, subject: string) {
    await this.s().groupUpdateSubject(createJid(groupId), subject);
    return true;
  }
  async setGroupDescription(groupId: string, description: string) {
    await this.s().groupUpdateDescription(createJid(groupId), description);
    return true;
  }
  async joinGroup(inviteCode: string) {
    const code = String(inviteCode).split('/').pop() ?? inviteCode;
    return this.s().groupAcceptInvite(code);
  }

  /* --------------------------- helpers -------------------------------- */
  private async groupUpdate(
    groupId: string,
    participants: any,
    action: string
  ) {
    const list = (
      Array.isArray(participants) ? participants : [participants]
    ).map((p) => createJid(p));
    return this.s().groupParticipantsUpdate(createJid(groupId), list, action);
  }
  private toBuffer(input: any) {
    if (Buffer.isBuffer(input)) return input;
    if (input?.buffer) return input.buffer;
    if (typeof input === 'string' && input.startsWith('data:')) {
      return Buffer.from(input.split(',')[1], 'base64');
    }
    if (typeof input === 'string') {
      // could be a URL or base64; pass through to Baileys (accepts {url})
      return /^https?:\/\//.test(input)
        ? { url: input }
        : Buffer.from(input, 'base64');
    }
    return input;
  }
  private keyFrom(msgId: any, remoteJid?: string) {
    if (msgId && typeof msgId === 'object' && msgId.id) return msgId;
    return {
      remoteJid: remoteJid ?? '',
      id: String(msgId),
      fromMe: true,
    };
  }
  private quotedStub(msgId: any) {
    if (msgId && typeof msgId === 'object') return msgId;
    return { key: { id: String(msgId) }, message: {} };
  }
  private msgResult(r: any) {
    return {
      id: r?.key?.id ?? null,
      to: r?.key?.remoteJid ?? null,
      from: this.sock?.user?.id ?? null,
      ack: r?.status ?? 1,
      raw: r,
    };
  }
}

/**
 * Wraps a socket in the facade, returning a Proxy so any wppconnect method we
 * did NOT implement throws a clear NotSupportedError (501) instead of
 * "is not a function".
 */
export function createWppCompat(sock: any, session: string): any {
  const facade = new WppCompatFacade(sock, session);
  return new Proxy(facade, {
    get(target: any, prop: string) {
      if (prop in target) return target[prop];
      if (typeof prop === 'string' && !prop.startsWith('then')) {
        return () => {
          throw new MethodNotSupportedError('socket', prop);
        };
      }
      return undefined;
    },
  });
}
