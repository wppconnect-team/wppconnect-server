FROM node:22.21.1-alpine AS base
WORKDIR /usr/src/wpp-server
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Install build dependencies for sharp, bcrypt, and other native modules
RUN apk update && \
    apk add --no-cache \
    vips-dev \
    fftw-dev \
    gcc \
    g++ \
    make \
    libc6-compat \
    && rm -rf /var/cache/apk/*

# To make sure yarn 4 uses node-modules linker
COPY .yarnrc.yml ./

# Copy only package.json to leverage Docker cache
COPY package.json ./
COPY yarn.lock ./

# Enable corepack and prepare yarn 4.12.0
RUN corepack enable && \
    corepack prepare yarn@4.12.0 --activate

# Install dependencies
RUN yarn install

FROM base AS build
WORKDIR /usr/src/wpp-server
COPY . .
RUN yarn build

FROM build AS runtime
WORKDIR /usr/src/wpp-server/
RUN apk add --no-cache chromium
EXPOSE 21465
ENTRYPOINT ["node", "dist/server.js"]
