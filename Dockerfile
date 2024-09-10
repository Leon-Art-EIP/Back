# Stage de build
FROM node:21-alpine AS builder

WORKDIR /app

# Copiez package.json et package-lock.json et installez les dépendances
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copiez uniquement les fichiers nécessaires
COPY src ./src
COPY uploads/static ./uploads/static
COPY server.mjs ./
COPY envSetup.mjs ./ 
# Ajoutez ici d'autres fichiers ou dossiers nécessaires

# Stage final
FROM node:21-alpine

WORKDIR /app

# Copiez les fichiers nécessaires depuis le builder
COPY --from=builder /app /app

# Définissez la variable d'environnement pour le port
ENV PORT=4000

EXPOSE 4000

CMD [ "npm" , "start"]