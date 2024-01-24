# Utilisez une image Node.js comme image de base
FROM node:20-alpine

# Créez un répertoire de travail pour votre application
WORKDIR /app

# Copiez les fichiers package.json et package-lock.json dans le répertoire de travail
COPY package*.json ./

# Installez les dépendances de l'application
RUN npm install

RUN npm install -g bcrypt

# Copiez le reste des fichiers de l'application dans le répertoire de travail
COPY . .

# Définissez la variable d'environnement pour le port 3333
ENV PORT=5000

# Exposez le port 3333 pour que les connexions puissent être établies
EXPOSE 5000

# Démarrez l'application
CMD [ "npm", "start" ]
