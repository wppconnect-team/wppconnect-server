import express from 'express';
import { Socket } from 'socket.io';
import { Logger } from 'winston';

import { ServerOptions } from './ServerOptions';
import { WhatsAppServer } from './WhatsAppServer';

export interface Request extends express.Request {
  client: WhatsAppServer;
  logger: Logger;
  serverOptions: ServerOptions;
  session: string;
  file: any;
  io: Socket;
}
