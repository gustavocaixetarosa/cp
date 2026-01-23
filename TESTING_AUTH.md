# Guia de Testes - Sistema de Autenticação

Este guia fornece instruções completas para testar o sistema de autenticação JWT implementado.

## Pré-requisitos

1. **Backend**: Spring Boot rodando na porta 8080
2. **Frontend**: Next.js rodando na porta 3000
3. **Banco de Dados**: PostgreSQL configurado
4. **Variáveis de Ambiente**: Configuradas conforme `env.example`

## Configuração para Testes

### 1. Configure as Variáveis de Ambiente

Crie o arquivo `.env` na raiz do projeto (ou use `env.development`):

```bash
# Credenciais de teste
AUTH_USER_EMAIL=admin@test.com
AUTH_USER_PASSWORD=Test123456!

# JWT Secret (para testes)
JWT_SECRET=test_secret_key_minimum_32_characters_here_for_testing
JWT_EXPIRATION_MS=3600000
```

### 2. Configure o Frontend

Crie `frontend/.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8080/v1
```

### 3. Inicie os Serviços

Terminal 1 - Backend:
```bash
cd backend
./mvnw clean install
./mvnw spring-boot:run
```

Terminal 2 - Frontend:
```bash
cd frontend
npm install
npm run dev
```

## Testes Funcionais

### Teste 1: Login com Credenciais Corretas ✅

**Objetivo**: Verificar que o login funciona com credenciais válidas.

**Passos**:
1. Acesse `http://localhost:3000`
2. Você deve ser redirecionado para `/login`
3. Preencha o formulário:
   - Email: `admin@test.com`
   - Senha: `Test123456!`
4. Clique em "Entrar"

**Resultado Esperado**:
- ✅ Redirecionamento para a página inicial `/`
- ✅ Sidebar visível
- ✅ Token armazenado no localStorage
- ✅ Sem erros no console

**Verificação**:
```javascript
// Abra o Console do navegador (F12)
console.log(localStorage.getItem('auth_token'));
// Deve mostrar um token JWT
```

---

### Teste 2: Login com Credenciais Incorretas ❌

**Objetivo**: Verificar que credenciais inválidas são rejeitadas.

**Passos**:
1. Acesse `http://localhost:3000/login`
2. Preencha com credenciais incorretas:
   - Email: `wrong@email.com`
   - Senha: `wrongpassword`
3. Clique em "Entrar"

**Resultado Esperado**:
- ✅ Mensagem de erro: "Credenciais inválidas"
- ✅ Permanece na página de login
- ✅ Nenhum token armazenado

---

### Teste 3: Validação de Formulário 📝

**Objetivo**: Verificar validação de campos.

**Passos**:
1. Acesse `/login`
2. Teste os cenários:

   a) **Email inválido**:
   - Email: `invalidemail`
   - Senha: `Test123456!`
   - Resultado: Erro "Email inválido"

   b) **Campos vazios**:
   - Deixe campos em branco
   - Resultado: Erros de validação

**Resultado Esperado**:
- ✅ Mensagens de validação aparecem
- ✅ Botão "Entrar" funciona apenas com dados válidos

---

### Teste 4: Acesso a Páginas Protegidas 🔒

**Objetivo**: Verificar que páginas requerem autenticação.

**Passos**:
1. Limpe o localStorage:
```javascript
localStorage.clear();
```
2. Tente acessar páginas protegidas:
   - `http://localhost:3000/`
   - `http://localhost:3000/clients`
   - `http://localhost:3000/payments`

**Resultado Esperado**:
- ✅ Redirecionamento automático para `/login`
- ✅ Mensagem ou tela de carregamento

---

### Teste 5: Persistência de Autenticação 💾

**Objetivo**: Verificar que o token persiste entre sessões.

**Passos**:
1. Faça login com credenciais corretas
2. Navegue para diferentes páginas
3. Feche a aba do navegador
4. Reabra `http://localhost:3000`

**Resultado Esperado**:
- ✅ Continua autenticado (não pede login novamente)
- ✅ Token ainda presente no localStorage
- ✅ Acesso direto às páginas

---

### Teste 6: Logout 🚪

**Objetivo**: Verificar que o logout remove a autenticação.

**Passos**:
1. Estando autenticado, clique no ícone de logout na sidebar
2. Verifique o redirecionamento

**Resultado Esperado**:
- ✅ Redirecionamento para `/login`
- ✅ Token removido do localStorage
- ✅ Acesso negado a páginas protegidas

**Verificação**:
```javascript
console.log(localStorage.getItem('auth_token'));
// Deve retornar null
```

---

### Teste 7: Requisições à API com Token 🔐

**Objetivo**: Verificar que APIs recebem o token JWT.

**Passos**:
1. Faça login
2. Navegue para `/clients` ou `/payments`
3. Abra DevTools → Network (F12)
4. Observe as requisições à API

**Resultado Esperado**:
- ✅ Header `Authorization: Bearer {token}` presente
- ✅ Requisições retornam 200 OK
- ✅ Dados são carregados corretamente

---

### Teste 8: Expiração de Token ⏰

**Objetivo**: Verificar comportamento quando o token expira.

**Configuração**: Reduza `JWT_EXPIRATION_MS` para 60000 (1 minuto) no `.env`

**Passos**:
1. Reinicie o backend
2. Faça login
3. Aguarde mais de 1 minuto
4. Tente acessar uma página ou fazer uma requisição

**Resultado Esperado**:
- ✅ Erro 401 Unauthorized
- ✅ Redirecionamento automático para `/login`
- ✅ Mensagem "Sessão expirada"

---

### Teste 9: Acesso Direto à Página de Login (quando já autenticado) 🔄

**Objetivo**: Verificar comportamento ao acessar `/login` já autenticado.

**Passos**:
1. Faça login normalmente
2. Na barra de endereços, digite `http://localhost:3000/login`

**Resultado Esperado**:
- ✅ Sidebar oculta na página de login (ou mostra login mesmo autenticado)
- ⚠️ Comportamento pode variar - ajuste conforme necessário

---

### Teste 10: Injeção de Token Inválido 🛡️

**Objetivo**: Verificar segurança contra tokens inválidos.

**Passos**:
1. Abra o Console (F12)
2. Injete um token falso:
```javascript
localStorage.setItem('auth_token', 'fake_invalid_token_12345');
```
3. Tente acessar uma página protegida

**Resultado Esperado**:
- ✅ Requisições falham com 401
- ✅ Redirecionamento para `/login`
- ✅ Token inválido é rejeitado pelo backend

---

## Testes de API (Backend)

### Teste 11: Endpoint de Login - POST /api/v1/auth/login

**Usando curl**:

```bash
# Credenciais corretas
curl -X POST http://localhost:8080/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"Test123456!"}'

# Esperado: {"token":"eyJ...", "type":"Bearer", "expiresIn":3600000}

# Credenciais incorretas
curl -X POST http://localhost:8080/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"wrong@test.com","password":"wrong"}'

# Esperado: {"message":"Credenciais inválidas"} com status 401
```

---

### Teste 12: Endpoint Protegido - GET /api/v1/client

**Sem token**:
```bash
curl -X GET http://localhost:8080/v1/client

# Esperado: 401 Unauthorized ou 403 Forbidden
```

**Com token**:
```bash
# Primeiro, obtenha o token do teste anterior
TOKEN="seu_token_aqui"

curl -X GET http://localhost:8080/v1/client \
  -H "Authorization: Bearer $TOKEN"

# Esperado: Lista de clientes (200 OK)
```

---

### Teste 13: Validação de Token - GET /api/v1/auth/validate

```bash
TOKEN="seu_token_aqui"

curl -X GET http://localhost:8080/v1/auth/validate \
  -H "Authorization: Bearer $TOKEN"

# Esperado: {"valid":true} com status 200
```

---

## Checklist de Testes Completos

Use este checklist para garantir que todos os testes foram executados:

- [ ] ✅ Login com credenciais corretas funciona
- [ ] ❌ Login com credenciais incorretas é rejeitado
- [ ] 📝 Validação de formulário funciona
- [ ] 🔒 Páginas protegidas requerem autenticação
- [ ] 💾 Token persiste entre sessões
- [ ] 🚪 Logout remove autenticação
- [ ] 🔐 Requisições à API incluem token
- [ ] ⏰ Token expirado é tratado corretamente
- [ ] 🔄 Página de login funciona quando já autenticado
- [ ] 🛡️ Tokens inválidos são rejeitados
- [ ] 🔧 Endpoint de login funciona via API
- [ ] 🔧 Endpoints protegidos requerem token
- [ ] 🔧 Validação de token funciona

---

## Solução de Problemas Durante Testes

### Erro: "Failed to fetch" ou CORS

**Solução**:
1. Verifique se o backend está rodando
2. Confirme `ALLOWED_ORIGINS` no backend inclui `http://localhost:3000`
3. Verifique `NEXT_PUBLIC_API_URL` no frontend

### Token não aparece no localStorage

**Solução**:
1. Verifique a resposta da API no Network tab
2. Confirme que `login()` em `lib/auth.ts` está sendo chamado
3. Verifique se há erros no console

### Redirect infinito para /login

**Solução**:
1. Limpe o localStorage: `localStorage.clear()`
2. Faça login novamente
3. Verifique se o token está sendo salvo

### Backend retorna 403 Forbidden

**Solução**:
1. Verifique configuração do `SecurityConfig.java`
2. Confirme que `/api/v1/auth/login` está em `.permitAll()`
3. Verifique logs do Spring Security

---

## Logs Úteis

### Backend Logs

Adicione ao `application.yaml` para debug:
```yaml
logging:
  level:
    org.springframework.security: DEBUG
    dev.gustavorosa.cpsystem.security: DEBUG
```

### Frontend Logs

No Console do navegador:
```javascript
// Ver token atual
console.log('Token:', localStorage.getItem('auth_token'));

// Verificar se está autenticado
console.log('Autenticado:', !!localStorage.getItem('auth_token'));

// Limpar autenticação
localStorage.clear();
```

---

## Próximos Passos

Após completar todos os testes:

1. ✅ Ajuste `JWT_EXPIRATION_MS` para valor de produção
2. ✅ Configure variáveis de ambiente de produção
3. ✅ Gere JWT secret seguro: `openssl rand -base64 32`
4. ✅ Configure HTTPS em produção
5. ✅ Considere implementar refresh tokens
6. ✅ Adicione rate limiting no backend
7. ✅ Implemente auditoria de login

---

## Conclusão

Se todos os testes passarem, o sistema de autenticação está funcionando corretamente e pronto para uso! 🎉
