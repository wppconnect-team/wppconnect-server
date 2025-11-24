FROM node:22.21.1-alpine AS base
WORKDIR /usr/src/wpp-server
ENV NODE_ENV=production
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
COPY package.json ./
RUN corepack enable && \
    corepack prepare yarn@4.12.0 --activate
RUN yarn install && \
    yarn cache clean

FROM base AS build
WORKDIR /usr/src/wpp-server
COPY . .
RUN yarn install
RUN yarn build

FROM base
WORKDIR /usr/src/wpp-server/
RUN apk add --no-cache chromium
RUN yarn cache clean
COPY . .
COPY --from=build /usr/src/wpp-server/ /usr/src/wpp-server/
EXPOSE 21465
ENTRYPOINT ["node", "dist/server.js"]
