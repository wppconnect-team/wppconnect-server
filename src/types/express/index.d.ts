import { Whatsapp } from '@wppconnect-team/wppconnect';
import { Server } from 'socket.io';
import { Logger } from 'winston';

import { ServerOptions } from '../ServerOptions';

// to make the file a module and avoid the TypeScript error
export {};

declare global {
  namespace Express {
    export interface Request {
      client: Whatsapp & { urlcode: string; status: string };
      logger: Logger;
      session: string;
      token?: string;
      io: Server;
      serverOptions: ServerOptions;
    }
  }
}
