import { chatWoot } from '../../controller/deviceController';
import { clientsArray } from '../../util/sessionUtil';

jest.mock('../../util/functions', () => ({
  contactToArray: jest.requireActual('../../util/contactToArray')
    .contactToArray,
  unlinkAsync: jest.fn(),
  callWebHook: jest.fn(),
}));
jest.mock('../../util/sessionUtil', () => ({
  clientsArray: Object.create(null),
}));

describe('Chatwoot outgoing LID contacts', () => {
  function setup(body: any) {
    const client = {
      status: 'CONNECTED',
      isConnected: jest.fn().mockResolvedValue(true),
      sendText: jest.fn().mockResolvedValue({}),
    };
    clientsArray.chatwoot = client as any;
    const req = {
      params: { session: 'chatwoot' },
      body,
      logger: { error: jest.fn() },
    };
    const res = { status: jest.fn(), json: jest.fn() };
    res.status.mockReturnValue(res);
    res.json.mockReturnValue(res);
    return { client, req, res };
  }

  afterEach(() => {
    delete clientsArray.chatwoot;
  });

  it('sends to the preserved LID when the contact has no phone number', async () => {
    const { client, req, res } = setup({
      event: 'message_created',
      message_type: 'outgoing',
      conversation: {
        meta: { sender: { identifier: '123456789@lid' } },
        messages: [{ content: 'hello', attachments: [] }],
      },
    });
    await chatWoot(req as any, res as any);
    expect(client.sendText).toHaveBeenCalledWith('123456789@lid', 'hello');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('ignores an unrelated event without dereferencing sender or conversation', async () => {
    const { client, req, res } = setup({ event: 'contact_updated' });
    await chatWoot(req as any, res as any);
    expect(client.sendText).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('rejects an outgoing event without recipient instead of hanging or throwing', async () => {
    const { client, req, res } = setup({
      event: 'message_created',
      message_type: 'outgoing',
      conversation: { messages: [{ content: 'hello' }] },
    });
    await chatWoot(req as any, res as any);
    expect(client.sendText).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
