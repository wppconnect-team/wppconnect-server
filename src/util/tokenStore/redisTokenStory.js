import redisClient from '../db/redis/db';

var RedisTokenStore = function (client) {
  this.tokenStore = {
    getToken: (sessionName) =>
      new Promise((resolve, reject) => {
        redisClient.get(sessionName, (err, reply) => {
          if (err) {
            return reject(err);
          }
          resolve(JSON.parse(reply));
        });
      }),
    setToken: (sessionName, tokenData) =>
      new Promise((resolve) => {
        tokenData.sessionName = sessionName;
        tokenData.webhook = client.webhook;
        redisClient.set(sessionName, JSON.stringify(tokenData), (err, reply) => {
          return resolve(err ? false : true);
        });
      }),
    removeToken: (sessionName) =>
      new Promise((resolve) => {
        redisClient.del(sessionName, (err) => {
          return resolve(err ? false : true);
        });
      }),
    listTokens: () =>
      new Promise((resolve) => {
        redisClient.keys('*', (err, keys) => {
          if (err) {
            return resolve([]);
          }
          return resolve(keys);
        });
      }),
  };
};

module.exports = RedisTokenStore;
