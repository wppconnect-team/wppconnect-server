import { ServerOptions } from './types/ServerOptions';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Default configuration
const defaultConfig = {
  secretKey: process.env.SECRET_KEY || 'THISISMYSECURETOKEN',
  host: process.env.HOST || 'http://localhost',
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 21465,
  deviceName: process.env.DEVICE_NAME || 'WppConnect',
  poweredBy: process.env.POWERED_BY || 'WPPConnect-Server',
  startAllSession: process.env.START_ALL_SESSION === 'true',
  tokenStoreType: process.env.TOKEN_STORE_TYPE || 'file',
  maxListeners: process.env.MAX_LISTENERS ? parseInt(process.env.MAX_LISTENERS, 10) : 15,
  customUserDataDir: process.env.CUSTOM_USER_DATA_DIR || './userDataDir/',
  webhook: {
    url: process.env.WEBHOOK_URL || '',
    autoDownload: process.env.WEBHOOK_AUTO_DOWNLOAD === 'true',
    uploadS3: process.env.WEBHOOK_UPLOAD_S3 === 'true',
    readMessage: process.env.WEBHOOK_READ_MESSAGE !== 'false',
    allUnreadOnStart: process.env.WEBHOOK_ALL_UNREAD_ON_START === 'true',
    listenAcks: process.env.WEBHOOK_LISTEN_ACKS !== 'false',
    onPresenceChanged: process.env.WEBHOOK_ON_PRESENCE_CHANGED !== 'false',
    onParticipantsChanged: process.env.WEBHOOK_ON_PARTICIPANTS_CHANGED !== 'false',
    onReactionMessage: process.env.WEBHOOK_ON_REACTION_MESSAGE !== 'false',
    onPollResponse: process.env.WEBHOOK_ON_POLL_RESPONSE !== 'false',
    onRevokedMessage: process.env.WEBHOOK_ON_REVOKED_MESSAGE !== 'false',
    onLabelUpdated: process.env.WEBHOOK_ON_LABEL_UPDATED !== 'false',
    onSelfMessage: process.env.WEBHOOK_ON_SELF_MESSAGE === 'true',
    ignore: process.env.WEBHOOK_IGNORE ? process.env.WEBHOOK_IGNORE.split(',') : ['status@broadcast'],
  },
  websocket: {
    autoDownload: process.env.WEBSOCKET_AUTO_DOWNLOAD === 'true',
    uploadS3: process.env.WEBSOCKET_UPLOAD_S3 === 'true',
  },
  chatwoot: {
    sendQrCode: process.env.CHATWOOT_SEND_QR_CODE !== 'false',
    sendStatus: process.env.CHATWOOT_SEND_STATUS !== 'false',
  },
  archive: {
    enable: process.env.ARCHIVE_ENABLE === 'true',
    waitTime: process.env.ARCHIVE_WAIT_TIME ? parseInt(process.env.ARCHIVE_WAIT_TIME, 10) : 10,
    daysToArchive: process.env.ARCHIVE_DAYS_TO_ARCHIVE ? parseInt(process.env.ARCHIVE_DAYS_TO_ARCHIVE, 10) : 45,
  },
  log: {
    level: process.env.LOG_LEVEL || 'silly',
    logger: process.env.LOG_LOGGER ? process.env.LOG_LOGGER.split(',') : ['console', 'file'],
  },
  createOptions: {
    browserArgs: process.env.BROWSER_ARGS ? process.env.BROWSER_ARGS.split(',') : [
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
    linkPreviewApiServers: process.env.LINK_PREVIEW_API_SERVERS ? process.env.LINK_PREVIEW_API_SERVERS.split(',') : null,
  } as any,
  mapper: {
    enable: process.env.MAPPER_ENABLE === 'true',
    prefix: process.env.MAPPER_PREFIX || 'tagone-',
  },
  db: {
    mongodbDatabase: process.env.MONGODB_DATABASE || 'tokens',
    mongodbCollection: process.env.MONGODB_COLLECTION || '',
    mongodbUser: process.env.MONGODB_USER || '',
    mongodbPassword: process.env.MONGODB_PASSWORD || '',
    mongodbHost: process.env.MONGODB_HOST || '',
    mongoIsRemote: process.env.MONGODB_IS_REMOTE === 'true',
    mongoURLRemote: process.env.MONGODB_URL_REMOTE || '',
    mongodbPort: process.env.MONGODB_PORT ? parseInt(process.env.MONGODB_PORT, 10) : 27017,
    redisHost: process.env.REDIS_HOST || 'localhost',
    redisPort: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
    redisPassword: process.env.REDIS_PASSWORD || '',
    redisDb: process.env.REDIS_DB || '0',
    redisPrefix: process.env.REDIS_PREFIX || 'docker',
  },
  aws_s3: {
    region: process.env.AWS_S3_REGION || 'sa-east-1',
    access_key_id: process.env.AWS_S3_ACCESS_KEY_ID || null,
    secret_key: process.env.AWS_S3_SECRET_KEY || null,
    defaultBucketName: process.env.AWS_S3_DEFAULT_BUCKET_NAME || null,
    endpoint: process.env.AWS_S3_ENDPOINT || null,
    forcePathStyle: process.env.AWS_S3_FORCE_PATH_STYLE === 'true' ? true : null,
  },
};

// Paths to look for config.json
const configPaths = [
  '/config/config.json', // Docker volume mount path (primary location for Docker)
  path.join(process.cwd(), 'config.json'), // Root of the project
  path.join(__dirname, '..', 'config.json') // One level up from src directory
];

let configFromFile = {};
let loadedConfigPath = '';

// Try to load config from one of the paths
for (const configPath of configPaths) {
  try {
    if (fs.existsSync(configPath)) {
      const fileContent = fs.readFileSync(configPath, 'utf8');
      configFromFile = JSON.parse(fileContent);
      loadedConfigPath = configPath;
      console.log(`Loaded configuration from ${configPath}`);
      break;
    }
  } catch (error) {
    console.error(`Error loading config from ${configPath}:`, error);
  }
}

// If no config file was found, log a message
if (!loadedConfigPath) {
  console.log('No external configuration file found. Using default configuration with environment variables.');
}

// Merge default config with config from file
// Using type assertion to handle additional properties not in the interface
const config = { ...defaultConfig, ...configFromFile } as unknown as ServerOptions;

export default config;
