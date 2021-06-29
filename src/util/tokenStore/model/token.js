const mongoose = require('../../db/mongodb/db');

const TokenSchema = new mongoose.Schema({
  WABrowserId: String,
  WASecretBundle: String,
  WAToken1: String,
  WAToken2: String,
  webhook: String,
  sessionName: String,
});
const Token = mongoose.model('Token', TokenSchema);

module.exports = Token;
