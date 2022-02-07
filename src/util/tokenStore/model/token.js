import config from '../../../config.json';
const { DataTypes } = require('sequelize');

let mongoose = config.tokenStoreType === 'mongodb' ? require('../../db/mongodb/db') : null;
let sequelize =  config.tokenStoreType === 'mysql'?require('../../db/mysql/db'): null;

let Token = null;

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


if (config.tokenStoreType === 'mysql') {
  const TokenSchema = sequelize.define('tokens',{
    WABrowserId:{
      type :DataTypes.STRING,
      allowNull : false,
      primaryKey: true
    },
    WASecretBundle:{
      type :DataTypes.STRING,
      allowNull : false,
    
    },WAToken1:{
      type :DataTypes.STRING,
      allowNull : false,
    
    },WAToken2:{
      type :DataTypes.STRING,
      allowNull : false,
     
    },webhook:{
      type :DataTypes.STRING,
      allowNull : false,
     
    },config:{
      type :DataTypes.STRING,
      allowNull : false,
    
    },sessionName:{
      type :DataTypes.STRING,
      allowNull : false,

    },
  })
  sequelize.sync();
  Token = TokenSchema;
  }
module.exports = Token;
