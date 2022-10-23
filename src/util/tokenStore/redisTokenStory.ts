import redisClient from '../db/redis/db';
import config from '../../config.json';
import { getIPAddress } from '../functions';
import { ClientWhatsAppTypes } from '../../types/client-types';

export const RedisTokenStore = function (client: ClientWhatsAppTypes) {
  let prefix = config.db.redisPrefix || '';
  if (prefix === 'docker') {
    prefix = getIPAddress();
  }
  const tokenStore = {
    getToken: (sessionName: string) =>
      new Promise((resolve, reject) => {
        redisClient.get(prefix + sessionName, (err: any, reply: any) => {
          if (err) {
            return reject(err);
          }
          const object = JSON.parse(reply);
          if (object) {
            if (object.config && Object.keys(client.config).length === 0) client.config = object.config;
            if (object.webhook && Object.keys(client.config).length === 0) client.config.webhook = object.webhook;
          }
          resolve(object);
        });
      }),
    setToken: (sessionName: string, tokenData: any) =>
      new Promise((resolve) => {
        tokenData.sessionName = sessionName;
        tokenData.config = client.config;
        redisClient.set(prefix + sessionName, JSON.stringify(tokenData), (err: any) => {
          return resolve(err ? false : true);
        });
      }),
    removeToken: (sessionName: string) =>
      new Promise((resolve) => {
        redisClient.del(prefix + sessionName, (err: any) => {
          return resolve(err ? false : true);
        });
      }),
    listTokens: () =>
      new Promise((resolve) => {
        redisClient.keys(prefix + '*', (err: any, keys: any) => {
          if (err) {
            return resolve([]);
          }
          keys.forEach((item: any, indice: any) => {
            if (prefix !== '' && item.includes(prefix)) {
              keys[indice] = item.substring(item.indexOf(prefix) + prefix.length);
            }
          });
          return resolve(keys);
        });
      }),
  };
};

module.exports = RedisTokenStore;
