#!/usr/bin/env node

/**
 * Script de migração para configurar o banco PostgreSQL
 * para persistência de sessões do WppConnect
 */

const { Pool } = require('pg');

async function runMigration() {
  let pool;
  
  try {
    console.log('🔄 Iniciando migração do banco de dados...');
    
    // Configurar conexão
    const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    
    if (!databaseUrl) {
      console.error('❌ DATABASE_URL ou POSTGRES_URL não encontrada nas variáveis de ambiente');
      console.log('💡 Certifique-se de que a variável DATABASE_URL está configurada no Railway');
      process.exit(1);
    }
    
    pool = new Pool({
      connectionString: databaseUrl,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    
    console.log('✅ Conexão com PostgreSQL estabelecida');
    
    // Criar tabela de sessões
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
      CREATE INDEX IF NOT EXISTS idx_updated_at ON wpp_sessions(updated_at);
    `;
    
    await pool.query(createTableQuery);
    console.log('✅ Tabela wpp_sessions criada/verificada com sucesso');
    
    // Verificar se existem sessões
    const countResult = await pool.query('SELECT COUNT(*) FROM wpp_sessions');
    const sessionCount = parseInt(countResult.rows[0].count);
    
    console.log(`📊 Total de sessões no banco: ${sessionCount}`);
    
    if (sessionCount > 0) {
      const sessionsResult = await pool.query(`
        SELECT session_name, created_at, updated_at 
        FROM wpp_sessions 
        ORDER BY updated_at DESC 
        LIMIT 5
      `);
      
      console.log('📋 Últimas sessões:');
      sessionsResult.rows.forEach(session => {
        console.log(`   - ${session.session_name} (atualizada: ${session.updated_at})`);
      });
    }
    
    console.log('🎉 Migração concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    
    if (error.code === 'ENOTFOUND') {
      console.log('💡 Verifique se a URL do banco de dados está correta');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('💡 Verifique se o banco PostgreSQL está rodando e acessível');
    } else if (error.code === '28P01') {
      console.log('💡 Erro de autenticação - verifique usuário e senha');
    }
    
    process.exit(1);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

// Executar migração se chamado diretamente
if (require.main === module) {
  runMigration();
}

module.exports = { runMigration };

