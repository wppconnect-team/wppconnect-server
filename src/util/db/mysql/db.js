
const config = require('../../../config.json');

if(config.tokenStoreType == "mysql"){
  const mysqlConfig = {
    username: config.mysql.username,
    password: config.mysql.password,
    database: config.mysql.database,
    host: config.mysql.host,
    dialect: config.mysql.dialect 
}
  var Sequelize = require("sequelize");
  var sequelize = new Sequelize(mysqlConfig);

}

module.exports = sequelize;