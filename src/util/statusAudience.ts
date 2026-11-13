import {
  base64MimeType,
  downloadFileToBase64,
  fileToBase64,
} from '@wppconnect-team/wppconnect/dist/api/helpers';

export type StatusKind = 'text' | 'image' | 'video';

export interface StatusSendOptions {
  caption?: string;
  contacts?: string[];
  [key: string]: unknown;
}

const IMAGE_TYPES = [
  'image/gif',
  'image/png',
  'image/jpg',
  'image/jpeg',
  'image/webp',
];
const VIDEO_TYPES = [
  'video/mp4',
  'video/3gpp',
  'video/quicktime',
  'video/webm',
];

/**
 * One FIFO per session (client) shared by every status route.
 *
 * The status audience (the participants of `status@broadcast`) and
 * `WPP.config.sendStatusToDevice` are session-wide state in WA-JS, so a send
 * with a custom audience must never overlap any other status send of the same
 * session, whatever its kind.
 */
const queues = new WeakMap<object, Promise<unknown>>();

export function runStatusExclusive<T>(
  client: object,
  task: () => Promise<T>
): Promise<T> {
  const previous = queues.get(client) || Promise.resolve();
  const current = previous.catch(() => undefined).then(task);
  queues.set(client, current);
  const cleanup = () => {
    if (queues.get(client) === current) queues.delete(client);
  };
  current.then(cleanup, cleanup);
  return current;
}

async function toBase64(
  path: string,
  types: string[],
  kind: string
): Promise<string> {
  let base64 = path.startsWith('data:')
    ? path
    : await downloadFileToBase64(path, types);
  if (!base64) base64 = await fileToBase64(path);
  if (!base64 || !base64MimeType(base64)?.includes(kind))
    throw new Error(`Invalid ${kind}`);
  return base64;
}

/**
 * Runs inside the page. With a custom audience it sets the audience, sends,
 * and always (on success and on rejection) restores the previous
 * `sendStatusToDevice` value and the default audience (all contacts).
 * Without a custom audience it only sends and does not touch session state.
 */
export async function pageSendStatus({
  kind,
  content,
  options,
}: {
  kind: StatusKind;
  content: string;
  options: StatusSendOptions;
}) {
  // Self-contained on purpose: this function is serialized into the page, so
  // it must not rely on transpiler helpers (no object rest/spread here).
  const wpp = (window as any).WPP;
  const contacts = options.contacts;
  const sendOptions: Record<string, unknown> = { waitForAck: true };
  Object.keys(options).forEach((key) => {
    if (key !== 'contacts') sendOptions[key] = options[key];
  });
  const send = () => {
    if (kind === 'text') return wpp.status.sendTextStatus(content, sendOptions);
    if (kind === 'image')
      return wpp.status.sendImageStatus(content, sendOptions);
    return wpp.status.sendVideoStatus(content, sendOptions);
  };
  if (contacts === undefined) return await send();

  const previousSendToDevice = wpp.config.sendStatusToDevice;
  let result: unknown;
  let failure: unknown;
  let failed = false;
  try {
    wpp.config.sendStatusToDevice = true;
    await wpp.status.updateParticipants(contacts);
    result = await send();
  } catch (error) {
    failed = true;
    failure = error;
  }
  wpp.config.sendStatusToDevice = previousSendToDevice;
  try {
    await wpp.status.updateParticipants(null);
  } catch (restoreError) {
    if (!failed) throw restoreError;
  }
  if (failed) throw failure;
  return result;
}

export function sendStatus(
  client: any,
  kind: StatusKind,
  input: string,
  options: StatusSendOptions = {}
) {
  // Start the media conversion now but take the queue slot immediately, so
  // sends run in arrival order whatever their kind.
  const content: Promise<string> =
    kind === 'text'
      ? Promise.resolve(input)
      : toBase64(input, kind === 'image' ? IMAGE_TYPES : VIDEO_TYPES, kind);
  content.catch(() => undefined);
  return runStatusExclusive(client, async () =>
    client.page.evaluate(pageSendStatus, {
      kind,
      content: await content,
      options,
    })
  );
}

/**
 * Reads the optional audience (`contacts` or its alias `statusJidList`).
 * Returns `{ contacts: undefined }` for the default audience, the normalized
 * `@c.us` list for a custom one, or `{ error }` for invalid input.
 */
export function parseStatusAudience(body: any): {
  contacts?: string[];
  error?: string;
} {
  const { contacts, statusJidList } = body || {};
  if (contacts !== undefined && statusJidList !== undefined)
    return { error: 'Use contacts OR statusJidList' };
  const audience = contacts ?? statusJidList;
  if (audience === undefined) return { contacts: undefined };
  if (
    !Array.isArray(audience) ||
    !audience.length ||
    audience.some(
      (id: unknown) =>
        typeof id !== 'string' || !/^\d+(?:@c\.us|@s\.whatsapp\.net)?$/.test(id)
    )
  )
    return { error: 'Invalid status audience' };
  return {
    contacts: [
      ...new Set<string>(
        audience.map((id: string) => id.replace(/@.*$/, '') + '@c.us')
      ),
    ],
  };
}
