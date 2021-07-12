import * as wppconnect from '@wppconnect-team/wppconnect';

var FileTokenStore = function (client) {
  this.tokenStore = new wppconnect.tokenStore.FileTokenStore({
    encodeFunction: (data) => {
      return this.encodeFunction(data, client.webhook);
    },
    decodeFunction: (text) => {
      return this.decodeFunction(text, client);
    },
  });

  this.encodeFunction = function (data, webhook) {
    data.webhook = webhook;
    return JSON.stringify(data);
  };

  this.decodeFunction = function (text, client) {
    let object = JSON.parse(text);
    if (object.webhook && !client.webhook) client.webhook = object.webhook;
    delete object.webhook;
    return object;
  };
};

module.exports = FileTokenStore;
