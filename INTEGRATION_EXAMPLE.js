/**
 * EXEMPLO DE MODIFICAÇÃO DO ARQUIVO server.ts/server.js
 * 
 * Este arquivo mostra como integrar a persistência PostgreSQL
 * ao servidor WppConnect existente.
 * 
 * INSTRUÇÕES:
 * 1. Adicione as importações no início do seu arquivo server.ts/server.js
 * 2. Inicialize a integração antes de configurar as rotas
 * 3. Configure a integração com o Express
 * 4. Modifique a criação de clientes WppConnect (se aplicável)
 */

// ==========================================
// 1. ADICIONAR NO INÍCIO DO ARQUIVO
// ==========================================

const {
  initializePostgreSQLIntegration,
  setupExpressIntegration,
  wrapWppConnectCreate,
  setupGracefulShutdown
} = require('./postgresqlIntegration');

// ==========================================
// 2. MODIFICAR A INICIALIZAÇÃO DO SERVIDOR
// ==========================================

async function startServer() {
  try {
    // Suas configurações existentes do Express
    const app = express();
    
    // ... outras configurações do Express ...
    
    // ADICIONAR: Inicializar integração PostgreSQL
    console.log('Inicializando integração PostgreSQL...');
    await initializePostgreSQLIntegration();
    
    // ADICIONAR: Configurar integração com Express
    setupExpressIntegration(app);
    
    // ... resto da configuração do servidor ...
    
    // ADICIONAR: Configurar graceful shutdown
    setupGracefulShutdown();
    
    // Iniciar servidor
    const port = process.env.PORT || 3000;
    app.listen(port, '0.0.0.0', () => {
      console.log(`🚀 Servidor WppConnect rodando na porta ${port}`);
      console.log(`📊 Swagger disponível em: http://localhost:${port}/api-docs`);
      console.log(`🔗 Gerenciamento de sessões: http://localhost:${port}/api/sessions/status`);
    });
    
  } catch (error) {
    console.error('Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

// ==========================================
// 3. SE VOCÊ USAR CRIAÇÃO CUSTOMIZADA DE CLIENTES
// ==========================================

// ANTES (exemplo):
// const client = await wppconnect.create(sessionName, options);

// DEPOIS:
// const createClient = wrapWppConnectCreate(wppconnect.create);
// const client = await createClient(sessionName, options);

// ==========================================
// 4. EXEMPLO COMPLETO DE INTEGRAÇÃO
// ==========================================

/*
const express = require('express');
const wppconnect = require('@wppconnect-team/wppconnect');
const {
  initializePostgreSQLIntegration,
  setupExpressIntegration,
  wrapWppConnectCreate,
  setupGracefulShutdown
} = require('./postgresqlIntegration');

async function main() {
  const app = express();
  
  // Configurações básicas do Express
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Inicializar integração PostgreSQL
  await initializePostgreSQLIntegration();
  
  // Configurar integração com Express
  setupExpressIntegration(app);
  
  // Wrapper para criação de clientes (opcional)
  const createClient = wrapWppConnectCreate(wppconnect.create);
  
  // Suas rotas existentes...
  app.post('/api/:session/start-session', async (req, res) => {
    try {
      const { session } = req.params;
      const client = await createClient(session, {
        // suas opções...
      });
      
      res.json({ message: 'Sessão iniciada com sucesso' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Configurar graceful shutdown
  setupGracefulShutdown();
  
  // Iniciar servidor
  const port = process.env.PORT || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Servidor rodando na porta ${port}`);
  });
}

main().catch(console.error);
*/

// ==========================================
// 5. NOVAS ROTAS DISPONÍVEIS APÓS INTEGRAÇÃO
// ==========================================

/*
GET    /api/sessions/list           - Lista todas as sessões (local + banco)
POST   /api/sessions/:name/sync     - Sincroniza sessão específica
POST   /api/sessions/:name/restore  - Restaura sessão do banco
DELETE /api/sessions/:name          - Remove sessão (local + banco)
GET    /api/sessions/status         - Status do sistema de persistência
*/

module.exports = {
  // Exportar funções se necessário para outros módulos
};

