import { Whatsapp } from '@wppconnect-team/wppconnect';

export declare interface ClientWhatsAppTypes extends Whatsapp {
  status?: string;
  config?: any;
  qrcode?: any;
  webhook?: any;
  urlcode?: string;
}
