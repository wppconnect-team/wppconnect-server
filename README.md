# WPPConnect Team

## _WPPConnect Server_

![WPPConnect-SERVER](https://i.imgur.com/y1ts6RR.png)

[![npm version](https://img.shields.io/npm/v/@wppconnect/server.svg?color=green)](https://www.npmjs.com/package/@wppconnect/server)
[![Downloads](https://img.shields.io/npm/dm/@wppconnect/server.svg)](https://www.npmjs.com/package/@wppconnect/server)
[![Average time to resolve an issue](https://isitmaintained.com/badge/resolution/wppconnect-team/wppconnect-server.svg)](https://isitmaintained.com/project/wppconnect-team/wppconnect-server 'Average time to resolve an issue')
[![Percentage of issues still open](https://isitmaintained.com/badge/open/wppconnect-team/wppconnect-server.svg)](https://isitmaintained.com/badge/open/wppconnect-team/wppconnect-server.svg 'Percentage of issues still open')
[![Build Status](https://img.shields.io/github/actions/workflow/status/wppconnect-team/wppconnect-server/build.yml)](https://github.com/wppconnect-team/wppconnect-server/actions)
[![Build](https://github.com/wppconnect-team/wppconnect-server/actions/workflows/build.yml/badge.svg)](https://github.com/wppconnect-team/wppconnect-server/actions/workflows/build.yml)
[![release-it](https://img.shields.io/badge/%F0%9F%93%A6%F0%9F%9A%80-release--it-e10079.svg)](https://github.com/release-it/release-it)

Welcome to the **WPPConnect Server** repository, developed by the WPPConnect Team. Our mission is to provide a robust and ready-to-use API for seamless communication with WhatsApp. The server is designed to streamline the process of sending and receiving messages, managing contacts, creating groups, and much more, all while leveraging the power of JavaScript ES6, NodeJS, and a RESTful architecture.

- Javascript ES6
- NodeJS
- Restfull

## Our online channels

Connect with us across various platforms to stay updated and engage in discussions:

[![Discord](https://img.shields.io/discord/844351092758413353?color=blueviolet&label=Discord&logo=discord&style=flat)](https://discord.gg/JU5JGGKGNG)
[![Telegram Group](https://img.shields.io/badge/Telegram-Group-32AFED?logo=telegram)](https://t.me/wppconnect)
[![WhatsApp Group](https://img.shields.io/badge/WhatsApp-Group-25D366?logo=whatsapp)](https://chat.whatsapp.com/LJaQu6ZyNvnBPNAVRbX00K)
[![YouTube](https://img.shields.io/youtube/channel/subscribers/UCD7J9LG08PmGQrF5IS7Yv9A?label=YouTube)](https://www.youtube.com/c/wppconnect)

## Documentations

Detailed documentation and guides are available for your convenience:

- [Postman](https://documenter.getpostman.com/view/9139457/TzshF4jQ)
- [Swagger](https://wppconnect.io/swagger/wppconnect-server)
- Swagger UI can be accessed on your server through the route: "IP:PORT/api-docs"

## Features

|                                      |     |
| ------------------------------------ | --- |
| Multiple Sessions                    | ✔   |
| Send **text, image, video and docs** | ✔   |
| Get **contacts list**                | ✔   |
| Manage products                      | ✔   |
| Receive/Send messages                | ✔   |
| Open/Close Session                   | ✔   |
| Change Profile/Username              | ✔   |
| Create Group                         | ✔   |
| Join Group by Invite Code            | ✔   |
| Webhook                              | ✔   |

## WhatsApp providers

The provider is selected per session. Existing integrations remain compatible
because `wppconnect` is the default when the request omits `provider`.
Use a distinct session name while comparing providers; an existing live session
keeps the provider with which it was created.

| Provider     | Runtime             | Status       | QR flow                              |
| ------------ | ------------------- | ------------ | ------------------------------------ |
| `wppconnect` | Chrome + WPPConnect | Default      | `start-session` and `status-session` |
| `baileys`    | Browserless socket  | Experimental | `status-session`                     |
| `whaileys`   | Browserless socket  | Experimental | `status-session`                     |
| `zapo`       | Browserless socket  | Experimental | `status-session`                     |

Experimental providers expose the same REST surface when they support the
underlying feature. A route that is not supported by the selected provider
returns HTTP `501` instead of a generic server error.

Provider routes are deny-by-default: a new or untranslated route remains
unavailable until its adapter behavior and response contract are validated.
The current compatibility contract lives in
[`src/core/provider/routeSupport.ts`](src/core/provider/routeSupport.ts).

| Route area                                                                      | `wppconnect` | `baileys` / `whaileys` | `zapo` |
| ------------------------------------------------------------------------------- | ------------ | ---------------------- | ------ |
| Session and QR lifecycle                                                        | Yes          | Yes                    | Yes    |
| Text, file, image, voice, reply and delete                                      | Yes          | Yes                    | Yes    |
| Reaction and chat-level seen                                                    | Yes          | `501`                  | `501`  |
| Location, forwarding and contact vCard                                          | Yes          | Yes                    | `501`  |
| Supported group reads and mutations                                             | Yes          | Yes                    | Yes    |
| Contact/chat store listing                                                      | Yes          | Yes                    | `501`  |
| History, stickers, polls, catalog, labels, stories, communities and newsletters | Yes          | `501`                  | `501`  |

This table is a compatibility boundary, not a claim that a QR proves every
operation. Connected-session tests are still required before promoting an
experimental provider to stable.

Start a session with an explicit provider:

```sh
curl -X POST "http://localhost:21465/api/mySession/start-session" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"provider":"baileys","waitQrCode":false}'
```

For every provider, poll the normalized status endpoint until it returns
`QRCODE` or `CONNECTED`:

```sh
curl "http://localhost:21465/api/mySession/status-session" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

When the status is `QRCODE`, `qrcode` contains a PNG data URL and `urlcode`
contains the raw QR payload. Treat both values as short-lived credentials: do
not publish them, attach them to issues, or persist them in logs.

### Validate QR generation for every provider

The runtime matrix starts isolated sessions and verifies real QR emission from
`wppconnect`, `baileys`, `whaileys`, and `zapo` without requiring a phone scan:

```sh
MATRIX_TEST_GO=0 yarn test:runtime-matrix
```

PowerShell:

```powershell
$env:MATRIX_TEST_GO='0'; yarn test:runtime-matrix
```

To display and scan each QR, use interactive mode. QR images are written to the
gitignored `e2e/.runtime-qrs/` directory:

```powershell
$env:MATRIX_TEST_GO='0'; $env:MATRIX_INTERACTIVE='1'; yarn test:runtime-matrix
```

For connected-session and real message checks, see [the E2E guide](e2e/README.md).

### WA-JS compatibility

`wppconnect-server` consumes WA-JS through `@wppconnect-team/wppconnect`. Update
WPPConnect rather than forcing an independent WA-JS version, so the browser
layer and injected WA-JS bundle stay compatible. This `develop` configuration
is independent from `main`; Renovate targets only `develop`. WhatsApp runtime
updates are not auto-merged and the CI requires the provider import/QR matrix.
Temporary transitive security overrides and their required runtime checks are
documented in
[`docs/security-resolutions.md`](docs/security-resolutions.md).

## Libraries Used

- WPPConnect
- WA-JS (through WPPConnect)
- Baileys, Whaileys and Zapo providers
- Axios
- Bcrypt
- Cors
- Dotenv
- Express
- Nodemon
- SocketIO
- S3

## Installation

Install the dependencies and start the server.

```sh
yarn install
//or
npm install
```

## Install puppeteer dependencies:

```sh
sudo apt-get install -y libxshmfence-dev libgbm-dev wget unzip fontconfig locales gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils libvips-dev

```

## Install google chrome

```sh

wget -c https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb

sudo apt-get update

sudo apt-get install libappindicator1

sudo dpkg -i google-chrome-stable_current_amd64.deb

```

### Troubleshooting

If you encounter installation issues, please try the procedures below
. Error Sharp Runtime

```sh
    yarn add sharp
    npm install --include=optional sharp
    //or
    yarn add sharp --ignore-engines
```

## Run Server

```sh
yarn dev
```

## Build Server

```sh
yarn build
```

## Docker

The official image is published to Docker Hub as
`wppconnect/wppconnect-server`.

Run the production compose example:

```sh
SECRET_KEY=change-me docker compose up -d
curl http://localhost:21465/healthz
```

Use `WPP_SERVER_TAG` to pin a specific image tag:

```sh
WPP_SERVER_TAG=2.10.0 SECRET_KEY=change-me docker compose up -d
```

The container accepts these Docker-friendly environment variables while keeping
the same defaults as `src/config.ts`: `PORT`, `HOST`, `SECRET_KEY`,
`WEBHOOK_URL`, `TOKEN_STORE_TYPE`, `CUSTOM_USER_DATA_DIR`, `MAX_LISTENERS`,
`REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_DB`, `REDIS_PREFIX`,
`MONGODB_DATABASE`, `MONGODB_COLLECTION`, `MONGODB_USER`, `MONGODB_PASSWORD`,
`MONGODB_HOST`, `MONGODB_PORT`, and `MONGO_URL_REMOTE`.

The optional managed Media API adapter uses `MEDIA_API_URL`, `MEDIA_API_KEY`,
and `MEDIA_API_TIMEOUT_MS` (default `30000`). When configured, authenticated
server clients can create conversion or transcription jobs through
`POST /api/:session/media/conversions` and
`POST /api/:session/media/transcriptions`, then poll
`GET /api/:session/media/jobs/:jobId`. Creation accepts the same JSON URL or
multipart `file` contract as the compatible Media API and forwards the required
`Idempotency-Key` without exposing the upstream API key.

Docker image publishing is handled by GitHub Actions:

- pushes to `main` publish the moving `main` tag and a `sha-*` tag;
- pushes to `develop` publish the moving `develop` tag and a `sha-*` tag;
- tags like `v2.10.0` publish `2.10.0`, `2.10`, `2`, the git ref tag,
  `sha-*`, and `latest`;
- pull requests build the image without pushing it.

The Docker Hub organization must contain a public repository named
`wppconnect-server`, and this GitHub repository must have the secrets
`DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN`.

---

# Configuration

This server use config.ts file to define some options, default values are:

```javascript
{
  /* secret key to generate access token */
  secretKey: 'THISISMYSECURETOKEN',
  host: 'http://localhost',
  port: '21465',
  // Device name for show on whatsapp device
  deviceName: 'WppConnect',
  poweredBy: 'WPPConnect-Server',
  // starts all sessions when starting the server.
  startAllSession: true,
  tokenStoreType: 'file',
  // sets the maximum global listeners. 0 = infinity.
  maxListeners: 15,
  // create userDataDir for each puppeteer instance for working with Multi Device
  customUserDataDir: './userDataDir/',
  webhook: {
    // set default webhook
    url: null,
    // automatically downloads files to upload to the webhook
    autoDownload: true,
    // enable upload to s3
    uploadS3: false,
    // set default bucket name on aws s3
    awsBucketName: null,
    //marks messages as read when the webhook returns ok
    readMessage: true,
    //sends all unread messages to the webhook when the server starts
    allUnreadOnStart: false,
    // send all events of message status (read, sent, etc)
    listenAcks: true,
    // send all events of contacts online or offline for webook and socket
    onPresenceChanged: true,
    // send all events of groups participants changed for webook and socket
    onParticipantsChanged: true,
    // send all events of reacted messages for webook and socket
    onReactionMessage: true,
    // send all events of poll messages for webook and socket
    onPollResponse: true,
    // send all events of revoked messages for webook and socket
    onRevokedMessage: true,
    // send all events of labels for webook and socket
    onLabelUpdated: true,
    // 'event', 'from' or 'type' to ignore and not send to webhook
    ignore: [],
  },
  websocket: {
    // Just leave one active, here or on webhook.autoDownload
    autoDownload: false,
    // Just leave one active, here or on webhook.uploadS3, to avoid duplication in S3
    uploadS3: false,
  },
  // send data to chatwoot
  chatwoot: {
    sendQrCode: true,
    sendStatus: true,
  },
  //functionality that archives conversations, runs when the server starts
  archive: {
    enable: false,
    //maximum interval between filings.
    waitTime: 10,
    daysToArchive: 45,
  },
  log: {
    level: 'silly', // Before open a issue, change level to silly and retry an action
    logger: ['console', 'file'],
  },
  // create options for using on wppconnect-lib
  createOptions: {
    browserArgs: [
      '--disable-web-security',
      '--no-sandbox',
      '--disable-web-security',
      '--aggressive-cache-discard',
      '--disable-cache',
      '--disable-application-cache',
      '--disable-offline-load-stale-cache',
      '--disk-cache-size=0',
      '--disable-background-networking',
      '--disable-default-apps',
      '--disable-extensions',
      '--disable-sync',
      '--disable-translate',
      '--hide-scrollbars',
      '--metrics-recording-only',
      '--mute-audio',
      '--no-first-run',
      '--safebrowsing-disable-auto-update',
      '--ignore-certificate-errors',
      '--ignore-ssl-errors',
      '--ignore-certificate-errors-spki-list',
      '--disable-features=LeakyPeeker' // Disable the browser's sleep mode when idle, preventing the browser from going into sleep mode, this is useful for WhatsApp not to be in economy mode in the background, avoiding possible crashes
    ],
  },
  mapper: {
    enable: false,
    prefix: 'tagone-',
  },
  // Configurations for connect with database
  db: {
    mongodbDatabase: 'tokens',
    mongodbCollection: '',
    mongodbUser: '',
    mongodbPassword: '',
    mongodbHost: '',
    mongoIsRemote: true,
    mongoURLRemote: '',
    mongodbPort: 27017,
    redisHost: 'localhost',
    redisPort: 6379,
    redisPassword: '',
    redisDb: 0,
    redisPrefix: 'docker',
  },
  // Your configurations to upload on AWS
  aws_s3: {
    region: 'sa-east-1',
    access_key_id: '',
    secret_key: '',
    // If you already have a bucket created that will be used. Will be stored: you-default-bucket/{session}/{filename}
    defaultBucketName: ''
  },
}
```

# Secret Key

Your `secretKey` is inside the `config.ts` file. You must change the default value to one that only you know.

<!-- ![Peek 2021-03-25 09-33](https://user-images.githubusercontent.com/40338524/112473515-3b310a80-8d4d-11eb-94bb-ff409c91d9b8.gif) -->

# Generate Token

To generate an access token, you must use your `SECRET_KEY`.

Using the route:

```shell
  curl -X POST --location "http://localhost:21465/api/mySession/THISISMYSECURETOKEN/generate-token"
```

### Response:

```json
{
  "status": "Success",
  "session": "mySession",
  "token": "$2b$10$duQ5YYV6fojn5qFiFv.aEuY32_SnHgcmxdfxohnjG4EHJ5_Z6QWhe",
  "full": "wppconnect:$2b$10$duQ5YYV6fojn5qFiFv.aEuY32_SnHgcmxdfxohnjG4EHJ5_Z6QWhe"
}
```

# Using Token

Save the value of the "full" response. Then use this value to call the routes.

# Examples

```sh
#Starting Session
# /api/:session/start-session

curl -X POST --location "http://localhost:21465/api/mySession/start-session" \
    -H "Accept: application/json" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer \$2b\$10\$JcHd97xHN6ErBuiLd7Yu4.r6McvOvEZZDQTQwev2MRK_zQObUZZ9C"
```

```sh
# Get QR Code for any provider
# /api/:session/status-session
# Poll until status is QRCODE; qrcode is a data URL and urlcode is the raw payload.

curl -X GET --location "http://localhost:21465/api/mySession/status-session" \
    -H "Accept: application/json" \
    -H "Authorization: Bearer \$2b\$10\$JcHd97xHN6ErBuiLd7Yu4.r6McvOvEZZDQTQwev2MRK_zQObUZZ9C"
```

```sh
#Send Message
# /api/:session/send-message
curl -X POST --location "http://localhost:21465/api/mySession/send-message" \
    -H "Content-Type: application/json; charset=utf-8" \
    -H "Accept: application/json" \
    -H "Authorization: Bearer \$2b\$10\$8aQFQxnWREtBEMZK_iHMe.u7NeoNkjL7s6NYai_83Pb31Ycss6Igm" \
    -d "{
          \"phone\": \"5511900000000\",
          \"message\": \"*Abner* Rodrigues\"
        }"
```

See the `routes` file for all the routes. [here](/src/routes/index.js) and HTTP [file](/requests.http).

# Swagger UI

Swagger ui can be found at `/api-docs`
