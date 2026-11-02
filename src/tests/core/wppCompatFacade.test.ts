import { MethodNotSupportedError } from '../../core/provider/capabilities';
import { createWppCompat } from '../../core/provider/socket/WppCompatFacade';

describe('WppCompatFacade', function () {
  it('preserves document content and options for Baileys-family providers', async function () {
    const sendMessage = jest.fn().mockResolvedValue({
      key: { id: 'message-id', remoteJid: '5511999999999@s.whatsapp.net' },
    });
    const facade = createWppCompat(
      { sendMessage, user: { id: 'sender' } },
      'session',
      'baileys'
    );
    const document = Buffer.from('document');

    await facade.sendFile('5511999999999@c.us', document, {
      filename: 'document.txt',
      mimetype: 'text/plain',
      caption: 'caption',
    });

    expect(sendMessage).toHaveBeenCalledWith('5511999999999@s.whatsapp.net', {
      document,
      fileName: 'document.txt',
      mimetype: 'text/plain',
      caption: 'caption',
    });
  });

  it('reports the concrete provider for untranslated methods', function () {
    const facade = createWppCompat({}, 'session', 'whaileys');

    try {
      facade.getBlockList();
      fail('expected MethodNotSupportedError');
    } catch (error) {
      expect(error).toBeInstanceOf(MethodNotSupportedError);
      expect(error).toMatchObject({
        providerId: 'whaileys',
        method: 'getBlockList',
        httpStatus: 501,
      });
    }
  });

  it('uses the current Zapo coordinator API and normalizes group results', async function () {
    const send = jest.fn().mockResolvedValue({ id: 'reply-id' });
    const createGroup = jest.fn().mockResolvedValue({
      jid: '120363000000000000@g.us',
      participants: [],
    });
    const facade = createWppCompat(
      {
        message: { send },
        group: { createGroup },
        getState: () => ({ connected: true }),
        getCredentials: () => ({
          meJid: '5511888888888:1@s.whatsapp.net',
        }),
      },
      'session',
      'zapo'
    );

    expect(await facade.isConnected()).toBe(true);
    expect(await facade.getWid()).toBe('5511888888888');
    await expect(
      facade.createGroup('group', ['5511999999999@c.us'])
    ).resolves.toMatchObject({
      gid: {
        _serialized: '120363000000000000@g.us',
        user: '120363000000000000',
      },
    });
    expect(createGroup).toHaveBeenCalledWith('group', [
      '5511999999999@s.whatsapp.net',
    ]);

    await facade.reply('5511999999999@c.us', 'reply', 'quoted-message-id');
    expect(send).toHaveBeenCalledWith('5511999999999@s.whatsapp.net', {
      type: 'text',
      text: 'reply',
      contextInfo: {
        quotedMessageId: 'quoted-message-id',
        quotedRemoteJid: '5511999999999@s.whatsapp.net',
      },
    });

    const pngDataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB';
    await facade.sendImage(
      '5511999999999@c.us',
      pngDataUri,
      'runtime-smoke.png',
      'image test'
    );
    expect(send).toHaveBeenLastCalledWith('5511999999999@s.whatsapp.net', {
      type: 'image',
      media: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB', 'base64'),
      mimetype: 'image/png',
      caption: 'image test',
    });
  });
});
