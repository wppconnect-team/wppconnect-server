import config from '../../config';
import redisClient from '../db/redis/db';
import { getIPAddress } from '../functions';

class RedisTokenStore {
  declare client: any;
  declare prefix: string;
  constructor(client: any) {
    this.client = client;

    let prefix = config.db.redisPrefix || '';
    if (prefix === 'docker') {
      prefix = getIPAddress();
    }
    // Assign the resolved prefix. Reading this.prefix left it undefined, so
    // every key became "undefined<session>" and listTokens crashed on
    // prefix.length while stripping the prefix it had just failed to set.
    this.prefix = prefix;
  }
  tokenStore = {
    getToken: async (sessionName: string) => {
      // node-redis v4 is promises-only: a callback passed as an extra
      // argument is folded into the command arguments and never invoked, so
      // awaiting the returned promise is the only way to settle.
      const reply = await (redisClient as any).get(this.prefix + sessionName);
      const object = JSON.parse(reply);
      if (object) {
        if (object.config && Object.keys(this.client.config).length === 0)
          this.client.config = object.config;
        if (object.webhook && Object.keys(this.client.config).length === 0)
          this.client.config.webhook = object.webhook;
      }
      return object;
    },
    setToken: async (sessionName: string, tokenData: any) => {
      try {
        tokenData.sessionName = sessionName;
        tokenData.config = this.client.config;
        await (redisClient as any).set(
          this.prefix + sessionName,
          JSON.stringify(tokenData)
        );
        return true;
      } catch (error) {
        return false;
      }
    },
    removeToken: async (sessionName: string) => {
      try {
        await (redisClient as any).del(this.prefix + sessionName);
        return true;
      } catch (error) {
        return false;
      }
    },
    listTokens: async () => {
      try {
        const keys: string[] = await (redisClient as any).keys(
          this.prefix + '*'
        );
        keys.forEach((item: any, indice: any) => {
          if (this.prefix !== '' && item.includes(this.prefix)) {
            keys[indice] = item.substring(
              item.indexOf(this.prefix) + this.prefix.length
            );
          }
        });
        return keys;
      } catch (error) {
        return [];
      }
    },
  };
}

export default RedisTokenStore;
