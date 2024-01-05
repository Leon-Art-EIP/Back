# Utilisez une image Node.js comme image de base
FROM node:20-alpine

# Créez un répertoire de travail pour votre application
WORKDIR /app

# Copiez les fichiers package.json et package-lock.json dans le répertoire de travail
# et installez les dépendances de l'application, puis nettoyez le cache npm
COPY package*.json ./
RUN npm install && npm cache clean --force

# Copiez le reste des fichiers de l'application dans le répertoire de travail
COPY . .

# Définissez la variable d'environnement pour le port 5000
ENV PORT=5000

# Exposez le port 5000 pour que les connexions puissent être établies
EXPOSE 5000

# Démarrez l'application
CMD [ "npm", "start" ]
