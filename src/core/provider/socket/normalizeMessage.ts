/** The stable message fields shared by webhooks, Socket.IO and the manager. */
export function normalizeMessage(message: any, session: string): any {
  const key = message.key ?? {};
  let content = message.message ?? {};
  // The transport can wrap the actual content for disappearing/view-once chats.
  for (let depth = 0; depth < 5; depth++) {
    const wrapped =
      content.ephemeralMessage?.message ??
      content.viewOnceMessage?.message ??
      content.viewOnceMessageV2?.message;
    if (!wrapped) break;
    content = wrapped;
  }
  const kinds: Record<string, string> = {
    conversation: 'chat',
    extendedTextMessage: 'chat',
    imageMessage: 'image',
    videoMessage: 'video',
    audioMessage: 'audio',
    documentMessage: 'document',
    stickerMessage: 'sticker',
    locationMessage: 'location',
    contactMessage: 'vcard',
    contactsArrayMessage: 'multi_vcard',
  };
  const kind = Object.keys(kinds).find((name) => content[name] != null);
  const payload = kind ? content[kind] : {};
  const chat = key.remoteJid ?? message.chatId ?? message.from ?? '';
  const fromMe = key.fromMe ?? message.fromMe ?? false;
  const type = message.type ?? (kind ? kinds[kind] : 'unknown');
  return {
    ...message,
    id: key.id ?? message.id,
    session,
    from: message.from ?? chat,
    chatId: chat,
    fromMe,
    isGroupMsg: String(chat).endsWith('@g.us'),
    type: type === 'audio' && payload?.ptt ? 'ptt' : type,
    body:
      message.body ??
      content.conversation ??
      payload?.text ??
      payload?.caption ??
      '',
    t: Number(
      message.messageTimestamp ??
        message.timestampSeconds ??
        message.timestamp ??
        message.t ??
        0
    ),
    ...(payload?.mimetype ? { mimetype: payload.mimetype, isMedia: true } : {}),
    sender: message.sender ?? {
      id: key.participant ?? chat,
      pushname: message.pushName,
    },
  };
}

export function normalizeAck(update: any, session: string): any {
  const status = update.update?.status ?? update.status;
  const zapoStatus: Record<string, number> = {
    delivered: 2,
    read: 3,
    played: 4,
    inactive: 1,
  };
  return {
    ...update,
    id: update.key?.id ?? update.id,
    chatId: update.key?.remoteJid ?? update.chatJid ?? update.chatId,
    // Baileys' protobuf statuses start at PENDING=1; WPPConnect's public
    // enum starts at CLOCK=0. Zapo receipts name the delivery state instead.
    ack:
      update.ack ??
      (typeof status === 'number' ? status - 1 : zapoStatus[status]),
    session,
  };
}
