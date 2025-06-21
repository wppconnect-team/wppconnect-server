/**
 * Middleware de integração entre WppConnect e PostgreSQL
 * Intercepta eventos de sessão e gerencia persistência
 */

const SessionManager = require('./sessionManager');

class WppConnectIntegration {
  constructor() {
    this.sessionManager = null;
    this.isInitialized = false;
  }

  /**
   * Inicializa a integração
   */
  async initialize() {
    try {
      this.sessionManager = new SessionManager();
      await this.sessionManager.initialize();
      this.isInitialized = true;
      console.log('WppConnect Integration inicializada com sucesso');
    } catch (error) {
      console.error('Erro ao inicializar WppConnect Integration:', error);
      throw error;
    }
  }

  /**
   * Middleware para interceptar criação de clientes WppConnect
   * @param {Function} originalCreate - Função original de criação do cliente
   * @returns {Function} - Função modificada
   */
  wrapClientCreation(originalCreate) {
    return async (sessionName, options = {}) => {
      try {
        console.log(`Iniciando sessão WppConnect: ${sessionName}`);

        // Tentar restaurar sessão do banco antes de criar nova
        if (this.isInitialized) {
          await this.sessionManager.syncSession(sessionName);
        }

        // Modificar opções para usar diretório de tokens correto
        const modifiedOptions = {
          ...options,
          folderNameToken: this.sessionManager ? this.sessionManager.tokensDir : './wppconnect_tokens',
          session: sessionName
        };

        // Criar cliente com opções modificadas
        const client = await originalCreate(sessionName, modifiedOptions);

        // Configurar eventos de sessão
        this.setupSessionEvents(client, sessionName);

        return client;
      } catch (error) {
        console.error(`Erro ao criar cliente WppConnect para sessão ${sessionName}:`, error);
        throw error;
      }
    };
  }

  /**
   * Configura eventos de sessão do cliente WppConnect
   * @param {Object} client - Cliente WppConnect
   * @param {string} sessionName - Nome da sessão
   */
  setupSessionEvents(client, sessionName) {
    if (!client || !this.isInitialized) {
      return;
    }

    // Evento quando a sessão é autenticada
    client.onStateChange((state) => {
      console.log(`Estado da sessão ${sessionName}: ${state}`);
      
      if (state === 'CONNECTED' || state === 'AUTHENTICATED') {
        // Forçar sincronização quando conectado
        setTimeout(async () => {
          try {
            await this.sessionManager.syncSession(sessionName);
            console.log(`Sessão ${sessionName} sincronizada após conexão`);
          } catch (error) {
            console.error(`Erro ao sincronizar sessão ${sessionName}:`, error);
          }
        }, 2000);
      }
    });

    // Evento quando QR code é gerado
    client.onQRCode((qrCode) => {
      console.log(`QR Code gerado para sessão ${sessionName}`);
      // Aqui você pode adicionar lógica adicional se necessário
    });

    // Evento quando a sessão é desconectada
    client.onDisconnected((reason) => {
      console.log(`Sessão ${sessionName} desconectada: ${reason}`);
      // Manter dados no banco mesmo quando desconectado
    });
  }

  /**
   * Middleware para rotas de API relacionadas a sessões
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   */
  async sessionApiMiddleware(req, res, next) {
    try {
      // Adicionar métodos de gerenciamento de sessão ao request
      req.sessionManager = {
        list: () => this.sessionManager?.listAllSessions(),
        sync: (sessionName) => this.sessionManager?.syncSession(sessionName),
        remove: (sessionName) => this.sessionManager?.removeSession(sessionName),
        restore: (sessionName) => this.sessionManager?.database?.restoreSession(sessionName, this.sessionManager.tokensDir)
      };

      next();
    } catch (error) {
      console.error('Erro no middleware de sessão:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Cria rotas adicionais para gerenciamento de sessões
   * @param {Object} app - Express app
   */
  setupAdditionalRoutes(app) {
    // Rota para listar todas as sessões
    app.get('/api/sessions/list', async (req, res) => {
      try {
        if (!this.isInitialized) {
          return res.status(503).json({ error: 'Serviço não inicializado' });
        }

        const sessions = await this.sessionManager.listAllSessions();
        res.json(sessions);
      } catch (error) {
        console.error('Erro ao listar sessões:', error);
        res.status(500).json({ error: 'Erro ao listar sessões' });
      }
    });

    // Rota para sincronizar uma sessão específica
    app.post('/api/sessions/:sessionName/sync', async (req, res) => {
      try {
        if (!this.isInitialized) {
          return res.status(503).json({ error: 'Serviço não inicializado' });
        }

        const { sessionName } = req.params;
        const success = await this.sessionManager.syncSession(sessionName);
        
        if (success) {
          res.json({ message: `Sessão ${sessionName} sincronizada com sucesso` });
        } else {
          res.status(404).json({ error: `Sessão ${sessionName} não encontrada` });
        }
      } catch (error) {
        console.error('Erro ao sincronizar sessão:', error);
        res.status(500).json({ error: 'Erro ao sincronizar sessão' });
      }
    });

    // Rota para restaurar uma sessão do banco
    app.post('/api/sessions/:sessionName/restore', async (req, res) => {
      try {
        if (!this.isInitialized) {
          return res.status(503).json({ error: 'Serviço não inicializado' });
        }

        const { sessionName } = req.params;
        const restored = await this.sessionManager.database.restoreSession(
          sessionName, 
          this.sessionManager.tokensDir
        );
        
        if (restored) {
          res.json({ 
            message: `Sessão ${sessionName} restaurada com sucesso`,
            path: restored
          });
        } else {
          res.status(404).json({ error: `Sessão ${sessionName} não encontrada no banco` });
        }
      } catch (error) {
        console.error('Erro ao restaurar sessão:', error);
        res.status(500).json({ error: 'Erro ao restaurar sessão' });
      }
    });

    // Rota para remover uma sessão
    app.delete('/api/sessions/:sessionName', async (req, res) => {
      try {
        if (!this.isInitialized) {
          return res.status(503).json({ error: 'Serviço não inicializado' });
        }

        const { sessionName } = req.params;
        const success = await this.sessionManager.removeSession(sessionName);
        
        if (success) {
          res.json({ message: `Sessão ${sessionName} removida com sucesso` });
        } else {
          res.status(500).json({ error: `Erro ao remover sessão ${sessionName}` });
        }
      } catch (error) {
        console.error('Erro ao remover sessão:', error);
        res.status(500).json({ error: 'Erro ao remover sessão' });
      }
    });

    // Rota para status do sistema de persistência
    app.get('/api/sessions/status', (req, res) => {
      res.json({
        initialized: this.isInitialized,
        tokensDir: this.sessionManager?.tokensDir,
        timestamp: new Date().toISOString()
      });
    });

    console.log('Rotas adicionais de gerenciamento de sessão configuradas');
  }

  /**
   * Para a integração
   */
  async stop() {
    try {
      if (this.sessionManager) {
        await this.sessionManager.stop();
      }
      this.isInitialized = false;
      console.log('WppConnect Integration parada com sucesso');
    } catch (error) {
      console.error('Erro ao parar WppConnect Integration:', error);
    }
  }
}

// Singleton instance
const wppConnectIntegration = new WppConnectIntegration();

module.exports = wppConnectIntegration;

