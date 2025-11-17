# Estágio de build
FROM node:18 AS builder

# Instalar dependências do sistema necessárias
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de configuração
COPY package*.json ./
COPY tsconfig.json ./

# Instalar dependências
RUN npm ci --only=development

# Copiar código fonte
COPY . .

# Build da aplicação
RUN npm run build

# Estágio de produção
FROM node:18

# Instalar dependências do sistema para runtime
RUN apt-get update && apt-get install -y dumb-init && rm -rf /var/lib/apt/lists/* \
    && groupadd -g 1001 nodejs \
    && useradd -m -u 1001 -g nodejs nestjs

# Definir diretório de trabalho
WORKDIR /app

# Copiar package.json
COPY package*.json ./

# Instalar apenas dependências de produção
RUN npm ci --only=production && npm cache clean --force

# Copiar arquivos buildados do estágio anterior
COPY --from=builder /app/dist ./dist

# Criar diretório para uploads
RUN mkdir -p /app/uploads && chown -R nestjs:nodejs /app/uploads

# Mudar para usuário não-root
USER nestjs

# Expor porta
EXPOSE 3001

# Comando para iniciar a aplicação
CMD ["dumb-init", "node", "dist/main"]