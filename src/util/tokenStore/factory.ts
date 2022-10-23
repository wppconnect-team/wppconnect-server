import config from '../../config.json';
import { FileTokenStore } from './fileTokenStory';
import { MongodbTokenStore } from './mongodbTokenStory';
import { RedisTokenStore } from './redisTokenStory';
//import { FirebaseTokenStore } from './firebaseTokenStory';
import { ClientWhatsAppTypes } from '../../types/client-types';

export const Factory = function () {
  const createTokenStory = function (client: ClientWhatsAppTypes) {
    var myTokenStore;
    const type = config.tokenStoreType;

    if (type === 'mongodb') {
      myTokenStore = MongodbTokenStore(client);
    } else if (type === 'redis') {
      myTokenStore = RedisTokenStore(client);
    } else {
      myTokenStore = FileTokenStore(client);
    }

    return myTokenStore.tokenStore;
  };
};
