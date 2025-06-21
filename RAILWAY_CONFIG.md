# Configuração para Railway - WppConnect com PostgreSQL

## Variáveis de Ambiente Necessárias

### 1. Remover/Modificar variáveis existentes:
```
# REMOVER estas variáveis (não são mais necessárias):
DATABASE_TYPE=mongo
MONGO_URL=mongodb+srv://...

# MANTER estas variáveis:
CHROME_ARGS=--no-sandbox
PORT=3000
START_ALL_SESSIONS=true
WEBHOOK_HEADERS=Bearer $2b$10$kaJUaqTwZCeQcpSZ1XOmDu7pkhh
WEBHOOK_URL=https://primary-production-eb42.up.railway.app/...
```

### 2. Adicionar nova variável (Railway já deve ter):
```
DATABASE_URL=postgres://railway:6efvw1TzJasBWaQWcnk92F...
```

## Scripts de Deploy

### 1. Adicionar ao package.json:
```json
{
  "scripts": {
    "migrate": "node migrate.js",
    "start": "npm run migrate && node ./dist/server.js",
    "dev": "npm run migrate && tsx watch src/server.ts"
  }
}
```

### 2. Comando de build no Railway:
```bash
npm run build
```

### 3. Comando de start no Railway:
```bash
npm start
```

## Estrutura de Arquivos Adicionados

```
src/
├── config/
│   ├── database.js          # Gerenciamento PostgreSQL
│   ├── sessionManager.js    # Monitoramento de arquivos
│   └── wppIntegration.js    # Integração com WppConnect
├── postgresqlIntegration.js # Script principal de integração
└── server.ts/js            # Arquivo principal (modificar)

migrate.js                   # Script de migração
INTEGRATION_EXAMPLE.js       # Exemplo de integração
```

## Novas Rotas Disponíveis

Após a integração, as seguintes rotas estarão disponíveis:

```
GET    /api/sessions/list           # Lista todas as sessões
POST   /api/sessions/:name/sync     # Sincroniza sessão específica
POST   /api/sessions/:name/restore  # Restaura sessão do banco
DELETE /api/sessions/:name          # Remove sessão
GET    /api/sessions/status         # Status do sistema
```

## Como Testar

1. **Verificar status do sistema:**
   ```
   GET https://seu-app.up.railway.app/api/sessions/status
   ```

2. **Listar sessões:**
   ```
   GET https://seu-app.up.railway.app/api/sessions/list
   ```

3. **Criar uma sessão via Swagger:**
   ```
   POST https://seu-app.up.railway.app/api/mySession/start-session
   ```

4. **Verificar se a sessão foi salva:**
   ```
   GET https://seu-app.up.railway.app/api/sessions/list
   ```

## Logs Importantes

Procure por estas mensagens nos logs do Railway:

```
✅ Integração PostgreSQL inicializada com sucesso!
📁 Arquivos de sessão serão automaticamente persistidos no PostgreSQL
🌐 Rotas de gerenciamento de sessão configuradas
Sessão [nome] salva no banco de dados
Sessão [nome] restaurada do banco de dados
```

## Troubleshooting

### Erro de conexão com banco:
- Verifique se DATABASE_URL está configurada
- Confirme que o serviço PostgreSQL está ativo no Railway

### Sessões não persistem:
- Verifique logs para mensagens de erro
- Teste a rota `/api/sessions/status`
- Confirme que a migração foi executada

### Arquivos não são monitorados:
- Verifique se a pasta `wppconnect_tokens` existe
- Confirme que o chokidar está funcionando nos logs

## Benefícios da Implementação

1. **Persistência Automática:** Sessões são salvas automaticamente no PostgreSQL
2. **Recuperação Automática:** Sessões são restauradas na inicialização
3. **Monitoramento em Tempo Real:** Arquivos são sincronizados conforme são modificados
4. **API de Gerenciamento:** Rotas para gerenciar sessões programaticamente
5. **Graceful Shutdown:** Encerramento seguro preserva dados
6. **Compatibilidade:** Funciona com o WppConnect existente sem quebrar funcionalidades

