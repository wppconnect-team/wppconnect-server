export let clientsArray = [];
export let sessions = [];
export const WEBHOOK_URL = process.env.WEBHOOK_URL || false;

if (!WEBHOOK_URL) {
  console.warn(
    'Variável ambiente "WEBHOOK_URL" não está definido, webhooks desativado'
  );
}
