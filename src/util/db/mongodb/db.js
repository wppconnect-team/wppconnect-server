//import mongoose from 'mongoose';
import config from '../../../config.json';
let mongoose = config.tokenStoreType === 'mongodb' ? require('mongoose') : null;

if (config.tokenStoreType === 'mongodb') {
  mongoose.Promise = global.Promise;
  const userAndPassword =
    config.db.mongodbUser && config.db.mongodbPassword ? `${config.db.mongodbUser}:${config.db.mongodbPassword}@` : '';
  mongoose.connect(
    `mongodb://${userAndPassword}${config.db.mongodbHost}:${config.db.mongodbPort}/${config.db.mongodbDatabase}`,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  );
}

module.exports = mongoose;
