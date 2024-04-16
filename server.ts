// Importation des modules nécessaires
import app, { httpServer } from './src/app'; // Suppression de .mjs pour les fichiers convertis en .ts
import connectDB from "./src/config/db"; // Même chose ici

// Connexion à la base de données
connectDB();

// Définition du port du serveur
const PORT = process.env.PORT || 5000;

// Démarrage du serveur HTTP
httpServer.listen(PORT, () => console.log(`Server started on port ${PORT}`));