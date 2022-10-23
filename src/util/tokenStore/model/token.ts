import config from '../../../config.json';

let mongoose = config.tokenStoreType === 'mongodb' ? require('../../db/mongodb/db') : null;
export let Token = null;

if (config.tokenStoreType === 'mongodb') {
  const TokenSchema = new mongoose.Schema({
    WABrowserId: String,
    WASecretBundle: String,
    WAToken1: String,
    WAToken2: String,
    webhook: String,
    config: String,
    sessionName: String,
  });
  Token = mongoose.model('Token', TokenSchema);
}
