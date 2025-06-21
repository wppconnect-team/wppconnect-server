/**
 * Serviço de monitoramento de arquivos de sessão do WppConnect
 * Monitora a pasta de tokens e sincroniza com PostgreSQL
 */

const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const SessionDatabase = require('./database');

class SessionManager {
  constructor(tokensDir = './wppconnect_tokens') {
    this.tokensDir = path.resolve(tokensDir);
    this.database = new SessionDatabase();
    this.watcher = null;
    this.isInitialized = false;
  }

  /**
   * Inicializa o gerenciador de sessões
   */
  async initialize() {
    try {
      // Garantir que o diretório de tokens existe
      if (!fs.existsSync(this.tokensDir)) {
        fs.mkdirSync(this.tokensDir, { recursive: true });
        console.log(`Diretório de tokens criado: ${this.tokensDir}`);
      }

      // Restaurar sessões existentes do banco de dados
      await this.restoreAllSessions();

      // Iniciar monitoramento de arquivos
      this.startFileWatcher();

      this.isInitialized = true;
      console.log('SessionManager inicializado com sucesso');
    } catch (error) {
      console.error('Erro ao inicializar SessionManager:', error);
      throw error;
    }
  }

  /**
   * Restaura todas as sessões do banco de dados para o sistema de arquivos
   */
  async restoreAllSessions() {
    try {
      const sessions = await this.database.listSessions();
      console.log(`Encontradas ${sessions.length} sessões no banco de dados`);

      for (const session of sessions) {
        await this.database.restoreSession(session.session_name, this.tokensDir);
      }

      console.log('Todas as sessões foram restauradas do banco de dados');
    } catch (error) {
      console.error('Erro ao restaurar sessões:', error);
      throw error;
    }
  }

  /**
   * Inicia o monitoramento de arquivos na pasta de tokens
   */
  startFileWatcher() {
    // Padrões de arquivos a serem monitorados (arquivos de sessão do WppConnect)
    const watchPatterns = [
      path.join(this.tokensDir, '**/*.data.json'),
      path.join(this.tokensDir, '**/*.session'),
      path.join(this.tokensDir, '**/**/Default/**'),
      path.join(this.tokensDir, '**/**/session_store/**')
    ];

    this.watcher = chokidar.watch(watchPatterns, {
      ignored: /(^|[\/\\])\../, // ignorar arquivos ocultos
      persistent: true,
      ignoreInitial: false,
      depth: 10
    });

    this.watcher
      .on('add', (filePath) => this.handleFileChange('add', filePath))
      .on('change', (filePath) => this.handleFileChange('change', filePath))
      .on('unlink', (filePath) => this.handleFileChange('unlink', filePath))
      .on('error', (error) => console.error('Erro no watcher:', error));

    console.log(`Monitoramento de arquivos iniciado em: ${this.tokensDir}`);
  }

  /**
   * Manipula mudanças nos arquivos de sessão
   * @param {string} event - Tipo de evento (add, change, unlink)
   * @param {string} filePath - Caminho do arquivo
   */
  async handleFileChange(event, filePath) {
    try {
      const sessionName = this.extractSessionName(filePath);
      
      if (!sessionName) {
        return; // Ignorar arquivos que não são de sessão
      }

      console.log(`Arquivo ${event}: ${filePath} (sessão: ${sessionName})`);

      switch (event) {
        case 'add':
        case 'change':
          // Aguardar um pouco para garantir que o arquivo foi completamente escrito
          setTimeout(async () => {
            try {
              await this.database.saveSession(sessionName, filePath);
            } catch (error) {
              console.error(`Erro ao salvar sessão ${sessionName}:`, error);
            }
          }, 1000);
          break;

        case 'unlink':
          // Não remover do banco quando arquivo é deletado localmente
          // Isso permite recuperação em caso de perda de dados
          console.log(`Arquivo de sessão ${sessionName} removido localmente, mantendo no banco`);
          break;
      }
    } catch (error) {
      console.error('Erro ao processar mudança de arquivo:', error);
    }
  }

  /**
   * Extrai o nome da sessão a partir do caminho do arquivo
   * @param {string} filePath - Caminho do arquivo
   * @returns {string|null} - Nome da sessão ou null se não for um arquivo de sessão
   */
  extractSessionName(filePath) {
    const relativePath = path.relative(this.tokensDir, filePath);
    const pathParts = relativePath.split(path.sep);

    // O nome da sessão geralmente é o primeiro diretório após tokens
    if (pathParts.length > 0 && pathParts[0] !== '.' && pathParts[0] !== '..') {
      return pathParts[0];
    }

    return null;
  }

  /**
   * Força a sincronização de uma sessão específica
   * @param {string} sessionName - Nome da sessão
   */
  async syncSession(sessionName) {
    try {
      const sessionDir = path.join(this.tokensDir, sessionName);
      
      if (!fs.existsSync(sessionDir)) {
        // Tentar restaurar do banco de dados
        const restored = await this.database.restoreSession(sessionName, this.tokensDir);
        if (restored) {
          console.log(`Sessão ${sessionName} restaurada do banco de dados`);
          return true;
        } else {
          console.log(`Sessão ${sessionName} não encontrada nem localmente nem no banco`);
          return false;
        }
      }

      // Encontrar arquivos de sessão no diretório
      const sessionFiles = this.findSessionFiles(sessionDir);
      
      for (const filePath of sessionFiles) {
        await this.database.saveSession(sessionName, filePath);
      }

      console.log(`Sessão ${sessionName} sincronizada com sucesso`);
      return true;
    } catch (error) {
      console.error(`Erro ao sincronizar sessão ${sessionName}:`, error);
      return false;
    }
  }

  /**
   * Encontra arquivos de sessão em um diretório
   * @param {string} sessionDir - Diretório da sessão
   * @returns {Array} - Lista de caminhos de arquivos de sessão
   */
  findSessionFiles(sessionDir) {
    const sessionFiles = [];
    
    try {
      const files = fs.readdirSync(sessionDir, { withFileTypes: true });
      
      for (const file of files) {
        const filePath = path.join(sessionDir, file.name);
        
        if (file.isFile() && (
          file.name.endsWith('.data.json') ||
          file.name.endsWith('.session') ||
          file.name.includes('session')
        )) {
          sessionFiles.push(filePath);
        } else if (file.isDirectory()) {
          // Recursivamente procurar em subdiretórios
          sessionFiles.push(...this.findSessionFiles(filePath));
        }
      }
    } catch (error) {
      console.error(`Erro ao ler diretório ${sessionDir}:`, error);
    }

    return sessionFiles;
  }

  /**
   * Lista todas as sessões disponíveis
   * @returns {Object} - Objeto com sessões locais e do banco
   */
  async listAllSessions() {
    try {
      const localSessions = this.getLocalSessions();
      const dbSessions = await this.database.listSessions();

      return {
        local: localSessions,
        database: dbSessions,
        total: {
          local: localSessions.length,
          database: dbSessions.length
        }
      };
    } catch (error) {
      console.error('Erro ao listar sessões:', error);
      throw error;
    }
  }

  /**
   * Obtém lista de sessões locais
   * @returns {Array} - Lista de sessões locais
   */
  getLocalSessions() {
    try {
      if (!fs.existsSync(this.tokensDir)) {
        return [];
      }

      const items = fs.readdirSync(this.tokensDir, { withFileTypes: true });
      return items
        .filter(item => item.isDirectory())
        .map(item => ({
          name: item.name,
          path: path.join(this.tokensDir, item.name)
        }));
    } catch (error) {
      console.error('Erro ao obter sessões locais:', error);
      return [];
    }
  }

  /**
   * Remove uma sessão (local e do banco)
   * @param {string} sessionName - Nome da sessão
   */
  async removeSession(sessionName) {
    try {
      const sessionDir = path.join(this.tokensDir, sessionName);
      
      // Remover arquivos locais
      if (fs.existsSync(sessionDir)) {
        fs.rmSync(sessionDir, { recursive: true, force: true });
        console.log(`Arquivos locais da sessão ${sessionName} removidos`);
      }

      // Remover do banco de dados
      await this.database.deleteSession(sessionName);
      
      console.log(`Sessão ${sessionName} removida completamente`);
      return true;
    } catch (error) {
      console.error(`Erro ao remover sessão ${sessionName}:`, error);
      return false;
    }
  }

  /**
   * Para o monitoramento e fecha conexões
   */
  async stop() {
    try {
      if (this.watcher) {
        await this.watcher.close();
        console.log('Monitoramento de arquivos parado');
      }

      await this.database.close();
      console.log('SessionManager parado com sucesso');
    } catch (error) {
      console.error('Erro ao parar SessionManager:', error);
    }
  }
}

module.exports = SessionManager;

