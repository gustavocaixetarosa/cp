#!/bin/bash

#############################################
# CPSystem - Instalação do Sistema de Backup
# 
# Este script automatiza a instalação e 
# configuração do sistema de backup
#############################################

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
cat << "EOF"
╔═══════════════════════════════════════════╗
║   CPSystem - Setup de Backup para S3     ║
╚═══════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Verificar se está rodando como usuário normal (não root)
if [ "$EUID" -eq 0 ]; then 
    echo -e "${RED}Não execute este script como root!${NC}"
    echo "Execute como usuário normal: ./scripts/INSTALL-BACKUP.sh"
    exit 1
fi

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo -e "${YELLOW}Diretório do projeto: $PROJECT_DIR${NC}\n"

# Função para perguntar sim/não
ask_yes_no() {
    local question="$1"
    local response
    
    while true; do
        read -p "$question (s/n): " response
        case $response in
            [Ss]* ) return 0;;
            [Nn]* ) return 1;;
            * ) echo "Por favor responda s ou n.";;
        esac
    done
}

# 1. Verificar e instalar AWS CLI
echo -e "${BLUE}[1/6] Verificando AWS CLI...${NC}"
if command -v aws &> /dev/null; then
    echo -e "${GREEN}✓ AWS CLI já está instalado: $(aws --version)${NC}"
else
    echo -e "${YELLOW}AWS CLI não está instalado${NC}"
    if ask_yes_no "Deseja instalar AWS CLI agora?"; then
        echo "Instalando AWS CLI..."
        sudo apt update
        sudo apt install awscli -y
        echo -e "${GREEN}✓ AWS CLI instalado com sucesso!${NC}"
    else
        echo -e "${RED}AWS CLI é necessário. Instale manualmente: sudo apt install awscli${NC}"
        exit 1
    fi
fi
echo ""

# 2. Configurar credenciais AWS
echo -e "${BLUE}[2/6] Configurando credenciais AWS...${NC}"
if [ -f ~/.aws/credentials ]; then
    echo -e "${GREEN}✓ Arquivo de credenciais AWS já existe${NC}"
    if ask_yes_no "Deseja reconfigurar?"; then
        aws configure
    fi
else
    echo -e "${YELLOW}Credenciais AWS não configuradas${NC}"
    echo "Você precisará de:"
    echo "  - AWS Access Key ID"
    echo "  - AWS Secret Access Key"
    echo "  - Região (ex: us-east-1)"
    echo ""
    if ask_yes_no "Deseja configurar agora?"; then
        aws configure
    else
        echo -e "${YELLOW}⚠ Você pode configurar depois com: aws configure${NC}"
    fi
fi
echo ""

# 3. Configurar bucket S3
echo -e "${BLUE}[3/6] Configurando Bucket S3...${NC}"
read -p "Digite o nome do bucket S3 (padrão: cpsystem-backups): " bucket_name
bucket_name=${bucket_name:-cpsystem-backups}

echo "Verificando se bucket '$bucket_name' existe..."
if aws s3 ls "s3://$bucket_name" 2>/dev/null; then
    echo -e "${GREEN}✓ Bucket '$bucket_name' já existe${NC}"
else
    echo -e "${YELLOW}Bucket '$bucket_name' não existe${NC}"
    if ask_yes_no "Deseja criar o bucket agora?"; then
        read -p "Digite a região AWS (padrão: us-east-1): " region
        region=${region:-us-east-1}
        
        echo "Criando bucket..."
        aws s3 mb "s3://$bucket_name" --region "$region"
        echo -e "${GREEN}✓ Bucket criado com sucesso!${NC}"
        
        # Habilitar criptografia
        if ask_yes_no "Deseja habilitar criptografia no bucket?"; then
            aws s3api put-bucket-encryption \
                --bucket "$bucket_name" \
                --server-side-encryption-configuration '{
                    "Rules": [{
                        "ApplyServerSideEncryptionByDefault": {
                            "SSEAlgorithm": "AES256"
                        }
                    }]
                }'
            echo -e "${GREEN}✓ Criptografia habilitada!${NC}"
        fi
    else
        echo -e "${YELLOW}⚠ Crie o bucket manualmente antes de usar o backup${NC}"
    fi
fi

# Atualizar variável no script
sed -i "s/S3_BUCKET=.*/S3_BUCKET=\"$bucket_name\"/" "$PROJECT_DIR/scripts/backup-db.sh"
sed -i "s/S3_BUCKET=.*/S3_BUCKET=\"$bucket_name\"/" "$PROJECT_DIR/scripts/restore-db.sh"
echo -e "${GREEN}✓ Scripts atualizados com o nome do bucket${NC}"
echo ""

# 4. Testar backup
echo -e "${BLUE}[4/6] Testando backup...${NC}"
if ask_yes_no "Deseja executar um backup de teste agora?"; then
    echo "Executando backup..."
    if "$PROJECT_DIR/scripts/backup-db.sh"; then
        echo -e "${GREEN}✓ Backup de teste bem-sucedido!${NC}"
        echo "Verificando no S3..."
        aws s3 ls "s3://$bucket_name/" | tail -5
    else
        echo -e "${RED}✗ Backup falhou. Verifique os logs.${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Execute manualmente: ./scripts/backup-db.sh${NC}"
fi
echo ""

# 5. Configurar cron
echo -e "${BLUE}[5/6] Configurando backup automático (cron)...${NC}"
if ask_yes_no "Deseja configurar backup diário automático?"; then
    echo "Horários sugeridos para backup:"
    echo "  1) 02:00 AM (padrão)"
    echo "  2) 03:00 AM"
    echo "  3) 23:00 PM (11 PM)"
    echo "  4) Personalizado"
    
    read -p "Escolha uma opção (1-4): " time_option
    
    case $time_option in
        1)
            cron_time="0 2 * * *"
            ;;
        2)
            cron_time="0 3 * * *"
            ;;
        3)
            cron_time="0 23 * * *"
            ;;
        4)
            echo "Formato: minuto hora dia mês dia_da_semana"
            echo "Exemplo: 0 2 * * * (todo dia às 02:00)"
            read -p "Digite o horário cron: " cron_time
            ;;
        *)
            cron_time="0 2 * * *"
            ;;
    esac
    
    cron_line="$cron_time $PROJECT_DIR/scripts/backup-db.sh >> /var/log/cpsystem-backup.log 2>&1"
    
    # Verificar se já existe
    if crontab -l 2>/dev/null | grep -q "backup-db.sh"; then
        echo -e "${YELLOW}⚠ Já existe um cron job para backup${NC}"
        if ask_yes_no "Deseja substituir?"; then
            # Remover linha antiga e adicionar nova
            (crontab -l 2>/dev/null | grep -v "backup-db.sh"; echo "$cron_line") | crontab -
            echo -e "${GREEN}✓ Cron job atualizado!${NC}"
        fi
    else
        # Adicionar nova linha
        (crontab -l 2>/dev/null; echo "$cron_line") | crontab -
        echo -e "${GREEN}✓ Cron job adicionado!${NC}"
    fi
    
    echo ""
    echo "Cron job configurado:"
    echo "$cron_line"
    echo ""
    echo "Para editar: crontab -e"
    echo "Para listar: crontab -l"
else
    echo -e "${YELLOW}⚠ Configure manualmente depois: crontab -e${NC}"
    echo "Adicione a linha:"
    echo "0 2 * * * $PROJECT_DIR/scripts/backup-db.sh >> /var/log/cpsystem-backup.log 2>&1"
fi
echo ""

# 6. Resumo
echo -e "${BLUE}[6/6] Resumo da Instalação${NC}"
echo -e "${GREEN}╔═══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     Instalação Concluída com Sucesso!    ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════╝${NC}"
echo ""
echo "Configurações:"
echo "  • AWS CLI: $(aws --version)"
echo "  • Bucket S3: $bucket_name"
echo "  • Scripts: $PROJECT_DIR/scripts/"
echo "  • Logs: /var/log/cpsystem-backup.log"
echo ""
echo "Próximos passos:"
echo "  1. Testar backup: ./scripts/backup-db.sh"
echo "  2. Verificar S3: aws s3 ls s3://$bucket_name/"
echo "  3. Ver logs: tail -f /var/log/cpsystem-backup.log"
echo "  4. Testar restore: ./scripts/restore-db.sh"
echo ""
echo "Documentação completa: scripts/BACKUP-README.md"
echo ""

# Criar arquivo de configuração
cat > "$PROJECT_DIR/.backup-config" << EOF
# CPSystem Backup Configuration
S3_BUCKET=$bucket_name
CONFIGURED_DATE=$(date)
EOF

echo -e "${GREEN}✓ Setup completo! O sistema de backup está pronto para uso.${NC}"
