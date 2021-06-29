import mongoose from 'mongoose';
import config from '../../../config.json';
mongoose.Promise = global.Promise;

const userAndPassword =
  config.db.mongodb.user && config.db.mongodb.password
    ? `${config.db.mongodb.user}:${config.db.mongodb.password}@`
    : '';

mongoose.connect(
  `mongodb://${userAndPassword}${config.db.mongodb.host}:${config.db.mongodb.port}/${config.db.mongodb.database}`,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

module.exports = mongoose;
