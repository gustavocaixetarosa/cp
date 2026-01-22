# 🔒 Instruções para Ativar SSL/HTTPS

## ✅ Configuração Concluída

Todos os arquivos do projeto foram atualizados para suportar SSL/HTTPS:

- ✅ `nginx/nginx.conf` - Configurado com HTTP→HTTPS redirect e servidor HTTPS
- ✅ `docker-compose.yml` - Porta 443 exposta e volume SSL montado
- ✅ `scripts/copy-ssl-certs.sh` - Script criado para copiar certificados
- ✅ `README-DOCKER.md` - Documentação atualizada

## 🚀 Próximos Passos na VPS

Execute estes comandos **na VPS** para ativar SSL/HTTPS:

### 1. Copiar certificados para o projeto

```bash
cd /home/gustavorosa/projects/cp

# Usar o script automatizado
./scripts/copy-ssl-certs.sh
```

**Ou manualmente** (se preferir):
```bash
cd /home/gustavorosa/projects/cp

# Copiar certificados
sudo cp /etc/letsencrypt/live/cpacessoriaecobranca.com.br/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/cpacessoriaecobranca.com.br/privkey.pem nginx/ssl/

# Ajustar permissões
sudo chown -R gustavorosa:gustavorosa nginx/ssl/
chmod 600 nginx/ssl/privkey.pem
chmod 644 nginx/ssl/fullchain.pem
```

### 2. Verificar se os certificados foram copiados

```bash
ls -lh nginx/ssl/
```

Deve mostrar:
```
-rw-r--r-- 1 gustavorosa gustavorosa 3.8K fullchain.pem
-rw------- 1 gustavorosa gustavorosa 1.7K privkey.pem
```

### 3. Reiniciar os containers

```bash
cd /home/gustavorosa/projects/cp

# Parar containers
docker compose down

# Subir novamente com as novas configurações
docker compose up -d --build --force-recreate
```

### 4. Verificar se está funcionando

```bash
# Ver logs em tempo real
docker compose logs -f

# Verificar containers rodando
docker ps

# Testar HTTP (deve redirecionar para HTTPS)
curl -I http://cpacessoriaecobranca.com.br/

# Testar HTTPS
curl -I https://cpacessoriaecobranca.com.br/
```

### 5. Abrir firewall (se necessário)

```bash
# Para UFW
sudo ufw allow 443/tcp
sudo ufw status

# Para iptables (se aplicável)
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
sudo iptables-save
```

## 🔍 Verificação

Acesse no navegador:
- ✅ `http://cpacessoriaecobranca.com.br` → Deve redirecionar para HTTPS
- ✅ `https://cpacessoriaecobranca.com.br` → Deve carregar com cadeado verde

## 🔄 Renovação de Certificados

Os certificados Let's Encrypt expiram a cada 90 dias.

### Configurar renovação automática:

1. **Criar script de pós-renovação:**
```bash
sudo nano /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
```

2. **Adicionar conteúdo:**
```bash
#!/bin/bash
cd /home/gustavorosa/projects/cp
./scripts/copy-ssl-certs.sh
docker compose restart nginx
```

3. **Tornar executável:**
```bash
sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
```

4. **Testar renovação (dry-run):**
```bash
sudo certbot renew --dry-run
```

O certbot agora renovará automaticamente e recarregará o Nginx!

## 🛟 Troubleshooting

### Problema: "Connection Refused" em HTTPS

**Solução:**
```bash
# Verificar se porta 443 está exposta
docker ps | grep nginx

# Verificar logs
docker logs cpsystem-nginx

# Verificar firewall
sudo ufw status
```

### Problema: Certificados não encontrados

**Solução:**
```bash
# Verificar dentro do container
docker exec cpsystem-nginx ls -la /etc/nginx/ssl/

# Se não existirem, copiar novamente
./scripts/copy-ssl-certs.sh
docker compose restart nginx
```

### Problema: Erro "certificate verify failed"

**Solução:**
```bash
# Verificar validade dos certificados
sudo certbot certificates

# Renovar se expirados
sudo certbot renew --force-renewal
./scripts/copy-ssl-certs.sh
docker compose restart nginx
```

## 📞 Suporte

Se encontrar problemas, verifique:
1. Logs do Nginx: `docker logs cpsystem-nginx`
2. Logs completos: `docker compose logs`
3. Status dos containers: `docker compose ps`
4. Documentação completa: `README-DOCKER.md`
