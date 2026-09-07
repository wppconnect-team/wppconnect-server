# WPPConnect Team

## _WPPConnect Server_

### WPPConnect Manager

The Docker image includes [WPPConnect Manager](https://github.com/wppconnect-team/wppconnect-manager) at **http://localhost:21465/manager/**: server profiles, session management and QR pairing, chat, contacts, groups and media, with Portuguese/English and light/dark themes.

Use `SECRET_KEY` for administration, or a session name/token for restricted access. Credentials remain in browser memory. Set `MANAGER_ENABLED=false` to disable serving the UI. The image pins and verifies the Manager bundle during build.

See [configuration, API, authenticated events and rollback](docs/manager.md). Existing APIs and legacy sockets remain compatible. Live WhatsApp send/receive requires separate validation with an authorized account.

![WPPConnect-SERVER](https://i.imgur.com/y1ts6RR.png)

[![npm version](https://img.shields.io/npm/v/@wppconnect/server.svg?color=green)](https://www.npmjs.com/package/@wppconnect/server)
[![Downloads](https://img.shields.io/npm/dm/@wppconnect/server.svg)](https://www.npmjs.com/package/@wppconnect/server)
[![Docker Pulls](https://img.shields.io/docker/pulls/wppconnect/wppconnect-server?logo=docker)](https://hub.docker.com/r/wppconnect/wppconnect-server)
[![Docker Image Version](https://img.shields.io/docker/v/wppconnect/wppconnect-server?sort=semver&logo=docker)](https://hub.docker.com/r/wppconnect/wppconnect-server/tags)
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

## Libraries Used

- WPPConnect
- Axios
- Bcrypt
- Cors
- Dotenv
- Express
- Nodemon
- SocketIO
- S3

## Docker (recommended)

The official image is available on
[Docker Hub](https://hub.docker.com/r/wppconnect/wppconnect-server). It includes
Node.js, Chromium, and the native dependencies required by WPPConnect.

```sh
docker run -d \
  --name wppconnect-server \
  --restart unless-stopped \
  -p 21465:21465 \
  -e SECRET_KEY=change-me \
  -v wppconnect_tokens:/usr/src/wpp-server/tokens \
  -v wppconnect_user_data:/usr/src/wpp-server/userDataDir \
  wppconnect/wppconnect-server:latest
```

For Docker Compose, clone the repository, copy the example and edit `SECRET_KEY`:

```sh
cp .env.example .env
# Edit .env and replace SECRET_KEY. In PowerShell, use Copy-Item .env.example .env.
docker compose up -d
docker compose ps
curl http://localhost:21465/healthz
```

Set `WPP_SERVER_TAG` to pin a release instead of following `latest`:

```sh
WPP_SERVER_TAG=2.10.18 docker compose up -d
```

Release tags follow the GitHub and npm version: `vX.Y.Z`, `X.Y.Z`, `X.Y`,
`X`, and `latest`. The `main`, `develop`, and immutable `sha-*` tags are also
available. See all tags on
[Docker Hub](https://hub.docker.com/r/wppconnect/wppconnect-server/tags).

The container accepts `PORT`, `HOST`, `SECRET_KEY`, `WEBHOOK_URL`,
`TOKEN_STORE_TYPE`, `CUSTOM_USER_DATA_DIR`, `MAX_LISTENERS`, and the Redis and
MongoDB variables listed in the [Configuration](#configuration) section. The
Compose setup persists tokens, Chromium session data, uploads, received images,
and logs in named volumes. Change the default secret before exposing the API.

To upgrade the Compose deployment:

```sh
docker compose pull
docker compose up -d
```

## Installation from source

Install the dependencies, copy `.env.example` to `.env`, and edit `SECRET_KEY`. Node loads `.env` from the directory where you start the server; existing environment variables take precedence. The file is optional.

```sh
yarn install --immutable
cp .env.example .env
# PowerShell: Copy-Item .env.example .env
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

---

# Configuration

Configuration defaults remain in [src/config.ts](src/config.ts). Supported environment variables are documented in [.env.example](.env.example); the file is also included in the npm package.

The default configuration resolves values in this order: existing process environment, optional `.env` in the working directory, then built-in defaults. Restart the process or recreate the container after changing a value. Variables are read at runtime, so changing them does not require rebuilding the image.

| Area | Variables |
| --- | --- |
| Server | `SECRET_KEY`, `HOST`, `PORT`, `WEBHOOK_URL` |
| Sessions | `TOKEN_STORE_TYPE`, `CUSTOM_USER_DATA_DIR`, `MAX_LISTENERS` |
| Manager | `MANAGER_ENABLED`, `MANAGER_DIST` |
| Redis | `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_DB`, `REDIS_PREFIX` |
| MongoDB | `MONGO_URL_REMOTE`, `MONGODB_DATABASE`, `MONGODB_COLLECTION`, `MONGODB_USER`, `MONGODB_PASSWORD`, `MONGODB_HOST`, `MONGODB_PORT` |
| Compose image | `WPP_SERVER_TAG` (used by Compose, not the Node server) |

For Node, both `yarn dev` and the compiled `yarn start` load the optional file automatically. For example, after setting `PORT=21470` in `.env`, the server listens on port 21470. `HOST` supplies the advertised URL; it does not restrict the listener address.

Compose reads `.env` for interpolation and explicitly forwards the supported server variables. Setting `PORT=21470` changes both the container listener and the published host port; setting `MANAGER_ENABLED=false` disables `/manager/` while the API remains available. You can select another file with `docker compose --env-file ./server.env up -d`. Variables defined by the shell take precedence over values in the file.

For plain Docker, pass variables with `-e` or `--env-file`:

```sh
docker run --rm --env-file .env -p 21465:21465 wppconnect/wppconnect-server:2.10.18
```

If `PORT` differs from 21465, adjust both sides of `-p` accordingly. Use the persistent volumes shown in the Docker section for regular deployments. Private `.env` files are excluded from image builds and npm packages; `.env.example` remains available. Docker does not need a private file baked into the image.

Paths in containers refer to the container filesystem. Keep `CUSTOM_USER_DATA_DIR` inside the mounted session-data directory (and retain its trailing slash), or change the volume mapping too. `MANAGER_DIST` points to an existing static bundle; leaving it empty uses the default location. The official Docker image supplies that bundle.

Redis and MongoDB services must be provisioned separately; the included Compose file starts only WPPConnect. The default MongoDB remote mode uses `MONGO_URL_REMOTE`. Structured MongoDB host/user/port settings apply when `db.mongoIsRemote` is disabled in the advanced configuration.

Advanced options without an environment mapping, such as browser arguments and webhook event toggles, remain in `src/config.ts` or can be supplied to `initServer(...)` when embedding the server. Changing TypeScript configuration requires rebuilding the compiled server; environment-only changes do not.

# Secret Key

Set `SECRET_KEY` in `.env` or the deployment environment to a private, randomly generated value. The legacy default is retained for compatibility; replace it before exposing the API. Never commit your private `.env`.

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
#Get QrCode
# /api/:session/start-session
# when the session is starting if the method is called again it will return the base64 qrCode

curl -X POST --location "http://localhost:21465/api/mySession/start-session" \
    -H "Accept: application/json" \
    -H "Content-Type: application/json" \
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
