import config from '../../config';
import FileTokenStore from './fileTokenStory';
import MongodbTokenStore from './mongodbTokenStory';
import RedisTokenStore from './redisTokenStory';

class Factory {
  public createTokenStory(client: any) {
    let myTokenStore;
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
