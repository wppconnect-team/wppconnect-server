[English](./README.md) | **Português (Brasil)**

<p align="center">
  <a href="https://wppconnect.io/">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://wppconnect-team.github.io/brand/v2/wppconnect-dark.png" />
      <img src="https://wppconnect-team.github.io/brand/v2/wppconnect-light.png" alt="WPPConnect" width="220" height="121" />
    </picture>
  </a>
</p>

# WPPConnect Server

Execute uma API REST para sessões, mensagens e webhooks do WhatsApp.

Um projeto do ecossistema WPPConnect, mantido pela WPPConnect Team.

[Primeiros passos](#primeiros-passos) | [Documentação](#documentação) | [Como contribuir](#como-contribuir) | [Apoie a WPPConnect](#apoie-o-projeto)

[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue)](./LICENSE) [![npm version](https://img.shields.io/npm/v/@wppconnect/server)](https://www.npmjs.com/package/@wppconnect/server) [![CI](https://github.com/wppconnect-team/wppconnect-server/actions/workflows/build.yml/badge.svg?branch=main)](https://github.com/wppconnect-team/wppconnect-server/actions/workflows/build.yml) [![Open Collective](https://img.shields.io/badge/Open%20Collective-WPPConnect-blue)](https://opencollective.com/wppconnect)

## Visão geral

Para integradores que precisam de um serviço HTTP sobre a biblioteca WPPConnect em Node.js. A imagem Docker também inclui o WPPConnect Manager para administrar sessões e conversas.

## Funcionalidades

- Pareamento de sessões, mensagens de texto/mídia, contatos, grupos e operações de produtos.
- Tokens de sessão, webhooks, eventos autenticados do Manager e Swagger UI.
- Volumes Docker persistentes para credenciais, dados do navegador, mídia e logs.

## Primeiros passos

Use Docker com Compose ou, para desenvolver pelos fontes, Node.js **22.22.2**, Corepack/Yarn **4.14.1**, Chromium e dependências nativas. Na raiz do repositório:

```sh
cp .env.example .env
```

No PowerShell use `Copy-Item .env.example .env`. Edite `.env` e defina um `SECRET_KEY` privado e aleatório antes de iniciar.

```sh
docker compose up -d
docker compose ps
curl -fsS http://localhost:21465/healthz
```

Abra `http://localhost:21465/manager/` e entre com o `SECRET_KEY` configurado para criar/parear uma sessão, ou use a API em `http://localhost:21465/api-docs`. O acesso restrito do Manager usa nome e token de sessão. Para desenvolver pelos fontes: `corepack enable`, `yarn install --immutable`, `yarn build` e `yarn start`.

## Configuração

[.env.example](.env.example) lista as variáveis de ambiente aceitas; [src/config.ts](src/config.ts) contém opções avançadas. O ambiente do processo prevalece sobre o `.env` opcional do diretório atual e os valores padrão. Reinicie após mudanças. Autorize os destinos exatos de webhook/Chatwoot em `WEBHOOK_ALLOWED_URLS` e `CHATWOOT_ALLOWED_URLS`. A listagem e o backup de sessões usam POST com `x-secret-key`; os GETs antigos com segredo na URL retornam 410. `MANAGER_ENABLED=false` desativa a interface. Preserve os volumes nomeados e fixe `WPP_SERVER_TAG` para instalações reproduzíveis.

## Documentação

- [Referência Swagger](https://wppconnect.io/swagger/wppconnect-server/)
- [Configuração, acesso e rollback do Manager](./docs/manager.md)
- [Exemplos de requisições HTTP](./requests.http)
- [Coleção Postman](https://documenter.getpostman.com/view/9139457/TzshF4jQ)
- [Detalhes técnicos e agradecimentos preservados](documentation/readme-reference.md)

## Ecossistema WPPConnect

| Projeto | Finalidade | Quando usar |
| --- | --- | --- |
| [WPPConnect](https://github.com/wppconnect-team/wppconnect) | Controle o WhatsApp Web em aplicações Node.js. | Incorporar automação a uma aplicação Node.js. |
| [WPPConnect Manager](https://github.com/wppconnect-team/wppconnect-manager) | Gerencie sessões e conversas do WPPConnect Server em uma aplicação web auto-hospedada. | Operar sessões e conversas de um Server compatível pela interface. |
| [WPPConnect Server CLI](https://github.com/wppconnect-team/server-cli) | Inicie o WPPConnect Server pelo comando `wppserver`. | Iniciar o Server Node.js pelo terminal. |
| [WPPConnect Server Go](https://github.com/wppconnect-team/wppconnect-server-go) | Execute uma API HTTP do WhatsApp sem navegador, feita com Go e whatsmeow. | Avaliar uma API HTTP Go e a cobertura documentada de migração. |

## Apoie o projeto

A WPPConnect é mantida por uma comunidade de código aberto. Seu apoio ajuda a financiar a manutenção, a infraestrutura, a documentação e o trabalho das pessoas que desenvolvem o ecossistema.

Se a WPPConnect ajuda seu projeto ou sua empresa, considere fazer uma contribuição pontual ou apoiar de forma recorrente.

**[Apoie a WPPConnect no Open Collective](https://opencollective.com/wppconnect)**

As contribuições são voluntárias. Consulte a página oficial para acompanhar as informações financeiras atuais. Você também pode ajudar com código, testes, documentação, traduções e relatos de problemas bem descritos.

Beneficiários oficiais adicionais em [.github/FUNDING.yml](.github/FUNDING.yml): [joaosouz4dev](https://github.com/sponsors/joaosouz4dev), [manfe](https://github.com/sponsors/manfe).

## Como contribuir

Contribuições de código, testes, exemplos, documentação e traduções são bem-vindas. Para mudanças maiores, discuta a proposta em uma issue primeiro. Ao relatar um problema, informe as versões do projeto/runtime, uma reprodução mínima e logs sem dados sensíveis. Atualize `README.md` e `README.pt-BR.md` na mesma alteração quando mudar instalação, configuração, funcionalidades, exemplos, licença ou arrecadação.

Após instalar as dependências de desenvolvimento, use as verificações pertinentes à sua alteração:

```sh
yarn build
yarn lint
yarn test
```

Exemplos e testes que dependem de conta exigem validação separada com uma conta de teste autorizada. Nunca anexe credenciais ou arquivos de sessão a uma issue.

## Comunidade e suporte

Use as [issues do repositório](https://github.com/wppconnect-team/wppconnect-server/issues) para bugs reproduzíveis e propostas de funcionalidades. Para dúvidas de uso, participe pelos canais oficiais:

- [Discord](https://discord.gg/JU5JGGKGNG)
- [Telegram](https://t.me/wppconnect)
- [YouTube](https://www.youtube.com/c/wppconnect)

Este projeto é independente e não é afiliado nem endossado pelo WhatsApp ou pela Meta. Siga os termos aplicáveis e obtenha autorização para operações de conta e mensagens.

## Licença

[Apache License 2.0 (Apache-2.0)](./LICENSE).

Copyright 2021 WPPConnect Team.

O documento jurídico original e os avisos de autoria existentes são preservados. Componentes de terceiros mantêm seus próprios termos.
