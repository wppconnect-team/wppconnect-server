const Token = require('./model/token');

var MySqlTokenStore = function (client) {
  this.tokenStore = {
    getToken: async (sessionName) => {
      let result = await Token.findOne({where:{sessionName:sessionName}});
      if (result === null) return result;
      result = JSON.parse(JSON.stringify(result));
      result.config = JSON.parse(result.config);
      result.config.webhook = result.webhook;
      client.config = result.config;
      return result;
    },
    setToken: async (sessionName, tokenData) => {
   
      tokenData.sessionName = sessionName;
      tokenData.webhook = client.config.webhook;
      tokenData.config = JSON.stringify(client.config);

      let tk = await Token.findOne({where:{sessionName:sessionName}});
      if (tk) {
        tk.sessionName = sessionName;
        tk.webhook = client.config.webhook;
        tk.config = JSON.stringify(client.config);
  
        return (await tk.save()) ? true : false;
      } else {
        return (await Token.create(tokenData)) ? true : false;
      }
    },
    removeToken: async (sessionName) => {
      return (await Token.destroy({where :{sessionName:sessionName } })  ) ? true : false;
    },
    listTokens: async () => {
  
      const result = await Token.findAll();
   
      if(result === null){
        return []
      }
      return result.map((m) => m.sessionName);
    },
  };
};

module.exports = MySqlTokenStore;