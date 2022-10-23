import { Request as req } from 'express';
import { ClientWhatsAppTypes } from './client-types';

export declare interface Request extends req {
  client?: ClientWhatsAppTypes;
  session?: any;
  serverOptions?: any;
  logger?: any;
  token?: any;
  io?: any;
}
