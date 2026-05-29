import { Whatsapp } from '@wppconnect-team/wppconnect';
import { Socket } from 'socket.io';
import { Logger } from 'winston';

import { ProviderAdapter } from '../../core/provider/ProviderAdapter';
import { ServerOptions } from '../ServerOptions';

// to make the file a module and avoid the TypeScript error
export {};

declare global {
  namespace Express {
    export interface Request {
      client: Whatsapp & { urlcode: string; status: string };
      // Provider abstraction for the current session. Populated alongside
      // `client` during the provider-based migration; `undefined` until the
      // session has a live adapter. Controllers migrate from `client` to
      // `provider` per capability block (PR4-PR6).
      provider?: ProviderAdapter;
      logger: Logger;
      session: string;
      token?: string;
      io: Socket;
      serverOptions: ServerOptions;
    }
  }
}
