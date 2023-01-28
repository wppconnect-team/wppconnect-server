import config from '../../config';
import { WhatsAppServer } from '../../types/WhatsAppServer';
import FileTokenStore from './fileTokenStory';
import MongodbTokenStore from './mongodbTokenStory';
import RedisTokenStore from './redisTokenStory';

class Factory {
  constructor() {}
  public createTokenStory(client: any) {
    var myTokenStore;
    const type = config.tokenStoreType;

    if (type === 'mongodb') {
      myTokenStore = new MongodbTokenStore(client);
    } else if (type === 'redis') {
      myTokenStore = new RedisTokenStore(client);
    } else {
      myTokenStore = new FileTokenStore(client);
    }

    return myTokenStore.tokenStore;
  }
}

export default Factory;
