# 🔐 Guia de Variáveis de Ambiente para Produção

## Visão Geral

Este documento lista **TODAS** as variáveis de ambiente necessárias para deploy do CPSystem em produção. Use este guia para configurar sua VPS de forma segura.

---

## 📋 Checklist Rápido

Antes de fazer deploy em produção, certifique-se de:

- [ ] Criar arquivo `.env` com valores de produção
- [ ] Usar senhas FORTES e DIFERENTES das de desenvolvimento
- [ ] Configurar CORS com seu domínio real
- [ ] Proteger arquivo `.env` (chmod 600)
- [ ] Configurar credenciais AWS para backups
- [ ] Testar todas as variáveis localmente primeiro
- [ ] Nunca commitar `.env` no Git

---

## 🔴 Variáveis OBRIGATÓRIAS

Estas variáveis **DEVEM** ser configuradas em produção:

### 1. Database (PostgreSQL)

```bash
# Nome do banco de dados
POSTGRES_DB=cpsystem_prod

# Usuário do banco
POSTGRES_USER=cpsystem_user

# Senha do banco (MÍNIMO 16 caracteres)
POSTGRES_PASSWORD=SuaSenhaForteMuitoSegura2024!@#
```

**⚠️ IMPORTANTE:**
- Use senha DIFERENTE da de desenvolvimento
- Mínimo 16 caracteres
- Inclua letras maiúsculas, minúsculas, números e símbolos
- Não use palavras comuns ou sequências (123456, senha123, etc.)

### 2. Backend (Spring Boot)

```bash
# URL JDBC do banco (ajuste o nome do DB se necessário)
SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/cpsystem_prod

# Credenciais (mesmas do PostgreSQL acima)
SPRING_DATASOURCE_USERNAME=cpsystem_user
SPRING_DATASOURCE_PASSWORD=SuaSenhaForteMuitoSegura2024!@#

# Perfil Spring
SPRING_PROFILES_ACTIVE=prod
```

### 3. CORS (Segurança)

```bash
# Domínios permitidos (separados por vírgula, SEM espaços)
ALLOWED_ORIGINS=https://seudominio.com,https://www.seudominio.com
```

**⚠️ IMPORTANTE:**
- Use apenas HTTPS em produção
- Liste APENAS domínios confiáveis
- NÃO use wildcards (*) ou http:// em produção

### 4. Backups (AWS S3)

```bash
# Bucket S3 para backups
S3_BUCKET=cpsystem-backups-prod

# Região AWS
AWS_REGION=us-east-1

# Credenciais do banco para backup (mesmas do PostgreSQL)
DB_NAME=cpsystem_prod
DB_USER=cpsystem_user
DB_PASSWORD=SuaSenhaForteMuitoSegura2024!@#
```

---

## 🟡 Variáveis OPCIONAIS (com defaults)

Estas variáveis têm valores padrão mas podem ser customizadas:

### Performance & Resources

```bash
# Opções da JVM (ajuste conforme sua VPS)
JAVA_OPTS=-Xmx1g -Xms512m    # Padrão: -Xmx512m -Xms256m
```

**Recomendações por tamanho de VPS:**
- **1GB RAM**: `-Xmx512m -Xms256m`
- **2GB RAM**: `-Xmx1g -Xms512m`
- **4GB+ RAM**: `-Xmx2g -Xms1g`

### Logging & Debug

```bash
# Mostrar SQL no log (false para produção)
SPRING_JPA_SHOW_SQL=false    # Padrão: false
```

### Frontend

```bash
# Ambiente Node.js
NODE_ENV=production    # Padrão: production

# URL da API
NEXT_PUBLIC_API_URL=/api/v1    # Padrão: /api/v1
# Ou absoluto: NEXT_PUBLIC_API_URL=https://seudominio.com/api/v1
```

### Backups

```bash
# Retenção de backups no S3 (dias)
RETENTION_DAYS=7    # Padrão: 7

# Retenção de backups locais (dias)
LOCAL_RETENTION_DAYS=3    # Padrão: 3

# Nome do container do banco
DB_CONTAINER=cpsystem-db    # Padrão: cpsystem-db

# Diretórios temporários
BACKUP_DIR=/tmp/cpsystem-backups    # Padrão: /tmp/cpsystem-backups
RESTORE_DIR=/tmp/cpsystem-restore   # Padrão: /tmp/cpsystem-restore

# Arquivo de log
LOG_FILE=/var/log/cpsystem-backup.log    # Padrão: /var/log/cpsystem-backup.log
```

### AWS Credentials

```bash
# Credenciais AWS (ou use ~/.aws/credentials)
AWS_ACCESS_KEY_ID=sua_access_key
AWS_SECRET_ACCESS_KEY=sua_secret_key
```

**Nota:** Recomendamos usar `~/.aws/credentials` ao invés de variáveis de ambiente por questões de segurança.

---

## 🚀 Setup Completo na VPS

### Passo 1: Criar arquivo .env

```bash
# Conectar na VPS
ssh usuario@seu-servidor

# Ir para o diretório do projeto
cd /home/usuario/cp

# Copiar template
cp env.example .env

# Editar com seus valores
nano .env
```

### Passo 2: Preencher variáveis obrigatórias

Cole o seguinte no arquivo `.env` e ajuste os valores:

```ini
# Database
POSTGRES_DB=cpsystem_prod
POSTGRES_USER=cpsystem_user
POSTGRES_PASSWORD=SUA_SENHA_FORTE_AQUI

# Backend
SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/cpsystem_prod
SPRING_DATASOURCE_USERNAME=cpsystem_user
SPRING_DATASOURCE_PASSWORD=SUA_SENHA_FORTE_AQUI
SPRING_PROFILES_ACTIVE=prod
SPRING_JPA_SHOW_SQL=false
JAVA_OPTS=-Xmx512m -Xms256m

# CORS
ALLOWED_ORIGINS=https://seudominio.com,https://www.seudominio.com

# Frontend
NODE_ENV=production
NEXT_PUBLIC_API_URL=/api/v1

# Backups
S3_BUCKET=cpsystem-backups-prod
AWS_REGION=us-east-1
RETENTION_DAYS=7
DB_NAME=cpsystem_prod
DB_USER=cpsystem_user
DB_PASSWORD=SUA_SENHA_FORTE_AQUI
```

### Passo 3: Proteger o arquivo

```bash
# Tornar legível apenas pelo dono
chmod 600 .env

# Verificar permissões
ls -la .env
# Deve mostrar: -rw------- (apenas dono pode ler/escrever)
```

### Passo 4: Exportar variáveis para scripts de backup

Adicione ao `~/.bashrc` ou `~/.bash_profile`:

```bash
# CPSystem Environment Variables
export DB_NAME=cpsystem_prod
export DB_USER=cpsystem_user
export DB_PASSWORD='SUA_SENHA_FORTE_AQUI'
export S3_BUCKET=cpsystem-backups-prod
export AWS_REGION=us-east-1
export RETENTION_DAYS=7
```

Depois recarregue:

```bash
source ~/.bashrc
```

### Passo 5: Validar configuração

```bash
# Executar script de validação
./scripts/validate-env.sh

# Se tudo estiver OK, iniciar aplicação
docker compose up -d
```

---

## 🔍 Validação e Testes

### Verificar se variáveis estão carregadas

```bash
# Listar variáveis do Docker Compose
docker compose config

# Ver variáveis de um container específico
docker exec cpsystem-backend env | grep SPRING

# Testar conexão com banco
docker exec cpsystem-db psql -U cpsystem_user -d cpsystem_prod -c "SELECT 1;"
```

### Testar aplicação

```bash
# Health check
curl http://localhost/actuator/health

# Testar API
curl http://localhost/api/v1/client

# Ver logs
docker compose logs -f backend
```

---

## 🛡️ Melhores Práticas de Segurança

### 1. Senhas Fortes

❌ **NÃO use:**
- `123456`, `password`, `senha123`
- Palavras comuns do dicionário
- Informações pessoais (nome, data de nascimento)
- Menos de 16 caracteres

✅ **USE:**
- Mínimo 16 caracteres
- Combinação de maiúsculas, minúsculas, números e símbolos
- Gerador de senhas: `openssl rand -base64 24`

```bash
# Gerar senha forte automaticamente
openssl rand -base64 24
# Resultado: 8Kj9mP2nQ7xRvL3wS5tY6uZ1aB4cD
```

### 2. Proteção do Arquivo .env

```bash
# Permissões corretas
chmod 600 .env

# Verificar que não está no Git
git status
# .env NÃO deve aparecer na lista

# Se aparecer, adicionar ao .gitignore
echo ".env" >> .gitignore
```

### 3. CORS Restritivo

```bash
# ❌ NUNCA faça isso em produção:
ALLOWED_ORIGINS=*
ALLOWED_ORIGINS=http://seudominio.com    # HTTP é inseguro!

# ✅ Correto:
ALLOWED_ORIGINS=https://seudominio.com,https://www.seudominio.com
```

### 4. Separação de Ambientes

- **Development**: Use `env.development` (valores podem ser commitados)
- **Production**: Use `.env` (NUNCA commitar)
- Senhas DIFERENTES em cada ambiente
- Buckets S3 DIFERENTES em cada ambiente

### 5. Rotação de Credenciais

Recomendado trocar senhas periodicamente:

```bash
# 1. Gerar nova senha
NEW_PASSWORD=$(openssl rand -base64 24)

# 2. Atualizar .env
nano .env    # Substituir POSTGRES_PASSWORD

# 3. Recriar banco (ou ALTER USER)
docker compose down
docker compose up -d postgres
docker exec cpsystem-db psql -U postgres -c "ALTER USER cpsystem_user PASSWORD '$NEW_PASSWORD';"

# 4. Reiniciar backend
docker compose up -d backend
```

---

## 🐛 Troubleshooting

### Erro: "Database connection failed"

1. Verificar variáveis do banco:
```bash
docker compose config | grep POSTGRES
```

2. Testar conexão direta:
```bash
docker exec cpsystem-db psql -U $POSTGRES_USER -d $POSTGRES_DB -c "SELECT 1;"
```

3. Ver logs do PostgreSQL:
```bash
docker compose logs postgres
```

### Erro: "CORS policy blocked"

1. Verificar ALLOWED_ORIGINS:
```bash
docker exec cpsystem-backend env | grep ALLOWED_ORIGINS
```

2. Confirmar que usa HTTPS em produção
3. Verificar se domínio está correto (sem trailing slash)

### Erro: "S3 Access Denied"

1. Verificar credenciais AWS:
```bash
aws s3 ls s3://$S3_BUCKET/
```

2. Verificar IAM permissions
3. Confirmar nome do bucket está correto

---

## 📝 Template Completo

Copie e ajuste conforme necessário:

```ini
# Database
POSTGRES_DB=cpsystem_prod
POSTGRES_USER=cpsystem_user
POSTGRES_PASSWORD=SENHA_FORTE_16+_CARACTERES

# Backend
SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/cpsystem_prod
SPRING_DATASOURCE_USERNAME=cpsystem_user
SPRING_DATASOURCE_PASSWORD=SENHA_FORTE_16+_CARACTERES
SPRING_PROFILES_ACTIVE=prod
SPRING_JPA_SHOW_SQL=false
JAVA_OPTS=-Xmx512m -Xms256m

# CORS (seu domínio real!)
ALLOWED_ORIGINS=https://seudominio.com,https://www.seudominio.com

# Frontend
NODE_ENV=production
NEXT_PUBLIC_API_URL=/api/v1

# Backups
S3_BUCKET=cpsystem-backups-prod
AWS_REGION=us-east-1
RETENTION_DAYS=7
LOCAL_RETENTION_DAYS=3
DB_CONTAINER=cpsystem-db
DB_NAME=cpsystem_prod
DB_USER=cpsystem_user
DB_PASSWORD=SENHA_FORTE_16+_CARACTERES
```

---

## ✅ Checklist Final

Antes de fazer deploy:

- [ ] Arquivo `.env` criado com valores de produção
- [ ] Senhas fortes (16+ caracteres) configuradas
- [ ] Senhas DIFERENTES das de desenvolvimento
- [ ] CORS configurado com domínio real (HTTPS)
- [ ] Arquivo `.env` protegido (chmod 600)
- [ ] Arquivo `.env` no `.gitignore`
- [ ] Variáveis exportadas para scripts (~/.bashrc)
- [ ] Bucket S3 criado
- [ ] Credenciais AWS configuradas (~/.aws/credentials)
- [ ] Script de validação executado
- [ ] Testes de conexão realizados
- [ ] Health check respondendo
- [ ] Logs verificados (sem erros)
- [ ] Backup testado manualmente

---

**Pronto para produção! 🚀**

Se tiver dúvidas, consulte:
- `env.example` - Template com todas as variáveis
- `env.development` - Valores de desenvolvimento
- `README-DOCKER.md` - Documentação Docker
- `scripts/BACKUP-README.md` - Documentação de backups
