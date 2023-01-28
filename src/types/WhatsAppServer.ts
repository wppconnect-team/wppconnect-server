import { Whatsapp } from '@wppconnect-team/wppconnect';

export interface WhatsAppServer extends Whatsapp {
  urlcode: string;
  status: string;
}
