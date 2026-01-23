# Fix do Script de Backup - Problema com Credenciais PostgreSQL

## 🐛 Problema Identificado

Quando você executou o script de backup na VPS, ocorreu o seguinte erro:

```
pg_dump: error: connection to server on socket "/var/run/postgresql/.s.PGSQL.5432" failed: 
FATAL: role "gustavo" does not exist
```

### Causa Raiz

O script de backup **não estava carregando** automaticamente as variáveis de ambiente do arquivo `.env` ou `env.production`. Isso fazia com que ele usasse os valores padrão hard-coded:

```bash
DB_USER="${DB_USER:-gustavo}"  # Valor padrão errado
```

Mas o PostgreSQL no container Docker está configurado com credenciais diferentes (definidas no `.env`).

## ✅ Solução Implementada

Ambos os scripts (`backup-db.sh` e `restore-db.sh`) foram atualizados para:

1. **Carregar automaticamente** o arquivo `.env` ou `env.production`
2. **Priorizar** as variáveis `POSTGRES_USER`, `POSTGRES_DB`, `POSTGRES_PASSWORD` do arquivo `.env`
3. **Usar valores padrão** apenas se nenhum arquivo de ambiente for encontrado

### Mudanças nos Scripts

```bash
# Determinar o diretório raiz do projeto
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Carregar arquivo .env se existir
if [ -f "$PROJECT_ROOT/.env" ]; then
    echo "[INFO] Carregando variáveis de $PROJECT_ROOT/.env"
    set -a  # Exportar todas as variáveis
    source "$PROJECT_ROOT/.env"
    set +a
elif [ -f "$PROJECT_ROOT/env.production" ]; then
    echo "[INFO] Carregando variáveis de $PROJECT_ROOT/env.production"
    set -a  # Exportar todas as variáveis
    source "$PROJECT_ROOT/env.production"
    set +a
fi

# PostgreSQL - agora usa as variáveis do .env
DB_NAME="${DB_NAME:-${POSTGRES_DB:-cobranca}}"
DB_USER="${DB_USER:-${POSTGRES_USER:-gustavo}}"
DB_PASSWORD="${DB_PASSWORD:-${POSTGRES_PASSWORD:-139150}}"
```

## 🧪 Como Testar

### 1. Verificar se o arquivo .env existe

```bash
ls -la ~/projects/cp/.env
```

### 2. Testar o script de backup novamente

```bash
cd ~/projects/cp
./scripts/backup-db.sh
```

Você deve ver a mensagem:
```
[INFO] Carregando variáveis de /home/gustavorosa/projects/cp/.env
```

### 3. Verificar se o backup foi criado com sucesso

```bash
ls -lh /tmp/cpsystem-backups/
```

## 📋 Checklist de Verificação

- [ ] Script carrega o arquivo `.env` automaticamente
- [ ] Mensagem "[INFO] Carregando variáveis..." aparece
- [ ] Não há mais erro "role does not exist"
- [ ] Backup é criado em `/tmp/cpsystem-backups/`
- [ ] Upload para S3 funciona corretamente

## 🔐 Segurança

O arquivo `.env` contém credenciais sensíveis e deve ter permissões restritas:

```bash
# Verificar permissões
ls -la ~/projects/cp/.env

# Se necessário, ajustar permissões
sudo chmod 600 ~/projects/cp/.env
sudo chown gustavorosa:gustavorosa ~/projects/cp/.env
```

## 📝 Notas Adicionais

### Ordem de Prioridade das Variáveis

1. Variáveis de ambiente já exportadas no shell
2. Variáveis do arquivo `.env` (se existir)
3. Variáveis do arquivo `env.production` (se existir e .env não existir)
4. Valores padrão hard-coded no script

### Logs

Os logs de backup são salvos em:
```
/var/log/cpsystem-backup.log
```

Para visualizar:
```bash
sudo tail -f /var/log/cpsystem-backup.log
```

## 🔄 Próximos Passos

1. **Execute o script de backup** para confirmar que funciona
2. **Configure o cron job** para backups automáticos (veja `scripts/crontab.example`)
3. **Teste o restore** para garantir que os backups são válidos
4. **Configure AWS credentials** se ainda não tiver feito

---

**Data da correção**: 2026-01-23  
**Arquivos modificados**:
- `scripts/backup-db.sh`
- `scripts/restore-db.sh`
