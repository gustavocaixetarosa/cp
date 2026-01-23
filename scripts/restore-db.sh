#!/bin/bash

#############################################
# CPSystem - PostgreSQL Restore from AWS S3
# 
# Este script restaura backups do banco de 
# dados PostgreSQL a partir do S3
#############################################

set -e  # Exit on error

# ==========================================
# CARREGAR VARIÁVEIS DE AMBIENTE
# ==========================================

# Determinar o diretório raiz do projeto
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Carregar arquivo .env se existir
if [ -f "$PROJECT_ROOT/.env" ]; then
    echo "[INFO] Carregando variáveis de $PROJECT_ROOT/.env"
    # Carregar apenas variáveis específicas necessárias para restore
    export $(grep -E "^(POSTGRES_|DB_|AWS_|S3_)" "$PROJECT_ROOT/.env" | grep -v '^#' | xargs)
elif [ -f "$PROJECT_ROOT/env.production" ]; then
    echo "[INFO] Carregando variáveis de $PROJECT_ROOT/env.production"
    export $(grep -E "^(POSTGRES_|DB_|AWS_|S3_)" "$PROJECT_ROOT/env.production" | grep -v '^#' | xargs)
fi

# ==========================================
# CONFIGURAÇÕES - AJUSTE CONFORME NECESSÁRIO
# ==========================================

# AWS S3
S3_BUCKET="${S3_BUCKET:-cpsystem-backups-dev}"
AWS_REGION="${AWS_REGION:-us-east-1}"

# PostgreSQL
DB_CONTAINER="${DB_CONTAINER:-cpsystem-db}"
DB_NAME="${DB_NAME:-${POSTGRES_DB:-cobranca}}"
DB_USER="${DB_USER:-${POSTGRES_USER:-gustavo}}"
DB_PASSWORD="${DB_PASSWORD:-${POSTGRES_PASSWORD:-139150}}"

# Restore settings
RESTORE_DIR="${RESTORE_DIR:-/tmp/cpsystem-restore}"
LOG_FILE="${LOG_FILE:-/var/log/cpsystem-restore.log}"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ==========================================
# FUNÇÕES
# ==========================================

log() {
    echo -e "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" | tee -a "$LOG_FILE"
    exit 1
}

info() {
    echo -e "${BLUE}$1${NC}"
}

success() {
    echo -e "${GREEN}$1${NC}"
}

warning() {
    echo -e "${YELLOW}$1${NC}"
}

check_dependencies() {
    log "Verificando dependências..."
    
    # Verificar Docker
    if ! command -v docker &> /dev/null; then
        error "Docker não está instalado"
    fi
    
    # Verificar AWS CLI
    if ! command -v aws &> /dev/null; then
        error "AWS CLI não está instalado. Instale com: sudo apt install awscli"
    fi
    
    # Verificar container PostgreSQL
    if ! docker ps | grep -q "$DB_CONTAINER"; then
        error "Container PostgreSQL '$DB_CONTAINER' não está rodando"
    fi
    
    log "Dependências verificadas ✓"
}

create_restore_dir() {
    if [ ! -d "$RESTORE_DIR" ]; then
        mkdir -p "$RESTORE_DIR"
        log "Diretório de restore criado: $RESTORE_DIR"
    fi
}

list_backups() {
    info "\n=========================================="
    info "Backups Disponíveis no S3"
    info "=========================================="
    
    local backups=$(aws s3 ls "s3://${S3_BUCKET}/" --region "$AWS_REGION" | grep "cpsystem-backup-" | sort -r)
    
    if [ -z "$backups" ]; then
        error "Nenhum backup encontrado no bucket S3: $S3_BUCKET"
    fi
    
    local count=1
    declare -g -A backup_map
    
    echo "$backups" | while read -r line; do
        local date=$(echo "$line" | awk '{print $1, $2}')
        local size=$(echo "$line" | awk '{print $3}')
        local filename=$(echo "$line" | awk '{print $4}')
        
        # Extrair data do nome do arquivo
        local backup_date=$(echo "$filename" | grep -oP '\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}')
        
        printf "%2d) %s | Tamanho: %10s | %s\n" "$count" "$backup_date" "$size" "$filename"
        backup_map[$count]="$filename"
        ((count++))
    done
    
    info "==========================================\n"
    
    # Retornar lista de arquivos
    echo "$backups" | awk '{print $4}'
}

select_backup() {
    local backups=("$@")
    local count=1
    
    info "Selecione o backup para restaurar:"
    for backup in "${backups[@]}"; do
        local backup_date=$(echo "$backup" | grep -oP '\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}')
        echo "$count) $backup_date - $backup"
        ((count++))
    done
    
    echo ""
    read -p "Digite o número do backup (ou 'q' para sair): " choice
    
    if [ "$choice" == "q" ] || [ "$choice" == "Q" ]; then
        log "Restore cancelado pelo usuário"
        exit 0
    fi
    
    if ! [[ "$choice" =~ ^[0-9]+$ ]] || [ "$choice" -lt 1 ] || [ "$choice" -ge "$count" ]; then
        error "Seleção inválida"
    fi
    
    echo "${backups[$((choice-1))]}"
}

download_backup() {
    local backup_filename="$1"
    local local_path="${RESTORE_DIR}/${backup_filename}"
    local s3_path="s3://${S3_BUCKET}/${backup_filename}"
    
    log "Baixando backup do S3..."
    log "Origem: $s3_path"
    log "Destino: $local_path"
    
    if aws s3 cp "$s3_path" "$local_path" --region "$AWS_REGION"; then
        log "Download concluído com sucesso ✓"
        echo "$local_path"
    else
        error "Falha ao baixar backup do S3"
    fi
}

verify_backup() {
    local backup_path="$1"
    
    log "Verificando integridade do backup..."
    
    # Testar se o arquivo gzip é válido
    if gzip -t "$backup_path" 2>/dev/null; then
        success "Arquivo de backup válido ✓"
        return 0
    else
        error "Arquivo de backup está corrompido!"
    fi
}

confirm_restore() {
    warning "\n=========================================="
    warning "ATENÇÃO: OPERAÇÃO DESTRUTIVA"
    warning "=========================================="
    warning "Esta operação irá:"
    warning "1. DROPAR o banco de dados atual"
    warning "2. Recriar o banco de dados"
    warning "3. Restaurar os dados do backup"
    warning "\nTodos os dados atuais serão PERDIDOS!"
    warning "==========================================\n"
    
    read -p "Tem certeza que deseja continuar? Digite 'RESTAURAR' para confirmar: " confirmation
    
    if [ "$confirmation" != "RESTAURAR" ]; then
        log "Restore cancelado pelo usuário"
        exit 0
    fi
    
    log "Confirmação recebida. Prosseguindo com restore..."
}

perform_restore() {
    local backup_path="$1"
    
    log "Iniciando restore do banco de dados..."
    
    # Descompactar e restaurar
    log "Descompactando backup..."
    
    # Dropar conexões existentes
    log "Encerrando conexões ativas com o banco..."
    docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d postgres -c "SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname = '$DB_NAME' AND pid <> pg_backend_pid();" &>/dev/null || true
    
    # Dropar e recriar banco
    log "Recriando banco de dados..."
    docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;" || error "Falha ao dropar banco de dados"
    docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME;" || error "Falha ao criar banco de dados"
    
    # Restaurar backup
    log "Restaurando dados do backup..."
    if gunzip -c "$backup_path" | docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" > /dev/null 2>&1; then
        success "Restore concluído com sucesso ✓"
    else
        error "Falha ao restaurar backup"
    fi
}

verify_restore() {
    log "Verificando restore..."
    
    # Verificar se o banco existe e tem tabelas
    local table_count=$(docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | xargs)
    
    if [ "$table_count" -gt 0 ]; then
        success "Banco de dados restaurado com $table_count tabela(s) ✓"
        return 0
    else
        warning "Atenção: Banco de dados restaurado mas nenhuma tabela encontrada"
        return 1
    fi
}

cleanup() {
    log "Limpando arquivos temporários..."
    rm -rf "$RESTORE_DIR"/*
    log "Limpeza concluída ✓"
}

show_summary() {
    local backup_filename="$1"
    
    info "\n==================== RESUMO ===================="
    success "Restore concluído com sucesso!"
    info "Backup restaurado: $backup_filename"
    info "Banco de dados: $DB_NAME"
    info "Container: $DB_CONTAINER"
    info "================================================\n"
}

# ==========================================
# MAIN
# ==========================================

main() {
    log "=========================================="
    log "Iniciando processo de restore"
    log "=========================================="
    
    # Verificações iniciais
    check_dependencies
    create_restore_dir
    
    # Listar backups disponíveis
    mapfile -t backup_list < <(list_backups)
    
    if [ ${#backup_list[@]} -eq 0 ]; then
        error "Nenhum backup disponível"
    fi
    
    # Selecionar backup
    backup_filename=$(select_backup "${backup_list[@]}")
    log "Backup selecionado: $backup_filename"
    
    # Confirmar operação
    confirm_restore
    
    # Download do backup
    backup_path=$(download_backup "$backup_filename")
    
    # Verificar integridade
    verify_backup "$backup_path"
    
    # Realizar restore
    perform_restore "$backup_path"
    
    # Verificar restore
    verify_restore
    
    # Limpeza
    cleanup
    
    # Resumo
    show_summary "$backup_filename"
    
    log "=========================================="
    
    exit 0
}

# Executar
main "$@"
