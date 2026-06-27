/*
 * Standalone webhook sink for the dual-session live test. Logs every event the
 * server posts (per session), so we can confirm message RECEPTION end-to-end.
 * Keeps a counter per (session, event) and prints incoming message bodies.
 *
 * Run: npx tsx e2e/webhook-sink.ts   (listens on :9100)
 */
import express from 'express';

const PORT = Number(process.env.SINK_PORT || 9100);
const counts: Record<string, number> = {};

const app = express();
app.use(express.json({ limit: '50mb' }));

app.post('/webhook/:session', (req, res) => {
  const session = req.params.session;
  const event = req.body?.event || 'unknown';
  const key = `${session}:${event}`;
  counts[key] = (counts[key] || 0) + 1;

  let extra = '';
  if (event === 'onmessage' || event === 'received-message') {
    const body =
      req.body?.body ??
      req.body?.message?.conversation ??
      req.body?.content ??
      '';
    const from = req.body?.from ?? req.body?.author ?? '';
    extra = `  from=${from} body="${String(body).slice(0, 60)}"`;
  }
  console.log(`[${session}] ${event} (#${counts[key]})${extra}`);
  res.sendStatus(200);
});

app.get('/counts', (_req, res) => res.json(counts));

app.listen(PORT, () => {
  console.log(`webhook-sink listening on http://localhost:${PORT}`);
  console.log(`  per-session URL: http://localhost:${PORT}/webhook/<session>`);
});
