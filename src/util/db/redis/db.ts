import config from '../../../config';

const redis = config.tokenStoreType === 'redis' ? require('redis') : null;

let RedisClient: any = null;

if (config.tokenStoreType === 'redis') {
  // redis v4 takes a single options object. Passing (port, host, options) is
  // the v3 signature: every argument after the first was spread off a number
  // and discarded, so REDIS_HOST, REDIS_PORT, REDIS_PASSWORD and REDIS_DB were
  // all ignored and the client fell back to localhost:6379 with no auth.
  RedisClient = redis.createClient({
    socket: {
      port: config.db.redisPort,
      host: config.db.redisHost,
    },
    password: config.db.redisPassword || undefined,
    database: config.db.redisDb,
  });
  // Without an error listener node-redis emits "error" on every failed
  // reconnect attempt, which is an unhandled 'error' event and terminates the
  // process. The token store reports failures through its own callbacks.
  RedisClient.on('error', () => undefined);
}

export default RedisClient;
