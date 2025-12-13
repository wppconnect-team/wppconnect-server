import { ServerOptions } from './types/ServerOptions';

export default {
  secretKey: process.env.SECRET_KEY,
  host: process.env.PUBLIC_URL        ? process.env.PUBLIC_URL  : 'http://localhost',
  port: process.env.PUBLIC_PORT       ? process.env.PUBLIC_PORT : '21465',
  deviceName: process.env.DEVICE_NAME ? process.env.DEVICE_NAME : 'WppConnect',
  poweredBy: process.env.POWERED_BY   ? process.env.POWERED_BY  : 'WPPConnect-Server',
  startAllSession: process.env.START_ALL_SESSION == "false" ? false : true,
  tokenStoreType: process.env.TOKEN_STORE_TYPE ? process.env.TOKEN_STORE_TYPE : 'file',
  maxListeners: process.env.MAX_LISTENERS      ? process.env.MAX_LISTENERS    : 15,
  customUserDataDir: process.env.USER_DATA_DIR ? process.env.USER_DATA_DIR    : './userDataDir/',
  webhook: {
    url: process.env.WEBHOOK_URL ? process.env.WEBHOOK_URL : null,
    autoDownload: process.env.WEBHOOK_AUTO_DOWNLOAD == "false"            ? false : true,
    uploadS3: process.env.WEBHOOK_UPLOAD_S3 == "true"                     ? true  : false,
    readMessage: process.env.READ_MESSAGE == "false"                      ? false : true,
    allUnreadOnStart: process.env.ALL_UNREAD_ON_START == "true"           ? true  : false,
    listenAcks: process.env.LISTEN_ACKS == "false"                        ? false : true,
    onPresenceChanged: process.env.ON_PRESENCE_CHANGED == "false"         ? false : true,
    onParticipantsChanged: process.env.ON_PARTICIPANTS_CHANGED == "false" ? false : true,
    onReactionMessage: process.env.ON_REACTION_MESSAGE == "false"         ? false : true,
    onPollResponse: process.env.ON_POLL_RESPONSE == "false"               ? false : true,
    onRevokedMessage: process.env.ON_REVOKED_MESSAGE == "false"           ? false : true,
    onLabelUpdated: process.env.ON_LABEL_UPDATED == "false"               ? false : true,
    onSelfMessage: process.env.ON_SELF_MESSAGE == "true"                  ? true  : false,
    ignore: process.env.WEBHOOK_IGNORE ? process.env.WEBHOOK_IGNORE.split(",") : ['status@broadcast'],
  },
  websocket: {
    autoDownload: process.env.WEBSOCKET_AUTO_DOWNLOAD == "true" ? true : false,
    uploadS3: process.env.WEBSOCKET_UPLOAD_S3 == "true"         ? true : false,
  },
  chatwoot: {
    sendQrCode: process.env.CHATWOOT_SEND_QR_CODE == "false" ? false : true,
    sendStatus: process.env.CHATWOOT_SEND_STATUS == "false"  ? false : true,
  },
  archive: {
    enable: process.env.ENABLE_ARCHIVE == "true" ? true : false,
    waitTime: process.env.WAIT_TIME               ? process.env.WAIT_TIME : 10,
    daysToArchive:  process.env.DAYS_TO_ARCHIVE   ? process.env.DAYS_TO_ARCHIVE : 45,
  },
  log: {
    level: process.env.LOG_LEVEL   ? process.env.LOG_LEVEL : 'silly',
    logger: process.env.LOG_LOGGER ? process.env.LOG_LOGGER.split(",") : ['console', 'file'],
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
    linkPreviewApiServers: process.env.LINK_PREVIEW_API_SERVERS ? process.env.LINK_PREVIEW_API_SERVERS.split(",") : null,
  },
  mapper: {
    enable: process.env.ENABLE_MAPPER == "true" ? true : false,
    prefix: process.env.MAPPER_PREFIX           ? process.env.MAPPER_PREFIX: 'tagone-',
  },
  db: {
    mongoIsRemote: process.env.MONGODB_IS_REMOTE == "false" ? false : true,
    mongoURLRemote: process.env.MONGODB_URL_REMOTE    ? process.env.MONGODB_URL_REMOTE : '',
    mongodbPort: process.env.MONGODB_PORT             ? process.env.MONGODB_PORT : 27017,
    mongodbDatabase: process.env.MONGODB_DATABASE     ? process.env.MONGODB_DATABASE : 'tokens',
    mongodbCollection: process.env.MONGODB_COLLECTION ? process.env.MONGODB_COLLECTION : '',
    mongodbUser: process.env.MONGODB_USER             ? process.env.MONGODB_USER : '',
    mongodbPassword: process.env.MONGODB_PASSWORD     ? process.env.MONGODB_PASSWORD: '',
    mongodbHost: process.env.MONGODB_HOST             ? process.env.MONGODB_HOST : '',
    redisHost: process.env.REDIS_HOST                 ? process.env.REDIS_HOST : 'localhost',
    redisPort: process.env.REDIS_PORT                 ? process.env.REDIS_PORT : 6379,
    redisPassword: process.env.REDIS_PASSWORD         ? process.env.REDIS_PASSWORD : '',
    redisDb: process.env.REDIS_DB                     ? process.env.REDIS_DB : 0,
    redisPrefix: process.env.REDIS_PREFIX             ? process.env.REDIS_PREFIX : 'docker',
  },
  aws_s3: {
    region: (process.env.AWS_S3_REGION ? process.env.AWS_S3_REGION : 'sa-east-1') as any,
    access_key_id: process.env.AWS_S3_ACCESS_KEY_ID     ? process.env.AWS_S3_ACCESS_KEY_ID : null,
    secret_key: process.env.AWS_S3_SECRET_KEY           ? process.env.AWS_S3_SECRET_KEY : null,
    defaultBucketName: process.env.AWS_S3_BUCKET_NAME   ? process.env.AWS_S3_BUCKET_NAME : null,
    endpoint: process.env.AWS_S3_ENDPOINT               ? process.env.AWS_S3_ENDPOINT : null,
    forcePathStyle: process.env.AWS_S3_FORCE_PATH_STYLE ? process.env.AWS_S3_FORCE_PATH_STYLE : null,
  },
} as unknown as ServerOptions;