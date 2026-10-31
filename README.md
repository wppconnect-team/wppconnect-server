<p align="center">
  <a href="https://wppconnect.io"><img src="https://i.imgur.com/y1ts6RR.png" alt="WPPConnect Server" /></a>
</p>

<h1 align="center">WPPConnect Server</h1>
<p align="center">An open-source REST API for WhatsApp automation, multiple sessions, messaging, and integrations.</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@wppconnect/server"><img src="https://img.shields.io/npm/v/@wppconnect/server?color=green" alt="npm version" /></a>
  <a href="https://github.com/wppconnect-team/wppconnect-server/actions/workflows/build.yml"><img src="https://github.com/wppconnect-team/wppconnect-server/actions/workflows/build.yml/badge.svg" alt="Build" /></a>
  <a href="https://hub.docker.com/r/wppconnect/wppconnect-server"><img src="https://img.shields.io/docker/pulls/wppconnect/wppconnect-server?logo=docker" alt="Docker pulls" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-Apache%202.0-blue.svg" alt="Apache 2.0 license" /></a>
</p>

<p align="center">
  <a href="https://wppconnect.io">Website</a> &middot;
  <a href="https://wppconnect.io/swagger/wppconnect-server">API documentation</a> &middot;
  <a href="https://github.com/wppconnect-team/wppconnect-server/releases">Releases</a> &middot;
  <a href="https://discord.gg/JU5JGGKGNG">Community</a>
</p>

## About

WPPConnect Server exposes WhatsApp features through HTTP endpoints, webhooks, and Socket.IO. Build customer support tools, notifications, bots, and CRM integrations without embedding browser automation into your application.

The default provider uses [WPPConnect](https://github.com/wppconnect-team/wppconnect) and [WA-JS](https://github.com/wppconnect-team/wa-js) with Chromium. Experimental browserless providers are also available. The official Docker image includes [WPPConnect Manager](https://github.com/wppconnect-team/wppconnect-manager) for session administration and QR pairing.

This independent community project connects through WhatsApp Web. It is not the official Meta WhatsApp Cloud API. Features and availability depend on provider support and WhatsApp Web compatibility.

## Contents

- [Features](#features)
- [WhatsApp providers](#whatsapp-providers)
- [Quick start](#quick-start)
- [Configuration](#configuration)
- [Embedding and migration](#embedding-and-migration)
- [Authentication and first message](#authentication-and-first-message)
- [WPPConnect Manager](#wppconnect-manager)
- [API documentation](#api-documentation)
- [Events and integrations](#events-and-integrations)
- [Experimental features](#experimental-features)
- [Architecture](#architecture)
- [Development and testing](#development-and-testing)
- [Contributing and releases](#contributing-and-releases)
- [Operations and troubleshooting](#operations-and-troubleshooting)
- [Community and support](#community-and-support)
- [Security](#security)
- [License and acknowledgments](#license-and-acknowledgments)

## Features

- Multiple named sessions with separate tokens and lifecycle controls.
- Text, image, video, audio, document, location, reply, and contact messages where supported.
- Contacts, chats, groups, profile settings, and presence controls.
- Browser-provider features for catalogs, labels, polls, communities, newsletters, and status.
- Webhooks and Socket.IO events for messages, acknowledgments, and session changes.
- Swagger UI and a bundled Manager in the official Docker image.
- File token storage by default, with optional Redis and MongoDB stores.
- Chatwoot integration, optional S3-compatible storage, and an external Media API adapter.
- Health checks, Prometheus metrics, and opt-in Chromium session resource monitoring.

## WhatsApp providers

Choose a provider when starting a session. Omitting `provider` selects `wppconnect`. Use a distinct session name for each backend; close or log out an existing session before changing its provider.

| Provider     | Runtime                 | Availability | QR pairing                        |
| ------------ | ----------------------- | ------------ | --------------------------------- |
| `wppconnect` | WPPConnect and Chromium | Default      | `start-session`, `status-session` |
| `baileys`    | Baileys socket runtime  | Experimental | `status-session`                  |
| `whaileys`   | Whaileys socket runtime | Experimental | `status-session`                  |
| `zapo`       | Zapo socket runtime     | Experimental | `status-session`                  |

| Route area                                                                   | `wppconnect`       | `baileys` / `whaileys` | `zapo`   |
| ---------------------------------------------------------------------------- | ------------------ | ---------------------- | -------- |
| Session lifecycle and QR                                                     | Yes                | Yes                    | Yes      |
| Text, image, file, voice, reply, delete                                      | Yes                | Yes                    | Yes      |
| Location, forwarding, contact vCard                                          | Yes                | Yes                    | HTTP 501 |
| Supported group reads and mutations                                          | Yes                | Yes                    | Yes      |
| Contact/chat store listing                                                   | Yes                | Yes                    | HTTP 501 |
| Reactions and chat-level seen                                                | Yes                | HTTP 501               | HTTP 501 |
| History, stickers, polls, catalogs, labels, status, communities, newsletters | Provider-dependent | HTTP 501               | HTTP 501 |

This table describes the adapter contract, not proof of every connected operation. Unsupported socket-provider routes return HTTP `501`. See the authoritative [route allowlist](src/core/provider/routeSupport.ts).

WPPConnect supplies its compatible WA-JS version. Update WPPConnect as a unit rather than forcing an unrelated WA-JS version. Runtime dependency changes must pass the provider matrix before integration.

## Quick start

### Docker Compose

Requirements: Docker Engine and Docker Compose v2.

```bash
git clone https://github.com/wppconnect-team/wppconnect-server.git
cd wppconnect-server
git switch main
cp .env.example .env
# Edit .env and replace SECRET_KEY with a long random value.
docker compose up -d
```

- Manager: `http://localhost:21465/manager/`
- Swagger: `http://localhost:21465/api-docs/`
- Health: `http://localhost:21465/healthz`

Compose creates persistent volumes for tokens, browser profiles, uploads, images, and logs. Redis and MongoDB are optional external services and are not started by this file. For reproducible deployments, set `WPP_SERVER_TAG` in `.env` to a published version from [Docker Hub](https://hub.docker.com/r/wppconnect/wppconnect-server/tags). Use `develop` images for integration testing.

```bash
docker compose logs -f
docker compose down
# Upgrade after choosing the desired image tag in .env:
docker compose pull
docker compose up -d
```

Keep volumes when stopping or upgrading. `docker compose down -v` deletes stored session data.

### Docker CLI

```bash
docker run -d --name wppconnect-server \
  --env-file .env \
  -e CUSTOM_USER_DATA_DIR=/usr/src/wpp-server/userDataDir/ \
  -p 21465:21465 \
  -v wppconnect_tokens:/usr/src/wpp-server/tokens \
  -v wppconnect_profiles:/usr/src/wpp-server/userDataDir \
  -v wppconnect_uploads:/usr/src/wpp-server/uploads \
  -v wppconnect_images:/usr/src/wpp-server/WhatsAppImages \
  -v wppconnect_logs:/usr/src/wpp-server/log \
  wppconnect/wppconnect-server:latest
```

### Local installation

Use the Node.js version in [package.json](package.json), currently `22.22.2`, Yarn `4.14.1`, and Chrome/Chromium for the default provider. Native dependencies may require Python and a C/C++ toolchain when prebuilt binaries are unavailable.

```bash
git clone https://github.com/wppconnect-team/wppconnect-server.git
cd wppconnect-server
git switch main
corepack enable
corepack prepare yarn@4.14.1 --activate
yarn install --immutable
cp .env.example .env
# Set your SECRET_KEY in .env.
yarn build
yarn start
```

For development, switch to `develop` and run `yarn dev`. PowerShell also supports `Copy-Item .env.example .env`.

Docker includes the Manager bundle. A local checkout needs a separately built bundle and `MANAGER_DIST` pointing to it; REST and Swagger work without that bundle.

## Configuration

Defaults live in [src/config.ts](src/config.ts). Copy [.env.example](.env.example) for deployment settings. Precedence is process environment, optional `.env` in the working directory, then built-in defaults. Restart the process or recreate the container after changes.

```dotenv
SECRET_KEY=replace-with-a-long-random-secret
HOST=http://localhost
PORT=21465
TOKEN_STORE_TYPE=file
CUSTOM_USER_DATA_DIR=./userDataDir/
MANAGER_ENABLED=true
WEBHOOK_URL=
WEBHOOK_ALLOWED_URLS=
```

| Setting                          | Purpose                                                         | Default                                             |
| -------------------------------- | --------------------------------------------------------------- | --------------------------------------------------- |
| `SECRET_KEY`                     | Token generation and administrator access                       | Legacy development value; replace before deployment |
| `HOST`                           | Advertised URL, not the bind address                            | `http://localhost`                                  |
| `PORT`                           | Listener and Compose published port                             | `21465`                                             |
| `TOKEN_STORE_TYPE`               | `file`, `redis`, `mongodb`                                      | `file`                                              |
| `CUSTOM_USER_DATA_DIR`           | Browser profile directory                                       | `./userDataDir/`                                    |
| `FORCE_CLEAN_CHROMIUM_LOCKS`     | Container entrypoint recovery only, after stopping every owner   | `0`                                                |
| `MAX_LISTENERS`                  | Event listener limit                                            | `15`                                                |
| `MANAGER_ENABLED`                | Serve the Manager UI                                            | `true`                                              |
| `MANAGER_DIST`                   | Existing Manager bundle path                                    | `./manager`, or Docker bundle                       |
| `WEBHOOK_URL`                    | Default webhook receiver                                        | Unset                                               |
| `WEBHOOK_ALLOWED_URLS`           | Comma-separated exact destinations allowed for session webhooks | Empty list                                          |
| `WEBHOOK_RETRY_ATTEMPTS`         | Total attempts                                                  | `3`, bounded to 1-10                                |
| `WEBHOOK_RETRY_DELAY`            | Initial backoff, milliseconds                                   | `5000`, capped at 60000                             |
| `WEBHOOK_REQUEST_TIMEOUT`        | Per-attempt timeout, milliseconds                               | `30000`, bounded to 1-120000                        |
| `WEBHOOK_AUTO_DOWNLOAD_MAX_SIZE` | Maximum media bytes inlined as base64                           | `0`, unlimited                                      |
| `MEDIA_API_URL`, `MEDIA_API_KEY` | External Media API endpoint and credential                      | Unset                                               |
| `MEDIA_API_TIMEOUT_MS`           | Media API timeout, milliseconds                                 | `30000`                                             |
| `WPP_SERVER_TAG`                 | Compose image tag                                               | `latest`                                            |

| Optional store | Variables                                                                                                                        |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Redis          | `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_DB`, `REDIS_PREFIX`                                                         |
| MongoDB        | `MONGO_URL_REMOTE`, `MONGODB_DATABASE`, `MONGODB_COLLECTION`, `MONGODB_USER`, `MONGODB_PASSWORD`, `MONGODB_HOST`, `MONGODB_PORT` |

The default MongoDB remote mode uses `MONGO_URL_REMOTE`. Structured host settings apply when `db.mongoIsRemote` is disabled in advanced configuration. These stores persist authentication data; they are not a complete message-history database.

Compose explicitly forwards supported variables. Select another file with `docker compose --env-file .env.production up -d`; shell variables take precedence. Plain Docker uses `--env-file` or `-e`. When changing `PORT`, adjust both sides of the Docker CLI `-p` mapping.

Container paths refer to the container filesystem. Keep profiles inside their mounted directory. Private `.env` files are excluded from images and npm packages; `.env.example` is distributed for reference.

Browser arguments, event toggles, resource monitoring, and S3 settings live in `src/config.ts` or can be passed to `initServer(...)`. TypeScript configuration changes require rebuilding; environment-only changes do not.

## Embedding and migration

The next major release changes the Node.js embedding API. `initServer(options)` is asynchronous and returns `{ app, routes, logger }`, with `app` now a Fastify instance. Update integrations that expect a synchronous return or an Express application before upgrading.

```typescript
const { app } = await initServer(options);
// The HTTP listener has already started. app is a FastifyInstance.

// For controlled shutdown:
await app.close();
```

Use Fastify lifecycle APIs for the returned application. The returned `routes` value remains an Express router. See [release readiness and migration](docs/develop-release-readiness.md#release-gates-and-migration) for the major-release requirements and validation limits.

## Authentication and first message

Use the server secret to issue a token for a named session. Replace the examples below. These snippets use a POSIX shell, `curl`, and `jq` for token extraction.

### 1. Generate a token

```bash
export SERVER_URL=http://localhost:21465
export SESSION=my-session
export SECRET_KEY=your-private-server-secret
export TOKEN=$(curl --fail --silent --request POST \
  "$SERVER_URL/api/$SESSION/$SECRET_KEY/generate-token" | jq -r '.token')
```

The response contains `session`, `token`, and `full`. Use `token` as `Authorization: Bearer <token>` for that session. Avoid recording token-generation URLs in shared logs because they contain the server secret.

### 2. Start and pair

```bash
curl --request POST "$SERVER_URL/api/$SESSION/start-session" \
  --header "Authorization: Bearer $TOKEN" \
  --header 'Content-Type: application/json' \
  --data '{"provider":"wppconnect","waitQrCode":false}'

curl "$SERVER_URL/api/$SESSION/status-session" \
  --header "Authorization: Bearer $TOKEN"
```

Poll until `QRCODE` or `CONNECTED`. At `QRCODE`, `qrcode` is a PNG data URL and `urlcode` is the raw pairing payload. Scan through WhatsApp's linked-device flow or the Manager. Treat both QR values as short-lived credentials.

To evaluate another backend, generate a token for a separate session and select `baileys`, `whaileys`, or `zapo` in the start request.

### 3. Send a message

```bash
curl --request POST "$SERVER_URL/api/$SESSION/send-message" \
  --header "Authorization: Bearer $TOKEN" \
  --header 'Content-Type: application/json' \
  --data '{"phone":"5511999999999","message":"Hello from WPPConnect Server!"}'
```

Use the full country code. Normalization preserves explicit supported domains such as `@c.us`, `@g.us`, `@lid`, and `@newsletter`. Operation availability depends on the provider.

## WPPConnect Manager

The official image serves `/manager/` with server profiles, sessions, QR pairing, chats, contacts, groups, media, English/Portuguese translations, and light/dark themes.

- Use `SECRET_KEY` for administration, or a session name/token for restricted access.
- Credentials remain in browser memory.
- `MANAGER_ENABLED=false` disables the UI while keeping the API available.
- Docker pins and verifies the Manager bundle checksum during build.

See [Manager configuration, APIs, authenticated events, and rollback](docs/manager.md). Use its authenticated session rooms for new administrative integrations. Legacy Socket.IO clients use a separate compatibility contract.

## API documentation

Swagger is available at `/api-docs/`. The running server is the best reference for enabled routes. Also see the [published Swagger](https://wppconnect.io/swagger/wppconnect-server), [Postman collection](https://documenter.getpostman.com/view/9139457/TzshF4jQ), and [route definitions](src/routes/index.ts).

| Method | Endpoint                                  | Purpose                                                                       |
| ------ | ----------------------------------------- | ----------------------------------------------------------------------------- |
| `GET`  | `/healthz`                                | Process health                                                                |
| `POST` | `/api/:session/:secretkey/generate-token` | Issue session token                                                           |
| `POST` | `/api/:session/start-session`             | Start a session                                                               |
| `GET`  | `/api/:session/status-session`            | Status and QR                                                                 |
| `POST` | `/api/:session/send-message`              | Text message                                                                  |
| `POST` | `/api/:session/send-image`                | Image                                                                         |
| `POST` | `/api/:session/send-file`                 | Document                                                                      |
| `POST` | `/api/:session/close-session`             | Close runtime, preserve credentials                                           |
| `POST` | `/api/:session/logout-session`            | Log out and remove session data                                               |
| `GET`  | `/api/dashboard/stats`                    | Provider overview; administrator bearer token required                        |
| `GET`  | `/metrics`                                | Prometheus; administrator bearer token required when exposing session metrics |

Session endpoints require their corresponding token. Administrative and Manager endpoints use their documented administrator authentication. Check Swagger for request and response schemas.

## Events and integrations

### Webhooks and Socket.IO

Set `WEBHOOK_URL` for a global receiver. Session destinations must exactly match that URL or an entry in `WEBHOOK_ALLOWED_URLS` / `webhook.allowedUrls`.

Delivery retries transient connection failures with exponential backoff and the same payload. HTTP error responses are not retried. Receivers should deduplicate by session, event, and message ID because a connection can fail after processing. Pending retries are in memory and do not survive restarts.

Events depend on provider support and configured listeners. See [authenticated Manager events](docs/manager.md) for session isolation. Protect legacy channels at the network boundary when retaining them for existing clients.

### Chatwoot

Configure the session's `chatWoot` options and point Chatwoot webhooks at the authenticated server route. Contact synchronization preserves LID identifiers when a phone number cannot be resolved. Outgoing event filtering occurs before conversation content is read.

### Media and object storage

Configure `aws_s3` for S3-compatible uploads. The external Media API adapter supports audio/video/transcription jobs at `/api/:session/media/audio`, `/api/:session/media/video`, and `/api/:session/media/transcriptions`; poll `/api/:session/media/jobs/:jobId`. Requests use an `Idempotency-Key`. Set `MEDIA_API_URL` and `MEDIA_API_KEY`; unconfigured requests return HTTP `503`. The upstream key stays on the backend.

## Experimental features

- **Browserless providers:** verify pairing, reconnects, messages, acknowledgments, and the routes your application uses before adoption.
- **Call media bridge:** opt-in browser instrumentation and `/call-media` use single-use tickets scoped to a session and call. Browser and transport tests do not replace a live WhatsApp call test. See [the call media guide](docs/whatsapp-call-media-bridge.md).
- **Community announcement comments:** guarded endpoints/events require released upstream comment APIs. Older clients return HTTP `501`; only locally synchronized history is returned. Track [WA-JS #3713](https://github.com/wppconnect-team/wa-js/pull/3713) and [WPPConnect #2912](https://github.com/wppconnect-team/wppconnect/pull/2912).
- **Resource monitoring:** enable `resourceMonitor.enable` in advanced configuration. Chromium measurements do not attribute browserless CPU/memory per session. Session metric exposure requires administrator authorization.

Read aggregate resource usage at `GET /api/sessions/resource-usage` with
`Authorization: Bearer <SECRET_KEY>`. Administrator secrets are not accepted in
GET parameters or query strings for this endpoint.

## Architecture

```text
Application / CRM / Manager
            |
    REST API and Socket.IO
            |
 Authentication and route support
            |
 Session lifecycle and provider adapters
       /                  \
 WPPConnect + Chromium    Baileys / Whaileys / Zapo
       \                  /
       Webhooks / media / token stores
```

| Component              | Technology                                 |
| ---------------------- | ------------------------------------------ |
| Runtime                | Node.js and TypeScript                     |
| HTTP                   | Fastify with Express middleware bridge     |
| Real-time transport    | Socket.IO                                  |
| Browser automation     | WPPConnect, WA-JS, Puppeteer/Chromium      |
| Authentication storage | Files, Redis, MongoDB                      |
| Documentation          | Swagger                                    |
| Validation             | Jest, browser integration, provider matrix |
| Distribution           | npm and Docker                             |

```text
src/
  controller/   HTTP handlers
  core/         Providers, capabilities, events, sessions
  manager/      Manager API, auth, socket rooms, static UI
  middleware/   Authentication, connections, metrics, errors
  routes/       API routes
  types/        Configuration and request types
  util/         Sessions, storage, media, integrations
  tests/        Unit and integration tests
docs/           Integration and operations guides
e2e/            Provider and connected-session validation
scripts/        Build and smoke tools
.env.example    Deployment settings
Dockerfile
docker-compose.yml
```

## Development and testing

```bash
git switch develop
yarn install --immutable
yarn dev
```

| Command                      | Purpose                               |
| ---------------------------- | ------------------------------------- |
| `yarn build`                 | TypeScript validation and Babel build |
| `yarn lint`                  | ESLint and formatting checks          |
| `yarn test --runInBand`      | Server and integration tests          |
| `yarn smoke:provider-crypto` | Provider encryption round trip        |
| `yarn test:runtime-matrix`   | Provider imports and QR generation    |
| `yarn test:runtime-real`     | Interactive connected-provider checks |
| `yarn e2e`                   | E2E runner; see its guide             |
| `yarn docs`                  | Regenerate Swagger                    |

Run the Node QR matrix without the optional Go server:

```bash
MATRIX_TEST_GO=0 yarn test:runtime-matrix
```

PowerShell:

```powershell
$env:MATRIX_TEST_GO='0'
yarn test:runtime-matrix
```

Pairing and real send/receive need authorized test accounts and the setup in [e2e/README.md](e2e/README.md). A QR alone does not prove connected operations. Keep generated images and credentials out of commits and public logs.

## Contributing and releases

**Open all contribution PRs against `develop`.** This includes features, fixes, documentation, and dependency updates. **`main` is reserved for reviewed release promotions from `develop`.**

```text
feature / fix / docs / dependency branch
                 |
            PR -> develop
                 |
        integration and validation
                 |
        release PR: develop -> main
                 |
        version, changelog, release
```

1. Branch from the current `develop`.
2. Make a focused change with relevant tests and documentation.
3. Run applicable build, lint, tests, and provider checks.
4. Open your PR with **base: `develop`** and include validation evidence.
5. After integration testing, maintainers open a **`develop` -> `main`** release PR documenting scope and compatibility limits.
6. Merge the approved release PR to invoke the release workflow. Synchronize release commits back into `develop` before the next promotion.

Ordinary contribution PRs must not target `main`. Maintainers manage versions and changelogs through the release workflow; do not replace the current version with an older development version. See [CONTRIBUTING.md](CONTRIBUTING.md) and [CHANGELOG.md](CHANGELOG.md).

Docker publication follows branches and tags:

- `develop`: development image and commit SHA tag.
- `main`: main image and commit SHA tag.
- `vX.Y.Z`: version, major/minor, and `latest` tags.
- Pull requests: build and verify without publishing.

Administrators configure release credentials plus `DOCKERHUB_USERNAME` / `DOCKERHUB_TOKEN` for image publishing. A passing build alone does not establish WhatsApp compatibility.

## Operations and troubleshooting

| Symptom                         | Check                                                          |
| ------------------------------- | -------------------------------------------------------------- |
| HTTP 401                        | Session/token pair, administrator secret, authorization header |
| HTTP 501                        | Provider route support or missing upstream comment APIs        |
| Media API HTTP 503              | `MEDIA_API_URL`, `MEDIA_API_KEY`                               |
| Missing QR/disconnected session | Browser, network, session status, provider logs                |
| Manager HTTP 404                | `MANAGER_ENABLED`, bundle installation, `MANAGER_DIST`         |
| Redis/MongoDB errors            | Service connectivity, credentials, token store                 |
| Webhook without media base64    | Size limit; fetch through download-media                       |

Use `/healthz`, logs, and session status to diagnose startup. HTTP health does not establish WhatsApp connectivity. Back up persistent storage before upgrades and retain the previous pinned image for rollback.

### Chromium profile ownership and recovery

Never run two Chromium instances against the same profile. The entrypoint creates `CUSTOM_USER_DATA_DIR` before acquiring its exclusive `.entrypoint.lock`. The lock stays held for the server process lifetime. Startup fails without `flock` or when another cooperating entrypoint holds the lock; it does not remove that owner's Chromium singleton symlinks.

After acquiring the lock, the entrypoint removes leftover `SingletonLock`, `SingletonSocket` and `SingletonCookie` symlinks only when `.entrypoint.managed` already exists, or when explicit recovery is enabled. The marker records prior use of this entrypoint protocol. It does not establish ownership of browsers started independently, orphaned browsers or an older image used after rollback. Stop all such owners before reusing the profile, including when rolling back.

For an unmanaged legacy profile, startup refuses cleanup by default. Stop every container and browser using that profile, back up the directory, then pass `FORCE_CLEAN_CHROMIUM_LOCKS=1` explicitly to the container for the recovery start. Remove the override after recovery. The default is `0`; this flag belongs to the container entrypoint and is not a general server setting. Docker Compose forwards only declared variables, so a value in a host `.env` alone does not enable it: declare the variable in the service's `environment` or pass it through the container runtime. Never use this override to bypass a live owner.

## Community and support

- [Website](https://wppconnect.io)
- [GitHub issues](https://github.com/wppconnect-team/wppconnect-server/issues)
- [GitHub discussions](https://github.com/wppconnect-team/wppconnect-server/discussions)
- [Discord](https://discord.gg/JU5JGGKGNG)
- [Telegram](https://t.me/wppconnect)
- [YouTube](https://www.youtube.com/c/wppconnect)

Include version, provider, environment, reproduction steps, and sanitized logs in reports. Community support is provided on a best-effort basis.

## Security

Report vulnerabilities privately through [GitHub Security Advisories](https://github.com/wppconnect-team/wppconnect-server/security/advisories). Never publish tokens, QR payloads, session files, phone numbers, or sensitive content in public reports.

Use a private random secret, HTTPS at the deployment boundary, restricted administrative access, and appropriate storage permissions. See [security dependency resolutions](docs/security-resolutions.md) for transitive dependency decisions.

## License and acknowledgments

Licensed under the [Apache License 2.0](LICENSE).

Thanks to the WPPConnect community and the maintainers of [WPPConnect](https://github.com/wppconnect-team/wppconnect), [WA-JS](https://github.com/wppconnect-team/wa-js), [WPPConnect Manager](https://github.com/wppconnect-team/wppconnect-manager), and the provider runtimes used by this project.
