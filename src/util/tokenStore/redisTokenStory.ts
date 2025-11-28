import config from '../../config';
import redisClient from '../db/redis/db';
import { getIPAddress } from '../functions';
import { createLogger } from '../logger';

const logger = createLogger(config.log);

class RedisTokenStore {
  declare client: any;
  declare prefix: string;
  
  constructor(client: any) {
    this.client = client;
    this.prefix = 'wpp-session:';
    logger.debug(`RedisTokenStore initialized with prefix: ${this.prefix}`);
  }

  tokenStore = {
    getToken: async (sessionName: string) => {
      try {
        if (!redisClient) {
          logger.error('Redis client is not available');
          return null;
        }

        const fullKey = this.prefix + sessionName;
        logger.debug(`Getting token for session: ${fullKey}`);
        
        const reply = await redisClient.get(fullKey);
        if (!reply) {
          logger.debug(`No token found for session: ${fullKey}`);
          return null;
        }
        
        const object = JSON.parse(reply);
        if (object) {
          if (object.config && Object.keys(this.client.config).length === 0) {
            this.client.config = object.config;
            logger.debug('Config loaded from Redis token store');
          }
          if (object.webhook && Object.keys(this.client.config).length === 0) {
            this.client.config.webhook = object.webhook;
            logger.debug('Webhook config loaded from Redis token store');
          }
        }
        
        logger.debug(`Token retrieved successfully for session: ${fullKey}`);
        return object;
      } catch (err) {
        logger.error(`Error getting token for session ${sessionName}:`, err);
        return null;
      }
    },

    setToken: async (sessionName: string, tokenData: any) => {
      try {
        if (!redisClient) {
          logger.error('Redis client is not available');
          return false;
        }

        const fullKey = this.prefix + sessionName;
        logger.debug(`Setting token for session: ${fullKey}`);
        
        tokenData.sessionName = sessionName;
        tokenData.config = this.client.config;
        
        await redisClient.set(
          fullKey,
          JSON.stringify(tokenData)
        );
        
        logger.debug(`Token set successfully for session: ${fullKey}`);
        return true;
      } catch (err) {
        logger.error(`Error setting token for session ${sessionName}:`, err);
        return false;
      }
    },

    removeToken: async (sessionName: string) => {
      try {
        if (!redisClient) {
          logger.error('Redis client is not available');
          return false;
        }

        const fullKey = this.prefix + sessionName;
        logger.debug(`Removing token for session: ${fullKey}`);
        
        await redisClient.del(fullKey);
        
        logger.debug(`Token removed successfully for session: ${fullKey}`);
        return true;
      } catch (err) {
        logger.error(`Error removing token for session ${sessionName}:`, err);
        return false;
      }
    },

    listTokens: async () => {
      try {
        if (!redisClient) {
          logger.error('Redis client is not available');
          return [];
        }

        const pattern = this.prefix + '*';
        logger.debug(`Listing tokens with pattern: ${pattern}`);
        
        const keys = await redisClient.keys(pattern);
        
        const processedKeys = keys.map((item: string) => {
          if (this.prefix !== '' && item.includes(this.prefix)) {
            return item.substring(item.indexOf(this.prefix) + this.prefix.length);
          }
          return item;
        });
        
        logger.debug(`Found ${processedKeys.length} tokens`);
        return processedKeys;
      } catch (err) {
        logger.error('Error listing tokens:', err);
        return [];
      }
    }
  };
}

export default RedisTokenStore;
