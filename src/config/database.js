/**
 * Configuração de banco de dados para persistência de sessões do WppConnect
 * Este módulo gerencia a conexão com PostgreSQL e operações de sessão
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

class SessionDatabase {
  constructor() {
    this.pool = null;
    this.initDatabase();
  }

  /**
   * Inicializa a conexão com o banco de dados PostgreSQL
   */
  async initDatabase() {
    try {
      // Configuração da conexão PostgreSQL usando variáveis de ambiente
      const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
      
      if (!databaseUrl) {
        console.warn('DATABASE_URL não encontrada. Usando configuração padrão.');
        this.pool = new Pool({
          host: process.env.DB_HOST || 'localhost',
          port: process.env.DB_PORT || 5432,
          database: process.env.DB_NAME || 'wppconnect',
          user: process.env.DB_USER || 'postgres',
          password: process.env.DB_PASSWORD || 'password',
        });
      } else {
        this.pool = new Pool({
          connectionString: databaseUrl,
          ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });
      }

      // Criar tabela de sessões se não existir
      await this.createSessionTable();
      console.log('Conexão com PostgreSQL estabelecida com sucesso');
    } catch (error) {
      console.error('Erro ao conectar com PostgreSQL:', error);
      throw error;
    }
  }

  /**
   * Cria a tabela de sessões no banco de dados
   */
  async createSessionTable() {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS wpp_sessions (
        id SERIAL PRIMARY KEY,
        session_name VARCHAR(255) UNIQUE NOT NULL,
        session_data BYTEA NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_session_name ON wpp_sessions(session_name);
    `;

    try {
      await this.pool.query(createTableQuery);
      console.log('Tabela wpp_sessions criada/verificada com sucesso');
    } catch (error) {
      console.error('Erro ao criar tabela de sessões:', error);
      throw error;
    }
  }

  /**
   * Salva uma sessão no banco de dados
   * @param {string} sessionName - Nome da sessão
   * @param {string} filePath - Caminho do arquivo de sessão
   */
  async saveSession(sessionName, filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`Arquivo de sessão não encontrado: ${filePath}`);
      }

      const fileData = fs.readFileSync(filePath);
      const fileName = path.basename(filePath);

      const query = `
        INSERT INTO wpp_sessions (session_name, session_data, file_name, updated_at)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
        ON CONFLICT (session_name)
        DO UPDATE SET 
          session_data = EXCLUDED.session_data,
          file_name = EXCLUDED.file_name,
          updated_at = CURRENT_TIMESTAMP
      `;

      await this.pool.query(query, [sessionName, fileData, fileName]);
      console.log(`Sessão ${sessionName} salva no banco de dados`);
    } catch (error) {
      console.error(`Erro ao salvar sessão ${sessionName}:`, error);
      throw error;
    }
  }

  /**
   * Recupera uma sessão do banco de dados
   * @param {string} sessionName - Nome da sessão
   * @param {string} targetDir - Diretório onde salvar o arquivo
   * @returns {string|null} - Caminho do arquivo restaurado ou null se não encontrado
   */
  async restoreSession(sessionName, targetDir) {
    try {
      const query = 'SELECT session_data, file_name FROM wpp_sessions WHERE session_name = $1';
      const result = await this.pool.query(query, [sessionName]);

      if (result.rows.length === 0) {
        console.log(`Sessão ${sessionName} não encontrada no banco de dados`);
        return null;
      }

      const { session_data, file_name } = result.rows[0];
      
      // Garantir que o diretório existe
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const filePath = path.join(targetDir, file_name);
      fs.writeFileSync(filePath, session_data);

      console.log(`Sessão ${sessionName} restaurada para ${filePath}`);
      return filePath;
    } catch (error) {
      console.error(`Erro ao restaurar sessão ${sessionName}:`, error);
      throw error;
    }
  }

  /**
   * Lista todas as sessões salvas
   * @returns {Array} - Lista de sessões
   */
  async listSessions() {
    try {
      const query = 'SELECT session_name, file_name, created_at, updated_at FROM wpp_sessions ORDER BY updated_at DESC';
      const result = await this.pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Erro ao listar sessões:', error);
      throw error;
    }
  }

  /**
   * Remove uma sessão do banco de dados
   * @param {string} sessionName - Nome da sessão
   */
  async deleteSession(sessionName) {
    try {
      const query = 'DELETE FROM wpp_sessions WHERE session_name = $1';
      const result = await this.pool.query(query, [sessionName]);
      
      if (result.rowCount > 0) {
        console.log(`Sessão ${sessionName} removida do banco de dados`);
        return true;
      } else {
        console.log(`Sessão ${sessionName} não encontrada para remoção`);
        return false;
      }
    } catch (error) {
      console.error(`Erro ao remover sessão ${sessionName}:`, error);
      throw error;
    }
  }

  /**
   * Fecha a conexão com o banco de dados
   */
  async close() {
    if (this.pool) {
      await this.pool.end();
      console.log('Conexão com PostgreSQL fechada');
    }
  }
}

module.exports = SessionDatabase;

