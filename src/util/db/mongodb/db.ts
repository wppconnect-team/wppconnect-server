//import mongoose from 'mongoose';
import config from '../../../config';

const mongoose =
  config.tokenStoreType === 'mongodb' ? require('mongoose') : null;

if (config.tokenStoreType === 'mongodb') {
  mongoose.Promise = global.Promise;
  const userAndPassword =
    config.db.mongodbUser && config.db.mongodbPassword
      ? `${config.db.mongodbUser}:${config.db.mongodbPassword}@`
      : '';

  if (!config.db.mongoIsRemote) {
    mongoose.connect(
      `mongodb://root:0AdbskCVa1QIVplisvRPReHNAGJzg6fnHBErKx1CvosAk1UwaAeeJNDhNf97bfng@w4kkkok:27017/?directConnection=true`,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
  } else {
    mongoose.connect(config.db.mongoURLRemote, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  }
}

export default mongoose;
