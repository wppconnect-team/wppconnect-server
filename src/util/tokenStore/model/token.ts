import config from '../../../config';

const mongoose =
  config.tokenStoreType === 'mongodb' ? require('../../db/mongodb/db') : null;

let Token: any = null;

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

export default Token;
