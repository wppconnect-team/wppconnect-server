import config from '../../../config.json';
import mongoose from '../../db/mongodb/db';

const TokenSchema = new mongoose.Schema({
  WABrowserId: String,
  WASecretBundle: String,
  WAToken1: String,
  WAToken2: String,
  webhook: String,
  config: String,
  sessionName: String,
});
const Token = mongoose.model('Token', TokenSchema);

export default Token;
