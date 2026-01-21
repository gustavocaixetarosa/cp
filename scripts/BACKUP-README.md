# 🗄️ Sistema de Backup Automático - CPSystem

## Visão Geral

Sistema completo de backup automático do banco de dados PostgreSQL para AWS S3, com:
- Backups diários automáticos via cron
- Compressão gzip dos backups
- Upload automático para S3
- Retenção configurável (padrão: 7 dias)
- Script de restore interativo
- Logs detalhados

---

## 📋 Pré-requisitos

### 1. Conta AWS
- Conta ativa na AWS
- Acesso ao console AWS S3

### 2. Software no Host (VPS)
```bash
# AWS CLI (versão 1 ou 2)
sudo apt update
sudo apt install awscli -y

# Verificar instalação
aws --version
```

---

## 🚀 Configuração Inicial

### Passo 1: Criar Bucket S3

#### Opção A: Via Console AWS (Recomendado para iniciantes)

1. Acesse o [Console AWS S3](https://s3.console.aws.amazon.com)
2. Clique em **"Create bucket"**
3. Configure:
   - **Bucket name**: `cpsystem-backups` (ou outro nome único)
   - **Region**: `us-east-1` (ou sua região preferida)
   - **Block Public Access**: Mantenha TODAS as opções marcadas (segurança)
   - **Versioning**: (Opcional) Habilite para proteção extra
   - **Encryption**: (Recomendado) Habilite SSE-S3 ou SSE-KMS
4. Clique em **"Create bucket"**

#### Opção B: Via AWS CLI

```bash
# Criar bucket
aws s3 mb s3://cpsystem-backups --region us-east-1

# Habilitar criptografia (recomendado)
aws s3api put-bucket-encryption \
  --bucket cpsystem-backups \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'

# Habilitar versionamento (opcional)
aws s3api put-bucket-versioning \
  --bucket cpsystem-backups \
  --versioning-configuration Status=Enabled
```

### Passo 2: Criar IAM User e Credenciais

#### Via Console AWS:

1. Acesse [IAM Console](https://console.aws.amazon.com/iam/)
2. **Users** → **Add users**
3. Nome: `cpsystem-backup-user`
4. **Access type**: Marque "Programmatic access"
5. **Permissions**: Attach existing policies directly
   - Clique em **"Create policy"** (nova aba)
   - Selecione JSON e cole:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:ListBucket",
        "s3:DeleteObject"
      ],
      "Resource": [
        "arn:aws:s3:::cpsystem-backups",
        "arn:aws:s3:::cpsystem-backups/*"
      ]
    }
  ]
}
```

6. Nome da policy: `cpsystem-backup-policy`
7. Volte para a criação do user e selecione a policy criada
8. **Importante**: Anote o **Access Key ID** e **Secret Access Key**

### Passo 3: Configurar AWS CLI no Host

```bash
# Configurar credenciais
aws configure

# Será solicitado:
# AWS Access Key ID: [cole sua Access Key ID]
# AWS Secret Access Key: [cole seu Secret Access Key]
# Default region name: us-east-1
# Default output format: json
```

Ou crie manualmente o arquivo de credenciais:

```bash
# Criar diretório
mkdir -p ~/.aws

# Criar arquivo de credenciais
cat > ~/.aws/credentials << EOF
[default]
aws_access_key_id = SUA_ACCESS_KEY_ID
aws_secret_access_key = SEU_SECRET_ACCESS_KEY
EOF

# Criar arquivo de configuração
cat > ~/.aws/config << EOF
[default]
region = us-east-1
output = json
EOF

# Proteger arquivo (apenas você pode ler)
chmod 600 ~/.aws/credentials
chmod 600 ~/.aws/config
```

### Passo 4: Verificar Configuração

```bash
# Testar acesso ao bucket
aws s3 ls s3://cpsystem-backups/

# Se retornar sem erros, está configurado corretamente!
```

---

## ⚙️ Configuração dos Scripts

### Variáveis de Ambiente (Opcional)

Você pode customizar as configurações exportando variáveis de ambiente antes de executar os scripts:

```bash
# Exemplo de customização
export S3_BUCKET="meu-bucket-personalizado"
export AWS_REGION="sa-east-1"
export RETENTION_DAYS=14
export LOG_FILE="/var/log/meu-backup.log"
```

Ou edite diretamente os scripts em `scripts/backup-db.sh` e `scripts/restore-db.sh`:

```bash
# Editar configurações
nano scripts/backup-db.sh

# Procure pela seção CONFIGURAÇÕES e ajuste:
S3_BUCKET="seu-bucket"
AWS_REGION="sua-regiao"
RETENTION_DAYS=7
```

---

## 🤖 Configurar Cron (Backup Automático)

### Passo 1: Testar Backup Manualmente

Antes de configurar o cron, teste o backup manualmente:

```bash
cd /home/gustavorosa/projects/cp

# Executar backup
./scripts/backup-db.sh

# Verificar logs
tail -f /var/log/cpsystem-backup.log

# Verificar no S3
aws s3 ls s3://cpsystem-backups/
```

Se o backup foi bem-sucedido, prossiga para o cron.

### Passo 2: Configurar Cron Job

```bash
# Editar crontab
crontab -e

# Adicionar linha para backup diário às 02:00 AM
0 2 * * * /home/gustavorosa/projects/cp/scripts/backup-db.sh >> /var/log/cpsystem-backup.log 2>&1
```

#### Explicação do Cron:
- `0 2 * * *` = Todo dia às 02:00 AM
- `/home/.../backup-db.sh` = Caminho completo do script
- `>> /var/log/...log` = Append logs ao arquivo
- `2>&1` = Redireciona erros para o log

#### Outros Horários Úteis:

```bash
# Todo dia às 03:00 AM
0 3 * * * /path/to/backup-db.sh >> /var/log/cpsystem-backup.log 2>&1

# Todo dia às 23:00 (11 PM)
0 23 * * * /path/to/backup-db.sh >> /var/log/cpsystem-backup.log 2>&1

# A cada 12 horas (00:00 e 12:00)
0 */12 * * * /path/to/backup-db.sh >> /var/log/cpsystem-backup.log 2>&1

# Todo domingo às 04:00 AM
0 4 * * 0 /path/to/backup-db.sh >> /var/log/cpsystem-backup.log 2>&1
```

### Passo 3: Verificar Cron

```bash
# Listar cron jobs ativos
crontab -l

# Verificar logs do cron
sudo tail -f /var/log/syslog | grep CRON
```

---

## 🔄 Como Restaurar um Backup

### Método Interativo (Recomendado)

```bash
cd /home/gustavorosa/projects/cp

# Executar script de restore
./scripts/restore-db.sh
```

O script irá:
1. Listar todos os backups disponíveis no S3
2. Solicitar que você escolha qual backup restaurar
3. Pedir confirmação (você deve digitar "RESTAURAR")
4. Fazer download do backup
5. Verificar integridade
6. Dropar o banco atual e restaurar o backup
7. Verificar se o restore foi bem-sucedido

### Método Manual

```bash
# 1. Listar backups no S3
aws s3 ls s3://cpsystem-backups/

# 2. Download do backup desejado
aws s3 cp s3://cpsystem-backups/cpsystem-backup-2024-01-21_02-00-00.sql.gz /tmp/

# 3. Restaurar manualmente
gunzip -c /tmp/cpsystem-backup-2024-01-21_02-00-00.sql.gz | \
  docker exec -i cpsystem-db psql -U gustavo -d cobranca
```

---

## 📊 Monitoramento e Manutenção

### Verificar Logs

```bash
# Ver logs de backup
tail -f /var/log/cpsystem-backup.log

# Ver logs de restore
tail -f /var/log/cpsystem-restore.log

# Ver últimas 100 linhas
tail -n 100 /var/log/cpsystem-backup.log

# Buscar erros
grep -i error /var/log/cpsystem-backup.log
```

### Listar Backups

```bash
# Listar backups no S3
aws s3 ls s3://cpsystem-backups/ --recursive --human-readable

# Listar backups locais
ls -lh /tmp/cpsystem-backups/

# Contar backups no S3
aws s3 ls s3://cpsystem-backups/ | grep cpsystem-backup | wc -l
```

### Tamanho dos Backups

```bash
# Tamanho total no S3
aws s3 ls s3://cpsystem-backups/ --recursive --human-readable --summarize

# Tamanho de um backup específico
aws s3 ls s3://cpsystem-backups/cpsystem-backup-*.sql.gz --human-readable
```

---

## 🔧 Solução de Problemas

### Erro: "AWS CLI não está instalado"

```bash
# Instalar AWS CLI
sudo apt update
sudo apt install awscli -y

# Verificar
aws --version
```

### Erro: "Container PostgreSQL não está rodando"

```bash
# Verificar containers
docker ps

# Iniciar PostgreSQL
cd /home/gustavorosa/projects/cp
docker compose up -d postgres
```

### Erro: "Unable to locate credentials"

```bash
# Reconfigurar AWS
aws configure

# Ou verificar arquivo
cat ~/.aws/credentials
```

### Erro: "Access Denied" no S3

- Verifique se o IAM user tem as permissões corretas
- Confirme o nome do bucket está correto
- Teste: `aws s3 ls s3://cpsystem-backups/`

### Backup não está sendo executado pelo Cron

```bash
# Verificar cron está rodando
sudo systemctl status cron

# Verificar crontab
crontab -l

# Testar script manualmente com caminho completo
/home/gustavorosa/projects/cp/scripts/backup-db.sh

# Verificar permissões
ls -l /home/gustavorosa/projects/cp/scripts/backup-db.sh
# Deve ter: -rwx------ (700)
```

---

## 🔐 Segurança

### Melhores Práticas

1. **Credenciais AWS**
   - Use IAM user específico (não use root account)
   - Permissões mínimas necessárias
   - Proteja o arquivo credentials: `chmod 600 ~/.aws/credentials`

2. **Bucket S3**
   - Mantenha o bucket privado (Block Public Access)
   - Habilite criptografia (SSE-S3 ou SSE-KMS)
   - Habilite versionamento para proteção contra exclusão acidental
   - Configure lifecycle policies para transição para Glacier

3. **Scripts**
   - Permissões 700 (apenas dono executa)
   - Não commite credenciais no Git
   - Use variáveis de ambiente quando possível

4. **Logs**
   - Não exponha senhas nos logs
   - Proteja arquivos de log: `chmod 640 /var/log/cpsystem-backup.log`

### Criptografia Extra (Opcional)

Para criptografar backups antes do upload:

```bash
# Instalar GPG
sudo apt install gnupg -y

# Gerar chave
gpg --gen-key

# Criptografar backup
gpg --encrypt --recipient seu@email.com backup.sql.gz

# Descriptografar
gpg --decrypt backup.sql.gz.gpg > backup.sql.gz
```

---

## 📈 Melhorias Futuras

### Notificações

Adicione notificações ao script para ser alertado de falhas:

```bash
# Email (requer mailutils configurado)
if ! ./scripts/backup-db.sh; then
  echo "Backup falhou!" | mail -s "Erro no Backup" seu@email.com
fi

# Slack webhook
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"Backup falhou!"}' \
  YOUR_SLACK_WEBHOOK_URL
```

### S3 Lifecycle Policy

Configure no console AWS para mover backups antigos para Glacier (mais barato):

1. Console S3 → Bucket → Management → Lifecycle rules
2. Create rule:
   - Transition to Glacier após 30 dias
   - Delete após 90 dias

### Backup Incremental

Para bancos grandes, considere ferramentas como:
- WAL-G
- pgBackRest
- Barman

---

## 📞 Suporte

### Comandos Úteis

```bash
# Espaço em disco
df -h

# Status do Docker
docker compose ps

# Logs do PostgreSQL
docker logs cpsystem-db --tail=100

# Testar conectividade S3
aws s3 ls

# Verificar tamanho do banco
docker exec cpsystem-db psql -U gustavo -d cobranca -c \
  "SELECT pg_size_pretty(pg_database_size('cobranca'));"
```

### Checklist de Troubleshooting

- [ ] AWS CLI instalado? `aws --version`
- [ ] Credenciais configuradas? `aws s3 ls`
- [ ] Bucket existe? `aws s3 ls s3://cpsystem-backups/`
- [ ] Container rodando? `docker ps | grep cpsystem-db`
- [ ] Script tem permissão? `ls -l scripts/backup-db.sh`
- [ ] Cron configurado? `crontab -l`
- [ ] Espaço em disco? `df -h`
- [ ] Logs de erro? `grep -i error /var/log/cpsystem-backup.log`

---

## 📄 Resumo Rápido

```bash
# Setup inicial (uma vez)
aws configure
aws s3 mb s3://cpsystem-backups

# Teste manual
./scripts/backup-db.sh
aws s3 ls s3://cpsystem-backups/

# Configurar cron
crontab -e
# Adicionar: 0 2 * * * /caminho/completo/backup-db.sh >> /var/log/cpsystem-backup.log 2>&1

# Restaurar backup
./scripts/restore-db.sh

# Monitorar
tail -f /var/log/cpsystem-backup.log
aws s3 ls s3://cpsystem-backups/
```

---

**Backup configurado e funcionando! 🎉**
