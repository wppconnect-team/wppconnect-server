import * as wppconnect from '@wppconnect-team/wppconnect';

var FileTokenStore = function (client) {
  this.tokenStore = new wppconnect.tokenStore.FileTokenStore({
    encodeFunction: (data) => {
      return this.encodeFunction(data, client.config);
    },
    decodeFunction: (text) => {
      return this.decodeFunction(text, client);
    },
  });

  this.encodeFunction = function (data, config) {
    data.config = config;
    return JSON.stringify(data);
  };

  this.decodeFunction = function (text, client) {
    let object = JSON.parse(text);
    if (object.config && Object.keys(client.config).length === 0) client.config = object.config;
    if (object.webhook && Object.keys(client.config).length === 0) client.config.webhook = object.webhook;
    return object;
  };
};

module.exports = FileTokenStore;
