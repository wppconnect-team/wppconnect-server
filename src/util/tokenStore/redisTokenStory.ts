import { RedisClient } from '../db/redis/db';
import config from '../../config.json';
import { getIPAddress } from '../functions';
import { ClientWhatsAppTypes } from '../../types/client-types';

export default class RedisTokenStore {
  declare client;
  declare prefix;

  constructor(client: ClientWhatsAppTypes) {
    this.client = client;

    this.prefix = config.db.redisPrefix || '';
    if (this.prefix === 'docker') {
      this.prefix = getIPAddress();
    }
  }
  tokenStore = {
    getToken: async (sessionName: string) =>
      new Promise(async (resolve, reject) => {
        try {
          const value = await RedisClient.get(this.prefix + sessionName);
          const object = JSON.parse(value as any);
          if (object) {
            if (object.config && Object.keys(this.client.config).length === 0) this.client.config = object.config;
            if (object.webhook && Object.keys(this.client.config).length === 0)
              this.client.config.webhook = object.webhook;
          }
          resolve(object);
        } catch (error: any) {
          reject(error);
        }
      }),
    setToken: (sessionName: string, tokenData: any) =>
      new Promise(async (resolve, reject) => {
        try {
          tokenData.sessionName = sessionName;
          tokenData.config = this.client.config;
          const value = await RedisClient.set(this.prefix + sessionName, JSON.stringify(tokenData));
          resolve(value);
        } catch (error: any) {
          reject(error);
        }
      }),
    removeToken: (sessionName: string) =>
      new Promise(async (resolve, reject) => {
        try {
          const value = await RedisClient.del(this.prefix + sessionName);
          resolve(value);
        } catch (error: any) {
          reject(error);
        }
      }),
    listTokens: () =>
      new Promise(async (resolve, reject) => {
        try {
          const value = await RedisClient.keys(this.prefix + '*');
          if (value.values.length > 0) {
            value.forEach((item: any, indice: any) => {
              if (this.prefix !== '' && item.includes(this.prefix)) {
                value[indice] = item.substring(item.indexOf(this.prefix) + this.prefix.length);
              }
            });
            resolve(value);
          } else {
            resolve([]);
          }
        } catch (error: any) {
          reject(error);
        }
      }),
  };
}
