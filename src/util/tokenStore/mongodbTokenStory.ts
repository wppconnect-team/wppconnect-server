import { ClientWhatsAppTypes } from '../../types/client-types';
import Token from './model/token';

declare interface Resultado {
  config: any;
}
export default class MongodbTokenStore {
  declare client;

  constructor(client: ClientWhatsAppTypes) {
    this.client = client;
  }
  tokenStore = {
    getToken: async (sessionName: string) => {
      let result = await Token.findOne({ sessionName });
      if (result === null) {
        return result;
      } else if (result) {
        const resultado = JSON.parse(JSON.stringify(result));
        resultado.config = JSON.parse(result.config as string);
        resultado.config.webhook = result.webhook;
        this.client.config = result.config;
        return resultado;
      }
    },
    setToken: async (sessionName: string, tokenData: any) => {
      const token = new Token(tokenData);
      token.sessionName = sessionName;
      token.webhook = this.client.config.webhook;
      token.config = JSON.stringify(this.client.config);

      let tk = await Token.findOne({ sessionName });

      if (tk) {
        token._id = tk._id;
        return (await Token.updateOne({ _id: tk._id }, token)) ? true : false;
      } else {
        return (await token.save()) ? true : false;
      }
    },
    removeToken: async (sessionName: string) => {
      return (await Token.deleteOne({ sessionName })) ? true : false;
    },
    listTokens: async () => {
      const result = await Token.find();
      return result.map((m: any) => m.sessionName);
    },
  };
}
