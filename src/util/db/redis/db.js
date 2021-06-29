import * as redis from 'redis';
import config from '../../../config.json';

const redisClient = redis.createClient(config.db.redis.port, config.db.redis.host, {
  password: config.db.redis.password,
  db: config.db.redis.db,
});

module.exports = redisClient;
