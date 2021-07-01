import config from '../../../config.json';
let redis = config.tokenStoreType === 'redis' ? require('redis') : null;
let RedisClient = null;

if (config.tokenStoreType === 'redis') {
  RedisClient = redis.createClient(config.db.redisPort, config.db.redisHost, {
    password: config.db.redisPassword,
    db: config.db.redisDb,
  });
}

module.exports = RedisClient;
