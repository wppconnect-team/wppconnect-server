import * as wppconnect from '@wppconnect-team/wppconnect';
import { ClientWhatsAppTypes } from '../../types/client-types';

export default class FileTokenStore {
  declare client;

  constructor(client: ClientWhatsAppTypes) {
    this.client = client;
  }
  tokenStore = new wppconnect.tokenStore.FileTokenStore({
    encodeFunction: (data) => {
      return this.encodeFunction(data, this.client.config);
    },
    decodeFunction: (text) => {
      return this.decodeFunction(text, this.client);
    },
  });

  encodeFunction = function (data: any, config: any) {
    data.config = config;
    return JSON.stringify(data);
  };

  decodeFunction = function (text: any, client: ClientWhatsAppTypes) {
    let object = JSON.parse(text);
    if (object.config && Object.keys(client.config).length === 0) client.config = object.config;
    if (object.webhook && Object.keys(client.config).length === 0) client.config.webhook = object.webhook;
    return object;
  };
}
