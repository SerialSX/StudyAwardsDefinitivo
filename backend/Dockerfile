# 1. Usa uma imagem leve do Node.js 18
FROM node:18-alpine

# 2. Cria a pasta do app dentro do container
WORKDIR /app

# 3. Instala dependências do sistema necessárias para o SQLite (python, make, g++)
RUN apk add --no-cache python3 make g++

# 4. Copia os arquivos de dependência primeiro (pra ser mais rápido)
COPY package*.json ./

# 5. Instala as bibliotecas do projeto
RUN npm install --production

# 6. Copia todo o resto do código
COPY . .

# 7. Cria a pasta de uploads (pro SQLite não reclamar)
RUN mkdir -p uploads

# 8. Expõe a porta (Documentação)
EXPOSE 3000

# 9. Comando pra rodar
CMD ["node", "server.js"]