//import mongoose from 'mongoose';
import config from '../../../config.json';

import mongoose from 'mongoose';

if (config.tokenStoreType === 'mongodb') {
  (async function connect() {
    mongoose.Promise = global.Promise;
    const userAndPassword =
      config.db.mongodbUser && config.db.mongodbPassword
        ? `${config.db.mongodbUser}:${config.db.mongodbPassword}@`
        : '';

    if (!config.db.mongoIsRemote) {
      await mongoose.connect(
        `mongodb://${userAndPassword}${config.db.mongodbHost}:${config.db.mongodbPort}/${config.db.mongodbDatabase}`
      );
    } else {
      await mongoose.connect(config.db.mongoURLRemote);
    }
  })();
}

export default mongoose;
