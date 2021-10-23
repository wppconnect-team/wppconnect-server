import redisClient from '../db/redis/db';
import config from '../../config.json';
import { getIPAddress } from '../functions';

var RedisTokenStore = function (client) {
  let prefix = config.db.redisPrefix || '';
  if (prefix === 'docker') {
    prefix = getIPAddress();
  }
  this.tokenStore = {
    getToken: (sessionName) =>
      new Promise((resolve, reject) => {
        redisClient.get(prefix + sessionName, (err, reply) => {
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
    setToken: (sessionName, tokenData) =>
      new Promise((resolve) => {
        tokenData.sessionName = sessionName;
        tokenData.config = client.config;
        redisClient.set(prefix + sessionName, JSON.stringify(tokenData), (err) => {
          return resolve(err ? false : true);
        });
      }),
    removeToken: (sessionName) =>
      new Promise((resolve) => {
        redisClient.del(prefix + sessionName, (err) => {
          return resolve(err ? false : true);
        });
      }),
    listTokens: () =>
      new Promise((resolve) => {
        redisClient.keys(prefix + '*', (err, keys) => {
          if (err) {
            return resolve([]);
          }
          keys.forEach((item, indice) => {
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
