import { url } from 'inspector';

import config from '../../../config';

const redis = config.tokenStoreType === 'redis' ? require('redis') : null;

let RedisClient: any = null;

if (config.tokenStoreType === 'redis') {
  RedisClient = redis.createClient({
    url: 'redis://:O83feb7drQ8u4zJcqLSEKmePDhknFGN9GeQ0UTio4hVhW1GZ8SNq2FkCNrK10QBb@bk8444k:6379/0',
  });

  RedisClient.on('error', (err) =>
    console.error('Redis Client Error', err)
  ).connect();
}

export default RedisClient;
