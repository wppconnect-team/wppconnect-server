import { WhatsAppServer } from '../../types/WhatsAppServer';
import Token from './model/token';

class MongodbTokenStore {
  declare client: any;
  constructor(client: any) {
    this.client = client;
  }
  tokenStore = {
    getToken: async (sessionName: string) => {
      let result = await (Token as any).findOne({ sessionName });
      if (result === null) return result;
      result = JSON.parse(JSON.stringify(result));
      result.config = JSON.parse(result.config);
      result.config.webhook = result.webhook;
      this.client.config = result.config;
      return result;
    },
    setToken: async (sessionName: any, tokenData: any) => {
      const token = new (Token as any)(tokenData);
      token.sessionName = sessionName;
      token.webhook = this.client.config.webhook;
      token.config = JSON.stringify(this.client.config);

      const tk = await (Token as any).findOne({ sessionName });

      if (tk) {
        token._id = tk._id;
        return (await (Token as any).updateOne({ _id: tk._id }, token))
          ? true
          : false;
      } else {
        return (await token.save()) ? true : false;
      }
    },
    removeToken: async (sessionName: string) => {
      return (await (Token as any).deleteOne({ sessionName })) ? true : false;
    },
    listTokens: async () => {
      const result = await (Token as any).find();
      return result.map((m: any) => m.sessionName);
    },
  };
}

export default MongodbTokenStore;
