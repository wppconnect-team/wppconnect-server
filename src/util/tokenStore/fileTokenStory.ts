import * as wppconnect from '@wppconnect-team/wppconnect';
import { ClientWhatsAppTypes } from '../../types/client-types';

export const FileTokenStore = function (client: ClientWhatsAppTypes) {
  const tokenStore = new wppconnect.tokenStore.FileTokenStore({
    encodeFunction: (data) => {
      return encodeFunction(data, client.config);
    },
    decodeFunction: (text) => {
      return decodeFunction(text, client);
    },
  });

  const encodeFunction = function (data: any, config: any) {
    data.config = config;
    return JSON.stringify(data);
  };

  const decodeFunction = function (text: any, client: ClientWhatsAppTypes) {
    let object = JSON.parse(text);
    if (object.config && Object.keys(client.config).length === 0) client.config = object.config;
    if (object.webhook && Object.keys(client.config).length === 0) client.config.webhook = object.webhook;
    return object;
  };
};
