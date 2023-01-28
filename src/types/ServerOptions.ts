export interface ServerOptions {
  secretKey: string;
  host: string;
  port: number;
  deviceName: string;
  poweredBy: string;
  startAllSession: boolean;
  tokenStoreType: string;
  maxListeners: number;
  customUserDataDir: string;
  webhook: {
    url: string;
    autoDownload: boolean;
    uploadS3: boolean;
    readMessage: boolean;
    allUnreadOnStart: boolean;
    listenAcks: boolean;
    onPresenceChanged: boolean;
    onParticipantsChanged: boolean;
    onReactionMessage: boolean;
    onPollResponse: boolean;
    onRevokedMessage: boolean;
  };
  archive: {
    enable: boolean;
    waitTime: number;
    daysToArchive: number;
  };
  log: {
    level: string;
    logger: string[];
  };
  createOptions: {
    browserArgs: string[];
  };
  mapper: {
    enable: boolean;
    prefix: string;
  };
  db: {
    mongodbDatabase: string;
    mongodbCollection: string;
    mongodbUser: string;
    mongodbPassword: string;
    mongodbHost: string;
    mongoIsRemote: boolean;
    mongoURLRemote: string;
    mongodbPort: number;
    redisHost: string;
    redisPort: number;
    redisPassword: string;
    redisDb: string;
    redisPrefix: string;
  };
}
