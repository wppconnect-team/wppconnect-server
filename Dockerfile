FROM node:22.21.1-slim AS base
WORKDIR /usr/src/wpp-server
ENV NODE_ENV=production PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
COPY package.json ./

# Install system dependencies for building sharp
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    libvips-dev \
    libvips42 \
    build-essential \
    python3 \
    && rm -rf /var/lib/apt/lists/*

# Install production dependencies
RUN yarn install --production --pure-lockfile && \
    yarn cache clean

FROM base AS build
WORKDIR /usr/src/wpp-server
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
COPY package.json ./

# Install all dependencies (including dev dependencies for build)
RUN yarn install --production=false --pure-lockfile
RUN yarn cache clean

# Copy source code and build
COPY . .
RUN yarn build

FROM node:22.21.1-slim
WORKDIR /usr/src/wpp-server/

# Install Chromium and runtime dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    chromium \
    libvips42 \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# Copy package.json first
COPY package.json ./

# Install ONLY production dependencies + @babel/runtime
# This is critical because babel transpiled code needs @babel/runtime at runtime
RUN yarn install --production --pure-lockfile && \
    yarn add @babel/runtime && \
    yarn cache clean

# Copy built application from build stage
COPY --from=build /usr/src/wpp-server/dist ./dist

EXPOSE 21465

# Set environment variables
ENV NODE_ENV=production
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

ENTRYPOINT ["node", "dist/server.js"]
