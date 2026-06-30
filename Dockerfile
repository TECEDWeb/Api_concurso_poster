FROM node:20-alpine

WORKDIR /app

# Copiar todo primero
COPY . .

# Mostrar contenido del proyecto
RUN echo "========== ARCHIVOS =========="
RUN ls -R

# Mostrar server.js
RUN echo "========== SERVER.JS =========="
RUN cat server.js

# Instalar dependencias
RUN npm install --only=production

EXPOSE 3000

CMD ["node", "server.js"]