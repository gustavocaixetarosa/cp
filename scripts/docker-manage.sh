#!/bin/bash

# Script de gerenciamento Docker para CPSystem
# Uso: ./scripts/docker-manage.sh [comando]

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

show_help() {
    cat << EOF
$(print_header "CPSystem - Gerenciamento Docker")

Uso: ./scripts/docker-manage.sh [comando]

Comandos disponíveis:

  start           Inicia todos os serviços (build se necessário)
  stop            Para todos os serviços
  restart         Reinicia todos os serviços
  rebuild         Reconstrói e reinicia todos os serviços
  logs            Mostra logs de todos os serviços
  logs-f          Mostra logs em tempo real
  status          Mostra status dos containers
  health          Verifica health dos serviços
  clean           Para e remove todos os containers e volumes
  clean-all       Limpeza completa (inclui imagens)
  
  backend         Gerencia apenas o backend
  frontend        Gerencia apenas o frontend
  nginx           Gerencia apenas o nginx
  
Exemplos:
  ./scripts/docker-manage.sh start
  ./scripts/docker-manage.sh logs-f frontend
  ./scripts/docker-manage.sh rebuild backend

EOF
}

start() {
    print_header "Iniciando CPSystem"
    docker-compose up -d --build
    print_success "Serviços iniciados!"
    print_info "Frontend: http://localhost"
    print_info "Backend API: http://localhost/api"
    print_info "Health: http://localhost/actuator/health"
}

stop() {
    print_header "Parando CPSystem"
    docker-compose down
    print_success "Serviços parados!"
}

restart() {
    print_header "Reiniciando CPSystem"
    docker-compose restart
    print_success "Serviços reiniciados!"
}

rebuild() {
    print_header "Reconstruindo CPSystem"
    if [ -z "$1" ]; then
        docker-compose down
        docker-compose up -d --build
    else
        docker-compose up -d --build "$1"
    fi
    print_success "Reconstrução completa!"
}

logs() {
    if [ -z "$1" ]; then
        docker-compose logs --tail=100
    else
        docker-compose logs --tail=100 "$1"
    fi
}

logs_follow() {
    if [ -z "$1" ]; then
        docker-compose logs -f
    else
        docker-compose logs -f "$1"
    fi
}

status() {
    print_header "Status dos Containers"
    docker-compose ps
    echo ""
    print_header "Uso de Recursos"
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"
}

health() {
    print_header "Verificando Saúde dos Serviços"
    
    echo -e "\n${YELLOW}Nginx:${NC}"
    curl -f http://localhost/ > /dev/null 2>&1 && print_success "OK" || print_error "FALHOU"
    
    echo -e "\n${YELLOW}Backend Health:${NC}"
    curl -f http://localhost/actuator/health 2>&1 | grep -q "UP" && print_success "OK" || print_error "FALHOU"
    
    echo -e "\n${YELLOW}PostgreSQL:${NC}"
    docker-compose exec -T postgres pg_isready -U gustavo > /dev/null 2>&1 && print_success "OK" || print_error "FALHOU"
}

clean() {
    print_header "Limpando Containers e Volumes"
    print_info "Isso vai REMOVER todos os dados do banco!"
    read -p "Tem certeza? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker-compose down -v
        print_success "Limpeza completa!"
    else
        print_info "Operação cancelada"
    fi
}

clean_all() {
    print_header "Limpeza Completa do Sistema"
    print_error "Isso vai REMOVER containers, volumes E imagens!"
    read -p "Tem certeza? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker-compose down -v
        docker-compose down --rmi all
        docker system prune -f
        print_success "Limpeza completa do sistema!"
    else
        print_info "Operação cancelada"
    fi
}

# Main
case "${1:-help}" in
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        restart "${2:-}"
        ;;
    rebuild)
        rebuild "${2:-}"
        ;;
    logs)
        logs "${2:-}"
        ;;
    logs-f)
        logs_follow "${2:-}"
        ;;
    status)
        status
        ;;
    health)
        health
        ;;
    clean)
        clean
        ;;
    clean-all)
        clean_all
        ;;
    backend|frontend|nginx|postgres)
        if [ -z "$2" ]; then
            print_error "Especifique uma ação (restart, logs, logs-f, rebuild)"
            exit 1
        fi
        case "$2" in
            restart)
                docker-compose restart "$1"
                ;;
            logs)
                logs "$1"
                ;;
            logs-f)
                logs_follow "$1"
                ;;
            rebuild)
                rebuild "$1"
                ;;
            *)
                print_error "Ação inválida: $2"
                exit 1
                ;;
        esac
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Comando inválido: $1"
        show_help
        exit 1
        ;;
esac
