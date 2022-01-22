import Token from './model/token';

var MongodbTokenStore = function (client) {
  this.tokenStore = {
    getToken: async (sessionName) => {
      let result = await Token.findOne({ sessionName });
      if (result === null) return result;
      result = JSON.parse(JSON.stringify(result));
      result.config = JSON.parse(result.config);
      result.config.webhook = result.webhook;
      client.config = result.config;
      return result;
    },
    setToken: async (sessionName, tokenData) => {
      const token = new Token(tokenData);
      token.sessionName = sessionName;
      token.webhook = client.config.webhook;
      token.config = JSON.stringify(client.config);

      let tk = await Token.findOne({ sessionName });

      if (tk) {
        token._id = tk._id;
        return (await Token.updateOne({ _id: tk._id }, token)) ? true : false;
      } else {
        return (await token.save()) ? true : false;
      }
    },
    removeToken: async (sessionName) => {
      return (await Token.deleteOne({ sessionName })) ? true : false;
    },
    listTokens: async () => {
      const result = await Token.find();
      return result.map((m) => m.sessionName);
    },
  };
};

module.exports = MongodbTokenStore;
