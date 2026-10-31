**English** | [Português (Brasil)](./README.pt-BR.md)

<p align="center">
  <a href="https://wppconnect.io/">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://wppconnect-team.github.io/brand/wppconnect-dark.png" />
      <img src="https://wppconnect-team.github.io/brand/wppconnect-light.png" alt="WPPConnect" width="220" height="121" />
    </picture>
  </a>
</p>

# WPPConnect Server

Run a REST API for WhatsApp sessions, messages and webhooks.

A project in the WPPConnect ecosystem, maintained by WPPConnect Team.

[Getting started](#getting-started) | [Documentation](#documentation) | [Contributing](#contributing) | [Support WPPConnect](#support-the-project)

[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue)](./LICENSE) [![npm version](https://img.shields.io/npm/v/@wppconnect/server)](https://www.npmjs.com/package/@wppconnect/server) [![CI](https://github.com/wppconnect-team/wppconnect-server/actions/workflows/build.yml/badge.svg?branch=main)](https://github.com/wppconnect-team/wppconnect-server/actions/workflows/build.yml) [![Open Collective](https://img.shields.io/badge/Open%20Collective-WPPConnect-blue)](https://opencollective.com/wppconnect)

## Overview

For integrators who want an HTTP service around the WPPConnect Node.js library. The Docker image also includes WPPConnect Manager for session and chat administration.

## Features

- Session pairing, text/media messaging, contacts, groups and product operations.
- Session tokens, webhooks, authenticated Manager events and Swagger UI.
- Persistent Docker volumes for credentials, browser data, media and logs.

## Getting started

Use Docker with Compose, or Node.js **22.22.2**, Corepack/Yarn **4.14.1**, Chromium and native dependencies for source development. From the repository root:

```sh
cp .env.example .env
```

In PowerShell use `Copy-Item .env.example .env`. Edit `.env` and set a private random `SECRET_KEY` before starting.

```sh
docker compose up -d
docker compose ps
curl -fsS http://localhost:21465/healthz
```

Open `http://localhost:21465/manager/` and sign in with the configured `SECRET_KEY` to create/pair a session, or use the API at `http://localhost:21465/api-docs`. Session-restricted Manager access uses a session name and token. For source development: `corepack enable`, `yarn install --immutable`, `yarn build`, then `yarn start`.

## Configuration

[.env.example](.env.example) lists supported environment variables; [src/config.ts](src/config.ts) contains advanced options. Process environment overrides the optional working-directory `.env`, then built-in defaults apply. Restart after changes. Set exact webhook/Chatwoot destinations in `WEBHOOK_ALLOWED_URLS` and `CHATWOOT_ALLOWED_URLS`. Session inventory and backups use POST with `x-secret-key`; legacy GET URLs containing secrets return 410. `MANAGER_ENABLED=false` disables the UI. Preserve the named volumes and pin `WPP_SERVER_TAG` for repeatable deployments.

## Documentation

- [Swagger reference](https://wppconnect.io/swagger/wppconnect-server/)
- [Manager configuration, access and rollback](./docs/manager.md)
- [HTTP request examples](./requests.http)
- [Postman collection](https://documenter.getpostman.com/view/9139457/TzshF4jQ)
- [Retained technical details and acknowledgments](documentation/readme-reference.md)

## WPPConnect ecosystem

| Project | Purpose | When to use it |
| --- | --- | --- |
| [WPPConnect](https://github.com/wppconnect-team/wppconnect) | Control WhatsApp Web from Node.js applications. | Embed automation in a Node.js application. |
| [WPPConnect Manager](https://github.com/wppconnect-team/wppconnect-manager) | Manage WPPConnect Server sessions and conversations in a self-hosted web workspace. | Operate compatible Server sessions and chats through a UI. |
| [WPPConnect Server CLI](https://github.com/wppconnect-team/server-cli) | Start WPPConnect Server from the `wppserver` command. | Launch the Node.js Server from a terminal. |
| [WPPConnect Server Go](https://github.com/wppconnect-team/wppconnect-server-go) | Run a browser-free WhatsApp HTTP API built with Go and whatsmeow. | Evaluate a Go HTTP API and documented migration coverage. |

## Support the project

WPPConnect is maintained by an open-source community. Your support helps fund maintenance, infrastructure, documentation, and the people working on the ecosystem.

If WPPConnect helps your project or business, consider making a one-time contribution or becoming a recurring supporter.

**[Support WPPConnect on Open Collective](https://opencollective.com/wppconnect)**

Contributions are voluntary. See the official page for current financial information. You can also help with code, tests, documentation, translations and well-described issue reports.

Additional official beneficiaries in [.github/FUNDING.yml](.github/FUNDING.yml): [joaosouz4dev](https://github.com/sponsors/joaosouz4dev), [manfe](https://github.com/sponsors/manfe).

## Contributing

Contributions of code, tests, examples, documentation and translations are welcome. For larger changes, discuss the approach in an issue first. Include the project/runtime versions, a minimal reproduction and sanitized logs when reporting a problem. Update both `README.md` and `README.pt-BR.md` in the same change when installation, configuration, features, examples, licensing or funding changes.

After installing the development dependencies, use the repository checks relevant to your change:

```sh
yarn build
yarn lint
yarn test
```

Account-dependent examples and tests require separate validation with an authorized test account. Never attach credentials or session files to an issue.

## Community and support

Use [repository issues](https://github.com/wppconnect-team/wppconnect-server/issues) for reproducible bugs and feature proposals. For usage questions, join the community through the official channels:

- [Discord](https://discord.gg/JU5JGGKGNG)
- [Telegram](https://t.me/wppconnect)
- [YouTube](https://www.youtube.com/c/wppconnect)

This project is independent and is not affiliated with or endorsed by WhatsApp or Meta. Follow applicable terms and obtain authorization for account and messaging operations.

## License

[Apache License 2.0 (Apache-2.0)](./LICENSE).

Copyright 2021 WPPConnect Team.

The original legal document and existing copyright notices are preserved. Third-party components retain their own terms.
