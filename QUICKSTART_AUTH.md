# 🚀 Guia Rápido - Sistema de Autenticação

Este guia fornece instruções para colocar o sistema de autenticação em funcionamento rapidamente.

## ⚡ Início Rápido (5 minutos)

### 1️⃣ Configure as Variáveis de Ambiente

Crie o arquivo `.env` na raiz do projeto:

```bash
# Copie o exemplo
cp env.example .env
```

Edite o arquivo `.env` e configure:

```bash
# Autenticação - ALTERE ESTES VALORES!
AUTH_USER_EMAIL=seu@email.com
AUTH_USER_PASSWORD=SuaSenhaSegura123!

# JWT Secret - Gere uma chave aleatória
JWT_SECRET=sua_chave_secreta_minimo_32_caracteres_aqui
JWT_EXPIRATION_MS=3600000

# Outras variáveis já configuradas no env.example...
```

**💡 Dica**: Gere uma chave JWT segura:
```bash
openssl rand -base64 32
```

### 2️⃣ Configure o Frontend

Crie `frontend/.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8080/v1
```

### 3️⃣ Instale Dependências do Backend

```bash
cd backend
./mvnw clean install
```

### 4️⃣ Instale Dependências do Frontend

```bash
cd frontend
npm install
```

### 5️⃣ Inicie os Serviços

**Terminal 1 - Backend:**
```bash
cd backend
./mvnw spring-boot:run
```

Aguarde até ver: `Started CpsystemApplication`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Aguarde até ver: `Ready in...`

### 6️⃣ Acesse a Aplicação

1. Abra o navegador em: `http://localhost:3000`
2. Você será redirecionado para a página de login
3. Use as credenciais que você configurou:
   - Email: valor de `AUTH_USER_EMAIL`
   - Senha: valor de `AUTH_USER_PASSWORD`
4. Clique em "Entrar"

🎉 **Pronto!** Você está autenticado e pode usar o sistema!

---

## 📁 Arquivos Criados

### Backend

```
backend/src/main/java/dev/gustavorosa/cpsystem/
└── security/
    ├── JwtTokenProvider.java         # Gera/valida tokens JWT
    ├── JwtAuthenticationFilter.java  # Intercepta requests
    ├── SecurityConfig.java           # Config Spring Security
    ├── AuthController.java           # Endpoint /auth/login
    └── dto/
        ├── LoginRequest.java         # Request DTO
        └── AuthResponse.java         # Response DTO (token)
```

### Frontend

```
frontend/
├── app/
│   └── login/
│       └── page.tsx                  # Página de login
├── components/
│   ├── auth-guard.tsx                # Guard de autenticação
│   ├── auth-layout-wrapper.tsx       # Wrapper layout
│   └── sidebar/
│       └── index.tsx                 # Sidebar com logout
├── lib/
│   ├── auth.ts                       # Funções auth
│   └── api.ts                        # API client (atualizado)
└── middleware.ts                     # Middleware Next.js
```

### Configuração

```
├── env.example                       # Template (atualizado)
├── AUTHENTICATION.md                 # Documentação completa
├── TESTING_AUTH.md                   # Guia de testes
└── QUICKSTART_AUTH.md                # Este arquivo
```

---

## 🔑 Credenciais Padrão

As credenciais são definidas no arquivo `.env`:

```bash
AUTH_USER_EMAIL=seu@email.com
AUTH_USER_PASSWORD=SuaSenhaSegura123!
```

**⚠️ IMPORTANTE**: 
- Altere estas credenciais antes de usar em produção
- Use senhas fortes (mínimo 16 caracteres)
- Nunca commite o arquivo `.env`

---

## 🛠️ Comandos Úteis

### Reiniciar Backend
```bash
# CTRL+C no terminal do backend, depois:
./mvnw spring-boot:run
```

### Reiniciar Frontend
```bash
# CTRL+C no terminal do frontend, depois:
npm run dev
```

### Limpar Build
```bash
cd backend
./mvnw clean
```

### Verificar Logs do Backend
Os logs aparecem automaticamente no terminal. Procure por:
- `Started CpsystemApplication` - Backend iniciado
- `JWT token` - Logs de autenticação

---

## 🔍 Verificação Rápida

### 1. Backend está funcionando?

```bash
curl http://localhost:8080/actuator/health
```
Deve retornar: `{"status":"UP"}`

### 2. Endpoint de login funciona?

```bash
curl -X POST http://localhost:8080/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"seu@email.com","password":"SuaSenhaSegura123!"}'
```
Deve retornar um token JWT.

### 3. Frontend está acessível?

Abra: `http://localhost:3000`
Deve mostrar a página de login.

---

## ❓ Problemas Comuns

### "Credenciais inválidas"

**Causa**: Email ou senha incorretos.

**Solução**: 
1. Verifique o arquivo `.env`
2. Reinicie o backend
3. Use exatamente as credenciais configuradas

---

### "Failed to fetch" ou erro de CORS

**Causa**: Backend não está rodando ou URL incorreta.

**Solução**:
1. Verifique se o backend está rodando (porta 8080)
2. Confirme `NEXT_PUBLIC_API_URL` em `frontend/.env.local`
3. Verifique `ALLOWED_ORIGINS` no `.env` da raiz

---

### "Port 8080 is already in use"

**Causa**: Outro processo está usando a porta 8080.

**Solução**:
```bash
# Linux/Mac - Encontrar processo na porta 8080
lsof -i :8080

# Matar processo (substitua PID)
kill -9 PID
```

---

### "Port 3000 is already in use"

**Causa**: Outro processo está usando a porta 3000.

**Solução**:
```bash
# Linux/Mac
lsof -i :3000
kill -9 PID

# Ou use outra porta
PORT=3001 npm run dev
```

---

### Banco de dados não conecta

**Causa**: PostgreSQL não está rodando ou credenciais incorretas.

**Solução**:
1. Verifique se o PostgreSQL está rodando
2. Confirme credenciais em `.env`:
   - `POSTGRES_USER`
   - `POSTGRES_PASSWORD`
   - `POSTGRES_DB`
3. Se usar Docker: `docker-compose up -d postgres`

---

## 📚 Documentação Adicional

- **[AUTHENTICATION.md](AUTHENTICATION.md)** - Documentação técnica completa
- **[TESTING_AUTH.md](TESTING_AUTH.md)** - Guia de testes detalhado
- **[env.example](env.example)** - Template de configuração

---

## 🎯 Próximos Passos

Após o sistema estar funcionando:

1. ✅ Teste o login e logout
2. ✅ Navegue pelas páginas protegidas
3. ✅ Verifique que APIs requerem autenticação
4. 📖 Leia [AUTHENTICATION.md](AUTHENTICATION.md) para entender a arquitetura
5. 🧪 Execute os testes em [TESTING_AUTH.md](TESTING_AUTH.md)
6. 🚀 Configure para produção com credenciais reais

---

## 🆘 Suporte

Se você encontrar problemas:

1. Verifique os logs do backend e frontend
2. Consulte a seção "Solução de Problemas" em [AUTHENTICATION.md](AUTHENTICATION.md)
3. Execute os testes em [TESTING_AUTH.md](TESTING_AUTH.md)
4. Verifique se todas as variáveis de ambiente estão configuradas

---

## ✨ Funcionalidades Implementadas

- ✅ Login com email e senha
- ✅ JWT com expiração configurável
- ✅ Proteção de todas as rotas (exceto login)
- ✅ Logout com limpeza de sessão
- ✅ Interceptor automático de token nas APIs
- ✅ Redirecionamento automático quando não autenticado
- ✅ Tratamento de token expirado
- ✅ UI moderna com Shadcn UI
- ✅ Validação de formulário com Zod
- ✅ Feedback visual de erros

---

**Desenvolvido por**: Sistema CP - Carolina Peres Assessoria e Cobrança  
**Versão**: 1.0.0  
**Data**: Janeiro 2026
