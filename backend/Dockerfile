FROM node:20-alpine

# Instalar herramientas necesarias
RUN apk add --no-cache dumb-init

WORKDIR /app

# Copiar dependencias primero (aprovecha cache de Docker)
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copiar código fuente
COPY . .

# Usuario no-root por seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
USER nodejs

EXPOSE 3000

# dumb-init maneja señales correctamente (PID 1)
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/server.js"]
