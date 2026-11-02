import { EventEmitter } from 'events';
import fs from 'fs';

import { BaileysAdapter } from '../../core/provider/baileys/BaileysAdapter';
import {
  normalizeAck,
  normalizeMessage,
} from '../../core/provider/socket/normalizeMessage';

function library() {
  const sockets: any[] = [];
  const makeWASocket = jest.fn(() => {
    const socket = {
      ev: new EventEmitter(),
      user: { id: 'me@s.whatsapp.net' },
      end: jest.fn(),
      ws: { close: jest.fn() },
    };
    sockets.push(socket);
    return socket;
  });
  return {
    sockets,
    default: makeWASocket,
    useMultiFileAuthState: jest.fn().mockResolvedValue({
      state: { creds: {}, keys: {} },
      saveCreds: jest.fn(),
    }),
  };
}

describe('socket provider event ownership', () => {
  afterEach(() => jest.restoreAllMocks());

  it('does not create a socket when close wins a pending runtime import', async () => {
    const adapter = new BaileysAdapter('cancel-import');
    const lib = library();
    let resolve!: (value: any) => void;
    jest.spyOn(adapter as any, 'loadLib').mockReturnValue(
      new Promise((done) => {
        resolve = done;
      })
    );
    const starting = adapter.session.start();
    await adapter.session.close();
    resolve(lib);
    await starting;
    expect(lib.default).not.toHaveBeenCalled();
    expect(await adapter.health()).toEqual({
      connected: false,
      state: 'CLOSED',
    });
  });

  it('normalizes fresh messages once, skips history replay and rejects old socket callbacks', async () => {
    const adapter = new BaileysAdapter('events');
    const lib = library();
    jest.spyOn(fs, 'mkdirSync').mockReturnValue(undefined);
    jest.spyOn(adapter as any, 'loadLib').mockResolvedValue(lib);
    const received = jest.fn();
    const anyMessage = jest.fn();
    const ack = jest.fn();
    adapter.on('message', received);
    adapter.on('any-message', anyMessage);
    adapter.on('ack', ack);
    await adapter.session.start();
    const event = {
      key: { id: 'm1', remoteJid: 'other@s.whatsapp.net', fromMe: false },
      message: { conversation: 'hello' },
      messageTimestamp: 123,
    };
    lib.sockets[0].ev.emit('messages.upsert', {
      type: 'notify',
      messages: [event],
    });
    expect(received).toHaveBeenCalledTimes(1);
    expect(anyMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        body: 'hello',
        id: 'm1',
        from: 'other@s.whatsapp.net',
        type: 'chat',
        t: 123,
        session: 'events',
      })
    );
    lib.sockets[0].ev.emit('messages.upsert', {
      type: 'append',
      messages: [event],
    });
    expect(received).toHaveBeenCalledTimes(1);
    lib.sockets[0].ev.emit('messages.update', [
      { key: event.key, update: { status: 3 } },
      { key: event.key, update: { message: null } },
    ]);
    expect(ack).toHaveBeenCalledTimes(1);
    expect(ack).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'm1', ack: 2 })
    );
    await adapter.session.close();
    lib.sockets[0].ev.emit('messages.upsert', {
      type: 'notify',
      messages: [event],
    });
    lib.sockets[0].ev.emit('connection.update', { connection: 'close' });
    await Promise.resolve();
    expect(received).toHaveBeenCalledTimes(1);
    expect(lib.default).toHaveBeenCalledTimes(1);
  });
});

describe('normalized provider payloads', () => {
  it('unwraps ephemeral group media and preserves sender identity', () => {
    expect(
      normalizeMessage(
        {
          key: {
            id: 'image',
            remoteJid: 'group@g.us',
            participant: 'sender@s.whatsapp.net',
          },
          message: {
            ephemeralMessage: {
              message: {
                imageMessage: { caption: 'photo', mimetype: 'image/jpeg' },
              },
            },
          },
        },
        'group-session'
      )
    ).toEqual(
      expect.objectContaining({
        body: 'photo',
        type: 'image',
        isGroupMsg: true,
        isMedia: true,
        sender: { id: 'sender@s.whatsapp.net', pushname: undefined },
      })
    );
  });

  it('preserves already normalized fields and extracts receipt status', () => {
    expect(
      normalizeMessage(
        {
          id: 'existing',
          body: 'text',
          type: 'chat',
          from: 'sender',
          fromMe: true,
        },
        's'
      )
    ).toEqual(
      expect.objectContaining({
        id: 'existing',
        body: 'text',
        type: 'chat',
        from: 'sender',
        fromMe: true,
      })
    );
    expect(
      normalizeAck(
        { key: { id: 'm', remoteJid: 'chat' }, update: { status: 4 } },
        's'
      )
    ).toEqual(
      expect.objectContaining({ id: 'm', chatId: 'chat', ack: 3, session: 's' })
    );
  });
});
