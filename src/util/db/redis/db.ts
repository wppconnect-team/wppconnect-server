import config from '../../../config.json';
import redis from 'redis';

export const RedisClient = redis.createClient({
  socket: {
    host: config.db.redisHost,
    port: config.db.redisPort,
  },
  database: config.db.redisDb,
  password: config.db.redisPassword,
});
