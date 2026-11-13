import { parseStatusAudience, sendStatus } from './statusAudience';

const IMAGE = 'data:image/png;base64,iVBORw0KGgo=';
const VIDEO = 'data:video/mp4;base64,AAAAIGZ0eXBpc29t';
const tick = () => new Promise((resolve) => setTimeout(resolve, 5));

function setup(options: { failOn?: string; failRestore?: boolean } = {}) {
  const log: string[] = [];
  let audience: string[] | 'contacts' = 'contacts';
  let active = 0;
  let maxActive = 0;
  const config: any = { sendStatusToDevice: false };
  const sender = (kind: string) =>
    jest.fn(async (_content: string, opts: any) => {
      log.push(
        `send:${kind}:${
          Array.isArray(audience) ? audience.join(',') : audience
        }:device=${config.sendStatusToDevice}:ack=${opts.waitForAck}`
      );
      await tick();
      if (options.failOn === kind) throw new Error(`${kind} failed`);
      return { id: `${kind}-id` };
    });
  const updateParticipants = jest.fn(async (ids: string[] | null) => {
    if (ids === null && options.failRestore) throw new Error('restore failed');
    audience = ids === null ? 'contacts' : ids;
    log.push(`audience:${ids === null ? 'contacts' : ids.join(',')}`);
  });
  const status = {
    updateParticipants,
    sendTextStatus: sender('text'),
    sendImageStatus: sender('image'),
    sendVideoStatus: sender('video'),
  };
  (global as any).window = { WPP: { config, status } };
  const client = {
    page: {
      evaluate: async (fn: any, args: any) => {
        active += 1;
        maxActive = Math.max(maxActive, active);
        try {
          return await fn(args);
        } finally {
          active -= 1;
        }
      },
    },
  };
  return {
    client,
    log,
    config,
    status,
    state: () => ({ audience, maxActive }),
  };
}

test('default sends leave session state untouched and return the result', async () => {
  const { client, log, config, status } = setup();
  await expect(
    sendStatus(client, 'text', 'hello', { backgroundColor: 1 })
  ).resolves.toEqual({ id: 'text-id' });
  expect(status.updateParticipants).not.toHaveBeenCalled();
  expect(status.sendTextStatus).toHaveBeenCalledWith('hello', {
    waitForAck: true,
    backgroundColor: 1,
  });
  expect(config.sendStatusToDevice).toBe(false);
  expect(log).toEqual(['send:text:contacts:device=false:ack=true']);
});

test('overlapping custom and default image, text and video sends never share an audience', async () => {
  const { client, log, config, state } = setup();
  const results = await Promise.all([
    sendStatus(client, 'image', IMAGE, {
      contacts: ['111@c.us'],
      caption: 'a',
    }),
    sendStatus(client, 'text', 'default text'),
    sendStatus(client, 'video', VIDEO, { contacts: ['222@c.us'] }),
    sendStatus(client, 'image', IMAGE),
    sendStatus(client, 'text', 'custom text', { contacts: ['333@c.us'] }),
    sendStatus(client, 'video', VIDEO),
  ]);
  expect(results.map((r: any) => r.id)).toEqual([
    'image-id',
    'text-id',
    'video-id',
    'image-id',
    'text-id',
    'video-id',
  ]);
  expect(state().maxActive).toBe(1);
  expect(log).toEqual([
    'audience:111@c.us',
    'send:image:111@c.us:device=true:ack=true',
    'audience:contacts',
    'send:text:contacts:device=false:ack=true',
    'audience:222@c.us',
    'send:video:222@c.us:device=true:ack=true',
    'audience:contacts',
    'send:image:contacts:device=false:ack=true',
    'audience:333@c.us',
    'send:text:333@c.us:device=true:ack=true',
    'audience:contacts',
    'send:video:contacts:device=false:ack=true',
  ]);
  expect(state().audience).toBe('contacts');
  expect(config.sendStatusToDevice).toBe(false);
});

test('a failed custom send restores the state, rejects, and lets the next send run', async () => {
  const { client, log, config, state } = setup({ failOn: 'image' });
  const failed = sendStatus(client, 'image', IMAGE, { contacts: ['111@c.us'] });
  const next = sendStatus(client, 'text', 'after failure');
  await expect(failed).rejects.toThrow('image failed');
  await expect(next).resolves.toEqual({ id: 'text-id' });
  expect(log).toEqual([
    'audience:111@c.us',
    'send:image:111@c.us:device=true:ack=true',
    'audience:contacts',
    'send:text:contacts:device=false:ack=true',
  ]);
  expect(state().audience).toBe('contacts');
  expect(config.sendStatusToDevice).toBe(false);
});

test('a failed restore after a successful send is reported and still resets the device flag', async () => {
  const { client, config } = setup({ failRestore: true });
  await expect(
    sendStatus(client, 'text', 'x', { contacts: ['111@c.us'] })
  ).rejects.toThrow('restore failed');
  expect(config.sendStatusToDevice).toBe(false);
});

test('a send failure is reported even when the restore also fails', async () => {
  const { client, config } = setup({ failOn: 'video', failRestore: true });
  await expect(
    sendStatus(client, 'video', VIDEO, { contacts: ['111@c.us'] })
  ).rejects.toThrow('video failed');
  expect(config.sendStatusToDevice).toBe(false);
});

test('invalid media is rejected without touching the audience', async () => {
  const { client, status } = setup();
  await expect(
    sendStatus(client, 'image', VIDEO, { contacts: ['111@c.us'] })
  ).rejects.toThrow('Invalid image');
  expect(status.updateParticipants).not.toHaveBeenCalled();
});

test('parses and normalizes the audience', () => {
  expect(parseStatusAudience({})).toEqual({ contacts: undefined });
  expect(
    parseStatusAudience({
      statusJidList: ['111@s.whatsapp.net', '111', '222@c.us'],
    })
  ).toEqual({ contacts: ['111@c.us', '222@c.us'] });
  expect(
    parseStatusAudience({ contacts: [], statusJidList: undefined })
  ).toEqual({ error: 'Invalid status audience' });
  expect(parseStatusAudience({ contacts: ['abc'] })).toEqual({
    error: 'Invalid status audience',
  });
  expect(
    parseStatusAudience({ contacts: ['1'], statusJidList: ['2'] })
  ).toEqual({ error: 'Use contacts OR statusJidList' });
});
