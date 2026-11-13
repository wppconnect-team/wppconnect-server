import { base64MimeType, downloadFileToBase64, fileToBase64 } from '@wppconnect-team/wppconnect/dist/api/helpers';

const queue = new WeakMap<object, Promise<unknown>>();

export async function sendImageStatusWithAudience(client: any, path: string, options: { caption?: string; contacts?: string[] }) {
  let base64 = path.startsWith('data:') ? path : await downloadFileToBase64(path, ['image/gif', 'image/png', 'image/jpg', 'image/jpeg', 'image/webp']);
  if (!base64) base64 = await fileToBase64(path);
  if (!base64 || !base64MimeType(base64)?.includes('image')) throw new Error('Invalid image');
  const previous = queue.get(client) || Promise.resolve();
  const current = previous.catch(() => undefined).then(() => client.page.evaluate(async ({ image, sendOptions }: any) => {
    const wpp = (window as any).WPP;
    wpp.config.sendStatusToDevice = true;
    await wpp.status.updateParticipants(sendOptions.contacts === undefined ? null : sendOptions.contacts);
    const { contacts, ...statusOptions } = sendOptions;
    return await wpp.status.sendImageStatus(image, { ...statusOptions, waitForAck: true });
  }, { image: base64, sendOptions: options }));
  queue.set(client, current);
  try { return await current; } finally { if (queue.get(client) === current) queue.delete(client); }
}
