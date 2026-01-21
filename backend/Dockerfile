# Stage 1: Build
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /app

# Copiar arquivos do Maven Wrapper e pom.xml primeiro (para cache de camadas)
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .

# Dar permissão de execução ao Maven Wrapper
RUN chmod +x mvnw

# Baixar dependências (esta camada será cacheada se o pom.xml não mudar)
RUN ./mvnw dependency:go-offline -B

# Copiar código fonte
COPY src ./src

# Compilar a aplicação
RUN ./mvnw clean package -DskipTests

# Stage 2: Runtime
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Instalar curl para health check
RUN apk add --no-cache curl

# Criar usuário não-root para executar a aplicação
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Copiar o JAR compilado do stage de build
COPY --from=builder /app/target/*.jar app.jar

# Expor a porta padrão do Spring Boot
EXPOSE 8080

# Variáveis de ambiente com valores padrão
ENV SPRING_PROFILES_ACTIVE=prod
ENV JAVA_OPTS="-Xmx512m -Xms256m"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

# Executar a aplicação
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
