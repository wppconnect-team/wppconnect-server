#!/usr/bin/env node

/**
 * Script de teste para validar a integração PostgreSQL
 * com WppConnect no ambiente Railway
 */

const fs = require('fs');
const path = require('path');

// Simular variáveis de ambiente do Railway
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgres://railway:6efvw1TzJasBWaQWcnk92F@viaduct.proxy.rlwy.net:12345/railway';
process.env.NODE_ENV = 'production';

const SessionDatabase = require('./src/config/database');
const SessionManager = require('./src/config/sessionManager');

async function runTests() {
  console.log('🧪 Iniciando testes de integração PostgreSQL...\n');
  
  let database;
  let sessionManager;
  
  try {
    // Teste 1: Conexão com banco de dados
    console.log('📝 Teste 1: Conexão com PostgreSQL');
    database = new SessionDatabase();
    await new Promise(resolve => setTimeout(resolve, 2000)); // Aguardar inicialização
    console.log('✅ Conexão estabelecida com sucesso\n');
    
    // Teste 2: Criação de sessão fictícia
    console.log('📝 Teste 2: Salvamento de sessão fictícia');
    const testSessionDir = './test_tokens/test_session';
    const testSessionFile = path.join(testSessionDir, 'session.data.json');
    
    // Criar diretório e arquivo de teste
    fs.mkdirSync(testSessionDir, { recursive: true });
    fs.writeFileSync(testSessionFile, JSON.stringify({
      sessionId: 'test_session_123',
      timestamp: new Date().toISOString(),
      data: 'test_session_data'
    }));
    
    await database.saveSession('test_session', testSessionFile);
    console.log('✅ Sessão fictícia salva com sucesso\n');
    
    // Teste 3: Recuperação de sessão
    console.log('📝 Teste 3: Recuperação de sessão');
    const restoreDir = './test_restore';
    const restoredFile = await database.restoreSession('test_session', restoreDir);
    
    if (restoredFile && fs.existsSync(restoredFile)) {
      console.log('✅ Sessão recuperada com sucesso');
      console.log(`   Arquivo restaurado: ${restoredFile}\n`);
    } else {
      throw new Error('Falha ao recuperar sessão');
    }
    
    // Teste 4: Listagem de sessões
    console.log('📝 Teste 4: Listagem de sessões');
    const sessions = await database.listSessions();
    console.log(`✅ Encontradas ${sessions.length} sessões no banco`);
    sessions.forEach(session => {
      console.log(`   - ${session.session_name} (${session.updated_at})`);
    });
    console.log('');
    
    // Teste 5: SessionManager
    console.log('📝 Teste 5: Inicialização do SessionManager');
    sessionManager = new SessionManager('./test_tokens');
    await sessionManager.initialize();
    console.log('✅ SessionManager inicializado com sucesso\n');
    
    // Teste 6: Sincronização de sessão
    console.log('📝 Teste 6: Sincronização de sessão');
    const syncResult = await sessionManager.syncSession('test_session');
    console.log(`✅ Sincronização: ${syncResult ? 'sucesso' : 'falha'}\n`);
    
    // Teste 7: Listagem completa
    console.log('📝 Teste 7: Listagem completa de sessões');
    const allSessions = await sessionManager.listAllSessions();
    console.log('✅ Listagem completa:');
    console.log(`   Sessões locais: ${allSessions.total.local}`);
    console.log(`   Sessões no banco: ${allSessions.total.database}\n`);
    
    // Limpeza
    console.log('🧹 Limpando dados de teste...');
    await database.deleteSession('test_session');
    fs.rmSync('./test_tokens', { recursive: true, force: true });
    fs.rmSync('./test_restore', { recursive: true, force: true });
    console.log('✅ Limpeza concluída\n');
    
    console.log('🎉 Todos os testes passaram com sucesso!');
    console.log('✅ A integração PostgreSQL está funcionando corretamente');
    
  } catch (error) {
    console.error('❌ Erro durante os testes:', error);
    
    // Sugestões de troubleshooting
    console.log('\n🔧 Troubleshooting:');
    
    if (error.code === 'ENOTFOUND') {
      console.log('   - Verifique a URL do banco de dados');
      console.log('   - Confirme que o PostgreSQL está rodando no Railway');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('   - Verifique se o banco PostgreSQL está acessível');
      console.log('   - Confirme as configurações de rede');
    } else if (error.code === '28P01') {
      console.log('   - Verifique as credenciais do banco de dados');
      console.log('   - Confirme a variável DATABASE_URL');
    } else {
      console.log(`   - Erro específico: ${error.message}`);
      console.log('   - Verifique os logs para mais detalhes');
    }
    
    process.exit(1);
  } finally {
    // Fechar conexões
    if (sessionManager) {
      await sessionManager.stop();
    }
    if (database) {
      await database.close();
    }
  }
}

// Função para testar variáveis de ambiente
function checkEnvironment() {
  console.log('🔍 Verificando variáveis de ambiente...\n');
  
  const requiredVars = ['DATABASE_URL'];
  const optionalVars = ['NODE_ENV', 'PORT'];
  
  console.log('📋 Variáveis obrigatórias:');
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      console.log(`   ✅ ${varName}: ${value.substring(0, 30)}...`);
    } else {
      console.log(`   ❌ ${varName}: NÃO DEFINIDA`);
    }
  });
  
  console.log('\n📋 Variáveis opcionais:');
  optionalVars.forEach(varName => {
    const value = process.env[varName];
    console.log(`   ${value ? '✅' : '⚠️'} ${varName}: ${value || 'não definida'}`);
  });
  
  console.log('');
}

// Executar testes se chamado diretamente
if (require.main === module) {
  checkEnvironment();
  runTests();
}

module.exports = { runTests, checkEnvironment };

