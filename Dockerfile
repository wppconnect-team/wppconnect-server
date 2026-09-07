FROM node:22.22.2-alpine AS manager
ARG MANAGER_VERSION=2.0.0
ARG MANAGER_SHA256=e5cd47cbd56c5eca53751947cf5799f75aa5a4b4d7c2bf189471374a48b9ff7f
RUN wget -q -O /tmp/manager.tar.gz "https://github.com/wppconnect-team/wppconnect-manager/releases/download/v${MANAGER_VERSION}/wppconnect-manager.tar.gz" && \
    echo "${MANAGER_SHA256}  /tmp/manager.tar.gz" | sha256sum -c - && \
    mkdir /manager && tar -xzf /tmp/manager.tar.gz -C /manager

FROM node:22.22.2-alpine AS base
WORKDIR /usr/src/wpp-server
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Install build dependencies and runtime libraries for sharp
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

# To make sure yarn 4 uses node-modules linker
COPY .yarnrc.yml ./

# Copy only package.json to leverage Docker cache
COPY package.json ./
COPY yarn.lock ./

# Enable corepack and prepare yarn 4.14.1
RUN corepack enable && \
    corepack prepare yarn@4.14.1 --activate

# Install dependencies with immutable lockfile
RUN yarn install --immutable

FROM base AS build
WORKDIR /usr/src/wpp-server
COPY . .
RUN yarn install
RUN yarn build

FROM build AS runtime
WORKDIR /usr/src/wpp-server/

# Install runtime dependencies (chromium and vips libraries)
RUN apk add --no-cache \
    chromium \
    vips \
    fftw

EXPOSE 21465
COPY --from=manager /manager ./manager
ENV MANAGER_ENABLED=true
ENTRYPOINT ["node", "dist/server.js"]
