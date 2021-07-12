import Token from './model/token';

var MongodbTokenStore = function (client) {
  this.tokenStore = {
    getToken: async (sessionName) => {
      return await Token.findOne({ sessionName });
    },
    setToken: async (sessionName, tokenData) => {
      const token = new Token(tokenData);
      token.sessionName = sessionName;
      token.webhook = client.webhook;

      let tk = await Token.findOne({ sessionName });

      if (tk) {
        token._id = tk._id;
        return (await token.updateOne()) ? true : false;
      } else {
        return (await token.save()) ? true : false;
      }
    },
    removeToken: async (sessionName) => {
      return (await Token.deleteOne({ sessionName })) ? true : false;
    },
    listTokens: async () => {
      return await Token.find();
    },
  };
};

module.exports = MongodbTokenStore;
