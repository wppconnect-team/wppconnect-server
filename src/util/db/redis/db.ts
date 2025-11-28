import config from '../../../config';
import { createLogger } from '../../logger';

const logger = createLogger(config.log);

const redis = config.tokenStoreType === 'redis' ? require('redis') : null;

let RedisClient: any = null;

if (config.tokenStoreType === 'redis' && redis) {
  RedisClient = redis.createClient({
    socket: {
      host: config.db.redisHost,
      port: config.db.redisPort
    },
    password: config.db.redisPassword,
    database: config.db.redisDb
  });

  if (RedisClient) {
    RedisClient.connect().catch((err: any) => {
      logger.error('Error connecting to Redis:', err);
    });
    
    RedisClient.on('error', (err: any) => {
      logger.error('Redis Client Error', err);
    });
    
    RedisClient.on('connect', () => {
      logger.info('Connected to Redis successfully');
    });
  }
}

export default RedisClient;
