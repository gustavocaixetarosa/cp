# 🐳 Docker - CPSystem (Completo)

## 📐 Arquitetura

```
                    ┌─────────────────┐
                    │   Cliente       │
                    │  (Navegador)    │
                    └────────┬────────┘
                             │ :80
                    ┌────────▼────────┐
                    │     Nginx       │
                    │ (Reverse Proxy) │
                    └────────┬────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
       ┌────────▼────────┐      ┌───────▼───────┐
       │   Frontend      │      │    Backend    │
       │   (Next.js)     │      │ (Spring Boot) │
       │    :3000        │      │     :8080     │
       └─────────────────┘      └───────┬───────┘
                                        │
                                ┌───────▼───────┐
                                │   PostgreSQL  │
                                │     :5432     │
                                └───────────────┘
```

## 🎯 Como Funciona

### **Nginx (Reverse Proxy)**
- **Porta pública**: 80 (única porta exposta ao mundo externo)
- **Função**: Rotear requisições entre frontend e backend
  - `http://seudominio.com/` → Frontend (Next.js)
  - `http://seudominio.com/api/*` → Backend (Spring Boot)
  - `http://seudominio.com/actuator/*` → Backend (health checks)

### **Frontend (Next.js)**
- **Container interno**: porta 3000 (não exposta publicamente)
- **Acesso**: Apenas via Nginx
- **Build**: Modo standalone (imagem otimizada ~150MB)

### **Backend (Spring Boot)**
- **Container interno**: porta 8080 (não exposta publicamente)
- **Acesso**: Apenas via Nginx
- **API**: Todas as rotas começam com `/api/`

### **PostgreSQL**
- **Container interno**: porta 5432
- **Exposta**: Sim (para desenvolvimento local)
- **Dados**: Persistidos em volume Docker

## 🚀 Comandos

### Iniciar tudo (primeira vez)
```bash
cd /home/gustavorosa/projects/cp

# Construir e iniciar todos os serviços
docker compose up -d --build

# Ver logs de todos os serviços
docker compose logs -f

# Ver logs de um serviço específico
docker compose logs -f nginx
docker compose logs -f frontend
docker compose logs -f backend
```

### Gerenciamento
```bash
# Parar tudo
docker compose down

# Parar e remover volumes (limpa banco de dados)
docker compose down -v

# Reiniciar apenas um serviço
docker compose restart frontend
docker compose restart backend

# Reconstruir após mudanças no código
docker compose up -d --build frontend
docker compose up -d --build backend
```

### Verificar status
```bash
# Status dos containers
docker compose ps

# Health check
curl http://localhost/actuator/health

# Testar frontend
curl http://localhost/

# Testar API backend
curl http://localhost/api/clients
```

## 🔧 Variáveis de Ambiente

### Customizar no docker-compose.yml:

**Backend:**
```yaml
environment:
  SPRING_PROFILES_ACTIVE: prod
  SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/cobranca
  JAVA_OPTS: "-Xmx512m -Xms256m"
```

**Frontend:**
```yaml
environment:
  NODE_ENV: production
  NEXT_PUBLIC_API_URL: http://seudominio.com/api
```

## 🌐 Deployment em VPS

### 1. Copiar arquivos para VPS
```bash
# Na sua máquina local
scp -r /home/gustavorosa/projects/cp usuario@seu-vps:/home/usuario/

# Ou via git
ssh usuario@seu-vps
git clone seu-repositorio
cd seu-repositorio
```

### 2. Configurar domínio
Edite `nginx/nginx.conf` e troque `localhost` pelo seu domínio:
```nginx
server_name seudominio.com www.seudominio.com;
```

### 3. SSL/HTTPS (Opcional mas recomendado)
```bash
# Instalar certbot no VPS
sudo apt install certbot

# Gerar certificados
sudo certbot certonly --standalone -d seudominio.com

# Copiar certificados para a pasta nginx
mkdir -p nginx/ssl
sudo cp /etc/letsencrypt/live/seudominio.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/seudominio.com/privkey.pem nginx/ssl/
```

Depois, descomente as linhas de SSL no `docker-compose.yml` e atualize `nginx.conf`.

### 4. Iniciar na VPS
```bash
cd /home/usuario/seu-projeto
docker compose up -d --build
```

## 📊 Monitoramento

### Logs em tempo real
```bash
# Todos os serviços
docker compose logs -f

# Últimas 100 linhas
docker compose logs --tail=100

# Apenas erros
docker compose logs -f | grep -i error
```

### Recursos
```bash
# Uso de CPU/Memória
docker stats

# Espaço em disco
docker system df
```

## 🛠️ Troubleshooting

### Frontend não conecta no backend
1. Verifique se `NEXT_PUBLIC_API_URL` está correto
2. Teste: `curl http://localhost/api/clients`
3. Veja logs: `docker compose logs -f nginx`

### Backend não conecta no PostgreSQL
1. Espere o banco inicializar completamente
2. Verifique health check: `docker compose ps`
3. Veja logs: `docker compose logs -f postgres`

### Porta 80 já em uso
```bash
# Descobrir o processo
sudo lsof -i :80

# Parar Apache/Nginx local se existir
sudo systemctl stop apache2
sudo systemctl stop nginx
```

## 🗑️ Limpeza

```bash
# Parar tudo e remover volumes
docker compose down -v

# Remover imagens não utilizadas
docker image prune -a

# Limpeza completa do Docker
docker system prune -a --volumes
```

## 📝 Resumo das Portas

| Serviço    | Porta Interna | Porta Externa | Acesso       |
|------------|---------------|---------------|--------------|
| Nginx      | 80            | 80            | Público      |
| Frontend   | 3000          | -             | Via Nginx    |
| Backend    | 8080          | -             | Via Nginx    |
| PostgreSQL | 5432          | 5432          | Dev/Interno  |

## 🎓 Por que essa arquitetura?

✅ **Segurança**: Apenas Nginx exposto publicamente  
✅ **SSL/TLS**: Fácil adicionar HTTPS no Nginx  
✅ **Cache**: Nginx pode cachear respostas  
✅ **Compressão**: Gzip automático no Nginx  
✅ **Load Balance**: Fácil adicionar múltiplos backends  
✅ **Logs**: Centralizados no Nginx  
✅ **Manutenção**: Atualizar serviços sem downtime

## 🗄️ Sistema de Backup Automático

O projeto inclui um sistema completo de backup automático do banco de dados PostgreSQL para AWS S3.

### Recursos do Sistema de Backup

- **Backups Diários Automáticos**: Via cron job
- **Compressão**: Backups comprimidos com gzip
- **Upload para S3**: Armazenamento seguro na nuvem AWS
- **Retenção Configurável**: Padrão de 7 dias
- **Script de Restore**: Recuperação interativa de backups
- **Logs Detalhados**: Monitoramento completo

### Quick Start - Backups

```bash
# 1. Instalação automatizada (recomendado)
./scripts/INSTALL-BACKUP.sh

# 2. Ou manual: configurar AWS CLI
aws configure

# 3. Criar bucket S3
aws s3 mb s3://cpsystem-backups

# 4. Testar backup
./scripts/backup-db.sh

# 5. Configurar cron para backup diário
crontab -e
# Adicionar: 0 2 * * * /caminho/completo/scripts/backup-db.sh >> /var/log/cpsystem-backup.log 2>&1

# 6. Restaurar backup quando necessário
./scripts/restore-db.sh
```

### Documentação Completa

- **[scripts/BACKUP-README.md](scripts/BACKUP-README.md)** - Documentação completa do sistema de backup
- **[scripts/INSTALL-BACKUP.sh](scripts/INSTALL-BACKUP.sh)** - Script de instalação automatizada
- **[scripts/crontab.example](scripts/crontab.example)** - Exemplos de configuração de cron

### Comandos Úteis

```bash
# Executar backup manualmente
./scripts/backup-db.sh

# Listar backups no S3
aws s3 ls s3://cpsystem-backups/

# Ver logs de backup
tail -f /var/log/cpsystem-backup.log

# Restaurar backup
./scripts/restore-db.sh

# Verificar cron jobs
crontab -l
```
