FROM node:22-alpine3.22 AS base

WORKDIR /usr/src/wpp-server

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Install build dependencies
RUN apk update && \
    apk add --no-cache \
    vips \
    vips-dev \
    fftw-dev \
    gcc \
    g++ \
    make \
    libc6-compat \
    pkgconfig \
    python3 \
    && rm -rf /var/cache/apk/*

# Copy Yarn configuration and package files
COPY .yarnrc.yml ./
COPY package.json ./
COPY yarn.lock ./

# === CORREÇÃO: Remover Yarn 1 antigo + Instalar Corepack corretamente ===
RUN rm -f /usr/local/bin/yarn /usr/local/bin/yarnpkg && \
    npm install -g corepack@latest && \
    corepack enable && \
    corepack prepare yarn@4.12.0 --activate

# Install dependencies (agora com Yarn 4 via Corepack)
RUN yarn install --immutable

# Cria pasta
RUN mkdir -p /data && chmod -R 755 /data

# ====================== BUILD STAGE ======================
FROM base AS build

WORKDIR /usr/src/wpp-server

COPY . .

RUN yarn install --immutable
RUN yarn build

# ====================== RUNTIME STAGE ======================
FROM build AS runtime

WORKDIR /usr/src/wpp-server/

# Runtime dependencies only
RUN apk add --no-cache \
    chromium \
    vips \
    fftw

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 21465

ENTRYPOINT ["/entrypoint.sh"]
