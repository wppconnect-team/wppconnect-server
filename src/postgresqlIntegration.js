/**
 * Script de inicialização para integração PostgreSQL com WppConnect
 * Este arquivo deve ser importado no início do servidor WppConnect
 */

const wppIntegration = require('./config/wppIntegration');

/**
 * Inicializa a integração PostgreSQL
 */
async function initializePostgreSQLIntegration() {
  try {
    console.log('🔄 Inicializando integração PostgreSQL para WppConnect...');
    
    // Inicializar a integração
    await wppIntegration.initialize();
    
    console.log('✅ Integração PostgreSQL inicializada com sucesso!');
    console.log('📁 Arquivos de sessão serão automaticamente persistidos no PostgreSQL');
    
    return wppIntegration;
  } catch (error) {
    console.error('❌ Erro ao inicializar integração PostgreSQL:', error);
    throw error;
  }
}

/**
 * Configura a integração com o servidor Express
 * @param {Object} app - Instância do Express
 */
function setupExpressIntegration(app) {
  try {
    // Adicionar middleware de sessão
    app.use('/api', wppIntegration.sessionApiMiddleware.bind(wppIntegration));
    
    // Configurar rotas adicionais
    wppIntegration.setupAdditionalRoutes(app);
    
    console.log('🌐 Rotas de gerenciamento de sessão configuradas');
  } catch (error) {
    console.error('❌ Erro ao configurar integração Express:', error);
    throw error;
  }
}

/**
 * Wrapper para função de criação de cliente WppConnect
 * @param {Function} originalCreateFunction - Função original do WppConnect
 * @returns {Function} - Função modificada
 */
function wrapWppConnectCreate(originalCreateFunction) {
  return wppIntegration.wrapClientCreation(originalCreateFunction);
}

/**
 * Graceful shutdown
 */
function setupGracefulShutdown() {
  const shutdown = async (signal) => {
    console.log(`\n🛑 Recebido sinal ${signal}, encerrando graciosamente...`);
    
    try {
      await wppIntegration.stop();
      console.log('✅ Integração PostgreSQL encerrada com sucesso');
      process.exit(0);
    } catch (error) {
      console.error('❌ Erro durante encerramento:', error);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGUSR2', () => shutdown('SIGUSR2')); // Para nodemon
}

module.exports = {
  initializePostgreSQLIntegration,
  setupExpressIntegration,
  wrapWppConnectCreate,
  setupGracefulShutdown,
  wppIntegration
};

