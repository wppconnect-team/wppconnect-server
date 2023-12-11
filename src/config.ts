import { env } from './util/env';

export default {
  secretKey: env('SECRET_KEY', 'THISISMYSECURETOKEN'),
  host: env('HOST', 'http://localhost'),
  port: env('PORT', '21465'),
  deviceName: env('DEVICE_NAME', 'WppConnect'),
  poweredBy: env('POWERED_BY', 'WppConnect-Server'),
  startAllSession: env('START_ALL_SESSION', true),
  tokenStoreType: env('TOKEN_STORE_TYPE', 'file'),
  maxListeners: env('MAX_LISTENERS', 15),
  customUserDataDir: env('CUSTOM_USER_DATA_DIR', './userDataDir/'),
  webhook: {
    url: env('WEBHOOK_URL', null),
    autoDownload: env('WEBHOOK_AUTO_DOWNLOAD', true),
    uploadS3: env('WEBHOOK_UPLOAD_S3', false),
    readMessage: env('WEBHOOK_READ_MESSAGE', true),
    allUnreadOnStart: env('WEBHOOK_ALL_UNREAD_ON_START', false),
    listenAcks: env('WEBHOOK_LISTEN_ACKS', true),
    onPresenceChanged: env('WEBHOOK_ON_PRESENCE_CHANGED', true),
    onParticipantsChanged: env('WEBHOOK_ON_PARTICIPANTS_CHANGED', true),
    onReactionMessage: env('WEBHOOK_ON_REACTION_MESSAGE', true),
    onPollResponse: env('WEBHOOK_ON_POLL_RESPONSE', true),
    onRevokedMessage: env('WEBHOOK_ON_REVOKED_MESSAGE', true),
    onLabelUpdated: env('WEBHOOK_ON_LABEL_UPDATED', true),
    onSelfMessage: env('WEBHOOK_ON_SELF_MESSAGE', false),
    ignore: ['status@broadcast'],
  },
  websocket: {
    autoDownload: env('WEBHOOK_AUTO_DOWNLOAD', false),
    uploadS3: env('WEBHOOK_UPLOAD_S3', false),
  },
  chatwoot: {
    sendQrCode: env('CHATWOOT_SEND_QRCODE', true),
    sendStatus: env('CHATWOOT_SEND_STATUS', true),
  },
  archive: {
    enable: env('ARCHIVE_ENABLE', false),
    waitTime: env('ARCHIVE_WAIT_TIME', 10),
    daysToArchive: env('ARCHIVE_DAYS_TO_ARCHIVE', 45),
  },
  log: {
    level: env('LOG_LEVEL', 'silly'), // Before open a issue, change level to silly and retry a action
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
    linkPreviewApiServers: env('LINK_PREVIEW_API_SERVERS', null),
  },
  mapper: {
    enable: env('MAPPER_ENABLE', false),
    prefix: env('MAPPER_PREFIX', 'tagone-'),
  },
  db: {
    mongodbDatabase: 'tokens',
    mongodbCollection: '',
    mongodbUser: '',
    mongodbPassword: '',
    mongodbHost: '',
    mongoIsRemote: true,
    mongoURLRemote: '',
    mongodbPort: 27017,
    redisHost: 'localhost',
    redisPort: 6379,
    redisPassword: '',
    redisDb: 0,
    redisPrefix: 'docker',
  },
  aws_s3: {
    region: env('AWS_S3_REGION', 'sa-east-1'),
    access_key_id: env('AWS_S3_ACCESS_KEY_ID'),
    secret_key: env('AWS_S3_SECRET_KEY'),
    defaultBucketName: env('AWS_S3_DEFAULT_BUCKET_NAME'),
    endpoint: env('AWS_S3_ENDPOINT'),
    forcePathStyle: env('AWS_S3_FORCE_PATH_STYLE'),
  },
};
