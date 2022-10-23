import config from '../../config.json';
import FileTokenStore from './fileTokenStory';
import MongodbTokenStore from './mongodbTokenStory';
//import RedisTokenStore from './redisTokenStory';
//import { FirebaseTokenStore } from './firebaseTokenStory';
import { ClientWhatsAppTypes } from '../../types/client-types';

export class Factory {
  public createTokenStory = function (client: any) {
    var myTokenStore;
    const type = config.tokenStoreType;

    if (type === 'mongodb') {
      myTokenStore = new MongodbTokenStore(client);
    } /*else if (type === 'redis') {
      myTokenStore = new RedisTokenStore(client);
    }*/ else {
      myTokenStore = new FileTokenStore(client);
    }

    return myTokenStore.tokenStore;
  };
}
