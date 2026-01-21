#!/bin/bash

#############################################
# CPSystem - Environment Variables Validator
# 
# Este script valida se todas as variáveis
# obrigatórias estão configuradas
#############################################

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Contadores
ERRORS=0
WARNINGS=0
SUCCESS=0

echo -e "${BLUE}"
cat << "EOF"
╔═══════════════════════════════════════════╗
║  CPSystem - Validação de Variáveis de    ║
║           Ambiente                        ║
╚═══════════════════════════════════════════╝
EOF
echo -e "${NC}\n"

# Função para validar variável obrigatória
validate_required() {
    local var_name="$1"
    local var_value="${!var_name}"
    local description="$2"
    
    if [ -z "$var_value" ]; then
        echo -e "${RED}✗ $var_name${NC} - ${YELLOW}$description${NC}"
        echo -e "  ${RED}ERRO: Variável não está definida!${NC}"
        ((ERRORS++))
    else
        echo -e "${GREEN}✓ $var_name${NC} - ${description}"
        echo -e "  Valor: ${var_value}"
        ((SUCCESS++))
    fi
    echo ""
}

# Função para validar variável opcional
validate_optional() {
    local var_name="$1"
    local var_value="${!var_name}"
    local default_value="$2"
    local description="$3"
    
    if [ -z "$var_value" ]; then
        echo -e "${YELLOW}○ $var_name${NC} - ${description}"
        echo -e "  Usando default: ${default_value}"
        ((WARNINGS++))
    else
        echo -e "${GREEN}✓ $var_name${NC} - ${description}"
        echo -e "  Valor: ${var_value}"
        ((SUCCESS++))
    fi
    echo ""
}

# Função para validar força da senha
validate_password_strength() {
    local password="$1"
    local var_name="$2"
    
    if [ ${#password} -lt 16 ]; then
        echo -e "  ${YELLOW}⚠ AVISO: Senha tem menos de 16 caracteres (recomendado mínimo 16)${NC}"
        ((WARNINGS++))
    fi
    
    if [[ "$password" == "139150" ]] || [[ "$password" == "senha123" ]] || [[ "$password" == "password" ]]; then
        echo -e "  ${RED}⚠ ERRO: Senha fraca detectada! Use uma senha forte em produção!${NC}"
        ((ERRORS++))
    fi
}

# Função para validar CORS
validate_cors() {
    local origins="$1"
    
    if [[ "$origins" == *"http://"* ]] && [[ "$origins" != *"localhost"* ]]; then
        echo -e "  ${YELLOW}⚠ AVISO: CORS contém HTTP (inseguro). Use HTTPS em produção!${NC}"
        ((WARNINGS++))
    fi
    
    if [[ "$origins" == "*" ]]; then
        echo -e "  ${RED}⚠ ERRO: CORS configurado com wildcard (*)! Muito inseguro!${NC}"
        ((ERRORS++))
    fi
}

# ==========================================
# VALIDAÇÕES - VARIÁVEIS OBRIGATÓRIAS
# ==========================================

echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}VARIÁVEIS OBRIGATÓRIAS${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}\n"

# Database
validate_required "POSTGRES_DB" "Nome do banco de dados"
validate_required "POSTGRES_USER" "Usuário do PostgreSQL"
validate_required "POSTGRES_PASSWORD" "Senha do PostgreSQL"

if [ ! -z "$POSTGRES_PASSWORD" ]; then
    validate_password_strength "$POSTGRES_PASSWORD" "POSTGRES_PASSWORD"
fi

# Backend
validate_required "SPRING_DATASOURCE_URL" "URL JDBC do Spring"
validate_required "SPRING_DATASOURCE_USERNAME" "Usuário do banco (Spring)"
validate_required "SPRING_DATASOURCE_PASSWORD" "Senha do banco (Spring)"

if [ ! -z "$SPRING_DATASOURCE_PASSWORD" ]; then
    validate_password_strength "$SPRING_DATASOURCE_PASSWORD" "SPRING_DATASOURCE_PASSWORD"
fi

# CORS
validate_required "ALLOWED_ORIGINS" "Origens permitidas (CORS)"

if [ ! -z "$ALLOWED_ORIGINS" ]; then
    validate_cors "$ALLOWED_ORIGINS"
fi

# Backups
validate_required "S3_BUCKET" "Bucket S3 para backups"
validate_required "DB_NAME" "Nome do banco (para backup)"
validate_required "DB_USER" "Usuário do banco (para backup)"
validate_required "DB_PASSWORD" "Senha do banco (para backup)"

# ==========================================
# VALIDAÇÕES - VARIÁVEIS OPCIONAIS
# ==========================================

echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}VARIÁVEIS OPCIONAIS${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}\n"

validate_optional "SPRING_PROFILES_ACTIVE" "prod" "Perfil Spring"
validate_optional "SPRING_JPA_SHOW_SQL" "false" "Mostrar SQL no log"
validate_optional "JAVA_OPTS" "-Xmx512m -Xms256m" "Opções da JVM"
validate_optional "NODE_ENV" "production" "Ambiente Node.js"
validate_optional "NEXT_PUBLIC_API_URL" "/api/v1" "URL da API (frontend)"
validate_optional "AWS_REGION" "us-east-1" "Região AWS"
validate_optional "RETENTION_DAYS" "7" "Dias de retenção (S3)"
validate_optional "LOCAL_RETENTION_DAYS" "3" "Dias de retenção (local)"
validate_optional "DB_CONTAINER" "cpsystem-db" "Nome do container do banco"

# ==========================================
# VALIDAÇÕES ADICIONAIS
# ==========================================

echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}VALIDAÇÕES ADICIONAIS${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}\n"

# Verificar se arquivo .env existe
if [ -f ".env" ]; then
    echo -e "${GREEN}✓ Arquivo .env encontrado${NC}"
    
    # Verificar permissões
    PERMS=$(stat -c "%a" .env 2>/dev/null || stat -f "%A" .env 2>/dev/null)
    if [ "$PERMS" == "600" ]; then
        echo -e "${GREEN}✓ Permissões do .env corretas (600)${NC}"
    else
        echo -e "${YELLOW}⚠ AVISO: Permissões do .env são $PERMS (recomendado: 600)${NC}"
        echo -e "  Execute: chmod 600 .env"
        ((WARNINGS++))
    fi
else
    echo -e "${YELLOW}○ Arquivo .env não encontrado${NC}"
    echo -e "  Usando valores padrão ou variáveis de ambiente do sistema"
fi
echo ""

# Verificar se .env está no .gitignore
if [ -f ".gitignore" ] && grep -q "^\.env$" .gitignore; then
    echo -e "${GREEN}✓ .env está no .gitignore${NC}"
else
    echo -e "${RED}✗ .env NÃO está no .gitignore!${NC}"
    echo -e "  ${RED}PERIGO: Credenciais podem ser commitadas por engano!${NC}"
    echo -e "  Adicione '.env' ao .gitignore"
    ((ERRORS++))
fi
echo ""

# Verificar Docker
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✓ Docker instalado${NC}"
    docker --version
else
    echo -e "${RED}✗ Docker não está instalado${NC}"
    ((ERRORS++))
fi
echo ""

# Verificar Docker Compose
if docker compose version &> /dev/null; then
    echo -e "${GREEN}✓ Docker Compose instalado${NC}"
    docker compose version
else
    echo -e "${RED}✗ Docker Compose não está instalado${NC}"
    ((ERRORS++))
fi
echo ""

# Verificar AWS CLI (para backups)
if command -v aws &> /dev/null; then
    echo -e "${GREEN}✓ AWS CLI instalado${NC}"
    aws --version
    
    # Testar acesso ao bucket S3
    if [ ! -z "$S3_BUCKET" ]; then
        if aws s3 ls "s3://$S3_BUCKET" &> /dev/null; then
            echo -e "${GREEN}✓ Acesso ao bucket S3 confirmado${NC}"
        else
            echo -e "${YELLOW}⚠ Não foi possível acessar o bucket S3${NC}"
            echo -e "  Verifique: aws s3 ls s3://$S3_BUCKET"
            ((WARNINGS++))
        fi
    fi
else
    echo -e "${YELLOW}○ AWS CLI não está instalado${NC}"
    echo -e "  Necessário para backups automáticos"
    ((WARNINGS++))
fi
echo ""

# ==========================================
# RESUMO
# ==========================================

echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}RESUMO DA VALIDAÇÃO${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}\n"

echo -e "${GREEN}✓ Sucessos:${NC} $SUCCESS"
echo -e "${YELLOW}⚠ Avisos:${NC} $WARNINGS"
echo -e "${RED}✗ Erros:${NC} $ERRORS"
echo ""

# ==========================================
# RESULTADO FINAL
# ==========================================

if [ $ERRORS -eq 0 ]; then
    if [ $WARNINGS -eq 0 ]; then
        echo -e "${GREEN}╔═══════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║  ✓ TUDO OK! Pronto para produção!       ║${NC}"
        echo -e "${GREEN}╚═══════════════════════════════════════════╝${NC}"
        exit 0
    else
        echo -e "${YELLOW}╔═══════════════════════════════════════════╗${NC}"
        echo -e "${YELLOW}║  ⚠ Configuração OK com avisos           ║${NC}"
        echo -e "${YELLOW}║  Revise os avisos acima                  ║${NC}"
        echo -e "${YELLOW}╚═══════════════════════════════════════════╝${NC}"
        exit 0
    fi
else
    echo -e "${RED}╔═══════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  ✗ ERROS ENCONTRADOS!                    ║${NC}"
    echo -e "${RED}║  Corrija os erros antes de continuar     ║${NC}"
    echo -e "${RED}╚═══════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}Para mais informações, consulte:${NC}"
    echo -e "  - PRODUCTION-ENV.md (guia completo)"
    echo -e "  - env.example (template)"
    echo -e "  - env.development (valores de dev)"
    exit 1
fi
