# E2E Test Runner

Interactive end-to-end smoke test for the provider-based wppconnect-server. It
proves a real session works after the v2 refactor by:

1. Starting a local **webhook receiver** that logs every event the server posts.
2. Generating an auth token and starting a session.
3. Rendering the **QR code in your terminal** — you scan it with WhatsApp.
4. Waiting for the session to connect.
5. Calling each **route group** against the live session and printing a
   pass/fail report, plus a count of the webhooks received.

This is a manual script (it waits for a human to scan a QR), so it is **not**
part of `yarn test` (the Jest suite).

## How to run

### Runtime matrix

Use this first when validating the Node providers and the Go server:

```bash
yarn test:runtime-matrix
```

By default it starts the Node server and the sibling `../wppconnect-server-go`
server, then checks each runtime up to QR emission. The Node server is started
with `startAllSession=false` and a temporary `userDataDir`, so local saved
sessions do not pollute the smoke run.

Useful overrides:

```bash
MATRIX_PROVIDERS=wppconnect,baileys yarn test:runtime-matrix
MATRIX_TEST_GO=0 yarn test:runtime-matrix
MATRIX_INTERACTIVE=1 MATRIX_QR_TIMEOUT_MS=300000 yarn test:runtime-matrix
MATRIX_START_NODE=0 MATRIX_NODE_BASE_URL=http://localhost:21465 yarn test:runtime-matrix
```

PowerShell examples:

```powershell
$env:MATRIX_PROVIDERS='wppconnect,baileys'; yarn test:runtime-matrix
$env:MATRIX_INTERACTIVE='1'; $env:MATRIX_QR_TIMEOUT_MS='300000'; yarn test:runtime-matrix
```

The scoped packages `@wppconnect/baileys`, `@wppconnect/whaileys` and
`@wppconnect/zapo` are npm aliases to the currently published upstream packages.
When native WPPConnect forks are published, replace those alias versions in
`optionalDependencies`.

### Full route E2E

In one terminal, start the server:

```bash
yarn dev          # serves on http://localhost:21465
```

In a second terminal, run the E2E runner:

```bash
yarn e2e
```

Scan the QR that appears, wait for "Session connected!", and watch the report.

## Configuration (env vars)

| Var                | Default                     | Meaning                                   |
| ------------------ | --------------------------- | ----------------------------------------- |
| `E2E_BASE_URL`     | `http://localhost:21465`    | Server base URL                           |
| `E2E_SECRET_KEY`   | `THISISMYSECURETOKEN`       | Server `secretKey` (from `config.ts`)     |
| `E2E_SESSION`      | `E2E_TEST`                  | Session name                              |
| `E2E_WEBHOOK_PORT` | `8999`                      | Local webhook receiver port               |
| `E2E_WEBHOOK_URL`  | `http://localhost:8999/...` | Override the webhook URL sent to server   |
| `E2E_TARGET`       | own number                  | Phone the test messages are sent to       |
| `E2E_PROVIDER`     | `wppconnect`                | Provider for the session                  |

Example sending to a specific number:

```bash
E2E_TARGET=5521999999999 yarn e2e
```

### Testing the Baileys provider

```bash
# 1. start the server
yarn dev
# 2. run the E2E against the baileys provider
E2E_PROVIDER=baileys yarn e2e
```

Routes for features Baileys does not support (catalog, labels, groups on some
builds) are expected to return **HTTP 501** — the runner counts those as a pass
when marked `allowNotSupported`.

## Docker note

If the server runs inside Docker, the webhook URL must be reachable from the
container. Set:

```bash
E2E_WEBHOOK_URL=http://host.docker.internal:8999/webhook yarn e2e
```
