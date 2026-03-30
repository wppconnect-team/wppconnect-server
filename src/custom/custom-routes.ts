import { Express } from 'express';
import verifyToken from '../middleware/auth';
import fs from 'fs';
import path from 'path';
import Crypto from 'crypto';

export default function customRoutes(app: Express) {

  // ============================
  //   DEBUG: Inspect WPP API
  // ============================
  app.get('/custom/:session/debug-wpp-newsletter',
    verifyToken,
    async (req: any, res) => {
      try {
        const result = await req.client.page.evaluate(async () => {
          const WPP = (window as any).WPP;
          const info: any = {};

          info.hasNewsletterModule = !!WPP.newsletter;
          if (WPP.newsletter) {
            info.newsletterMethods = Object.keys(WPP.newsletter);
          }

          info.hasNewsletterStore = !!WPP.whatsapp.NewsletterStore;
          if (WPP.whatsapp.NewsletterStore) {
            try {
              const models = WPP.whatsapp.NewsletterStore.getModelsArray();
              info.newsletterStoreCount = models.length;
              info.newsletterStoreItems = models.map((m: any) => ({
                id: m.id?._serialized || m.id,
                name: m.name,
              }));
            } catch (e: any) {
              info.newsletterStoreError = e.message;
            }
          }

          try {
            const allChats = WPP.whatsapp.ChatStore.getModelsArray();
            const newsletterChats = allChats.filter((c: any) => {
              const id = c.id?._serialized || '';
              return id.includes('@newsletter') || id.includes('newsletter');
            });
            info.newsletterChatsInChatStore = newsletterChats.map((c: any) => ({
              id: c.id?._serialized || c.id,
              name: c.name || c.formattedTitle,
            }));
          } catch (e: any) {
            info.chatStoreError = e.message;
          }

          info.chatMethods = Object.keys(WPP.chat).filter(k => typeof WPP.chat[k] === 'function');
          info.whatsappStores = Object.keys(WPP.whatsapp).filter(k => k.includes('Store'));

          return info;
        });

        res.status(200).json({
          status: 'success',
          debug: result,
          session: req.client.session
        });
      } catch (error: any) {
        req.logger.error('Debug error:', error);
        res.status(500).json({
          status: 'Error',
          error: { name: error.name, message: error.message },
          session: req.client.session
        });
      }
    }
  );


  // ============================
  //   SEND TEXT TO NEWSLETTER
  // ============================
  app.post('/custom/:session/send-message-newsletter',
    verifyToken,
    async (req: any, res) => {
      try {
        const { channel, phone, message } = req.body;

        let channelValue: string | undefined;
        if (channel) {
          channelValue = channel;
        } else if (phone) {
          channelValue = Array.isArray(phone) ? phone[0] : phone;
        }

        if (!channelValue || !message) {
          return res.status(400).json({
            status: 'Error',
            message: 'Campos "channel"/"phone" y "message" son requeridos',
            session: req.client?.session
          });
        }

        const channelId = channelValue.includes('@newsletter')
          ? channelValue.split('@')[0]
          : channelValue;

        req.logger.info(`Sending to newsletter: ${channelId}`);

        const wid = `${channelId}@newsletter`;

        const result = await req.client.page.evaluate(
          async ({ wid, message }: any) => {
            const WPP = (window as any).WPP;

            // El newsletter está en NewsletterStore pero NO en ChatStore.
            // sendTextMessage usa assertFindChat que busca en ChatStore y falla.
            // Solución: obtener el newsletter del NewsletterStore e inyectarlo
            // en ChatStore para que sendTextMessage lo encuentre.

            const newsletter = WPP.whatsapp.NewsletterStore.get(wid);
            if (!newsletter) {
              throw new Error(`Newsletter ${wid} no encontrado en NewsletterStore`);
            }

            // Verificar si ya existe en ChatStore
            let chat = WPP.whatsapp.ChatStore.get(wid);

            if (!chat) {
              // Inyectar el newsletter como un chat en ChatStore
              // Crear un modelo de chat con los datos del newsletter
              const ChatModel = WPP.whatsapp.ChatStore.modelClass;
              chat = new ChatModel({
                id: newsletter.id,
                name: newsletter.name,
                isNewsletter: true,
              });
              WPP.whatsapp.ChatStore.add(chat);
            }

            // Ahora sendTextMessage debería encontrar el chat
            return await WPP.chat.sendTextMessage(wid, message, {
              waitForAck: true,
            });
          },
          { wid, message }
        );

        res.status(201).json({
          status: 'success',
          response: result,
          session: req.client.session
        });
      } catch (error: any) {
        req.logger.error('Error sending message to newsletter:', error);
        res.status(500).json({
          status: 'Error',
          message: 'Erro ao enviar a mensagem para o newsletter.',
          error: {
            name: error.name,
            message: error.message,
            level: 'error'
          },
          session: req.client.session
        });
      }
    }
  );


  // ============================
  //   SEND IMAGE/FILE TO NEWSLETTER
  // ============================
  app.post('/custom/:session/send-image-newsletter',
    verifyToken,
    async (req: any, res) => {
      try {
        const { channel, phone, filename = 'file', caption = '', base64 } = req.body;

        let channelValue: string | undefined;
        if (channel) {
          channelValue = channel;
        } else if (phone) {
          channelValue = Array.isArray(phone) ? phone[0] : phone;
        }

        if (!channelValue || !base64) {
          return res.status(400).json({
            status: 'Error',
            message: 'Campos "channel"/"phone" y "base64" son requeridos',
            session: req.client?.session
          });
        }

        const channelId = channelValue.includes('@newsletter')
          ? channelValue.split('@')[0]
          : channelValue;

        req.logger.info(`Sending file to newsletter: ${channelId}`);

        const wid = `${channelId}@newsletter`;

        const result = await req.client.page.evaluate(
          async ({ wid, base64, filename, caption }: any) => {
            const WPP = (window as any).WPP;

            const newsletter = WPP.whatsapp.NewsletterStore.get(wid);
            if (!newsletter) {
              throw new Error(`Newsletter ${wid} no encontrado en NewsletterStore`);
            }

            // Verificar si ya existe en ChatStore
            let chat = WPP.whatsapp.ChatStore.get(wid);

            if (!chat) {
              // Inyectar el newsletter como un chat en ChatStore
              const ChatModel = WPP.whatsapp.ChatStore.modelClass;
              chat = new ChatModel({
                id: newsletter.id,
                name: newsletter.name,
                isNewsletter: true,
              });
              WPP.whatsapp.ChatStore.add(chat);
            }

            // Ahora sendFileMessage debería encontrar el chat
            return await WPP.chat.sendFileMessage(wid, base64, {
              filename,
              caption,
              waitForAck: true,
            });
          },
          { wid, base64, filename, caption }
        );

        res.status(201).json({
          status: 'success',
          response: result,
          session: req.client.session
        });
      } catch (error: any) {
        req.logger.error('Error sending file to newsletter:', error);
        res.status(500).json({
          status: 'Error',
          message: 'Erro ao enviar o arquivo para o newsletter.',
          error: {
            name: error.name,
            message: error.message,
            level: 'error'
          },
          session: req.client.session
        });
      }
    }
  );

  // ============================
  //   SEND IMAGE STORIE (BASE64)
  // ============================
  app.post('/custom/:session/send-image-storie-base64',
    verifyToken,
    async (req: any, res) => {
      let tempFilePath = '';
      try {
        const { base64 } = req.body;

        if (!base64) {
          return res.status(400).json({
            status: 'Error',
            message: 'Campo "base64" es requerido',
            session: req.client?.session
          });
        }

        req.logger.info(`Sending image status (storie) using native API and temp file`);

        // Extraer el base64 real (quitar el prefijo data:image/...)
        const matches = base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        const buffer = matches
          ? Buffer.from(matches[2], 'base64')
          : Buffer.from(base64, 'base64');

        // Crear un archivo temporal único
        const tempFileName = `storie_${Crypto.randomBytes(8).toString('hex')}.jpg`;
        tempFilePath = path.join('/tmp', tempFileName);

        fs.writeFileSync(tempFilePath, buffer);

        // Usar la librería oficial de WppConnect que es mucho más estable
        const result = await req.client.sendImageStatus(tempFilePath);

        res.status(201).json({
          status: 'success',
          response: result,
          session: req.client.session
        });
      } catch (error: any) {
        req.logger.error('Error sending base64 image status:', error);
        res.status(500).json({
          status: 'Error',
          message: 'Erro ao enviar o status de imagen.',
          error: {
            name: error.name,
            message: error.message,
            level: 'error'
          },
          session: req.client.session
        });
      } finally {
        // Limpiar el archivo temporal
        if (tempFilePath && fs.existsSync(tempFilePath)) {
          try {
            fs.unlinkSync(tempFilePath);
          } catch (e) {
            req.logger.error('Error deleting temp storie file:', e);
          }
        }
      }
    }
  );

}
