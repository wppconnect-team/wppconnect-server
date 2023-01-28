import { Request } from 'express';
import { Logger } from 'winston';
import { ServerOptions } from './ServerOptions';
import { Socket } from 'socket.io';
import { WhatsAppServer } from './WhatsAppServer';

export interface RequestWPP extends Request {
  client: WhatsAppServer;
  logger: Logger;
  serverOptions: ServerOptions;
  session: string;
  file: any;
  io: Socket;
}
