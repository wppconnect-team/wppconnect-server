import { ServerOptions } from './types/ServerOptions';

const env = process.env;

function envNumber(name: string, fallback: number): number {
  const value = env[name];
  if (!value) return fallback;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export default {
  secretKey: env.SECRET_KEY || 'THISISMYSECURETOKEN',
  host: env.HOST || 'http://localhost',
  port: env.PORT || '21465',
  deviceName: 'WppConnect',
  poweredBy: 'WPPConnect-Server',
  startAllSession: true,
  tokenStoreType: env.TOKEN_STORE_TYPE || 'file',
  maxListeners: envNumber('MAX_LISTENERS', 15),
  customUserDataDir: env.CUSTOM_USER_DATA_DIR || './userDataDir/',
  webhook: {
    url: env.WEBHOOK_URL || null,
    autoDownload: true,
    uploadS3: false,
    readMessage: true,
    allUnreadOnStart: false,
    listenAcks: true,
    onPresenceChanged: true,
    onParticipantsChanged: true,
    onReactionMessage: true,
    onPollResponse: true,
    onRevokedMessage: true,
    onLabelUpdated: true,
    onSelfMessage: false,
    ignore: ['status@broadcast'],
  },
  websocket: {
    autoDownload: false,
    uploadS3: false,
  },
  chatwoot: {
    sendQrCode: true,
    sendStatus: true,
  },
  archive: {
    enable: false,
    waitTime: 10,
    daysToArchive: 45,
  },
  log: {
    level: 'silly', // Before open a issue, change level to silly and retry a action
    logger: ['console', 'file'],
  },
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
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-translate',
      '--hide-scrollbars',
      '--metrics-recording-only',
      '--mute-audio',
      '--no-first-run',
      '--safebrowsing-disable-auto-update',
      '--ignore-certificate-errors',
      '--ignore-ssl-errors',
      '--ignore-certificate-errors-spki-list',
    ],
    /**
     * Example of configuring the linkPreview generator
     * If you set this to 'null', it will use global servers; however, you have the option to define your own server
     * Clone the repository https://github.com/wppconnect-team/wa-js-api-server and host it on your server with ssl
     *
     * Configure the attribute as follows:
     * linkPreviewApiServers: [ 'https://www.yourserver.com/wa-js-api-server' ]
     */
    linkPreviewApiServers: null,

    /**
     * Set specific whatsapp version
     */
    // whatsappVersion: '2.xxxxx',
  },
  mapper: {
    enable: false,
    prefix: 'tagone-',
  },
  db: {
    mongodbDatabase: env.MONGODB_DATABASE || 'tokens',
    mongodbCollection: env.MONGODB_COLLECTION || '',
    mongodbUser: env.MONGODB_USER || '',
    mongodbPassword: env.MONGODB_PASSWORD || '',
    mongodbHost: env.MONGODB_HOST || '',
    mongoIsRemote: true,
    mongoURLRemote: env.MONGO_URL_REMOTE || '',
    mongodbPort: envNumber('MONGODB_PORT', 27017),
    redisHost: env.REDIS_HOST || 'localhost',
    redisPort: envNumber('REDIS_PORT', 6379),
    redisPassword: env.REDIS_PASSWORD || '',
    redisDb: envNumber('REDIS_DB', 0),
    redisPrefix: env.REDIS_PREFIX || 'docker',
  },
  aws_s3: {
    region: 'sa-east-1' as any,
    access_key_id: null,
    secret_key: null,
    defaultBucketName: null,
    endpoint: null,
    forcePathStyle: null,
  },
} as unknown as ServerOptions;
