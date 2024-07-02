import fs from 'fs';
import admin from 'firebase-admin';
import dotenv from 'dotenv';
import logger from '../admin/logger.mjs'; // Assurez-vous que le chemin est correct

// Chargez les variables d'environnement à partir du fichier .env
dotenv.config();

// Vérifiez si la variable d'environnement SERVICE_ACCOUNT_KEY_PATH est définie
const serviceAccountPath = process.env.SERVICE_ACCOUNT_KEY_PATH;

if (!serviceAccountPath) {
    logger.error('SERVICE_ACCOUNT_KEY_PATH is not defined in environment variables.');
    throw new Error('SERVICE_ACCOUNT_KEY_PATH is not defined in environment variables.');
}

// Vérifiez si le fichier de clé de compte de service existe
if (!fs.existsSync(serviceAccountPath)) {
    logger.error(`Service account key file not found at path: ${serviceAccountPath}`);
    throw new Error(`Service account key file not found at path: ${serviceAccountPath}`);
}

let serviceAccount;
try {
    // Lisez le fichier de clé de compte de service
    serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
} catch (err) {
    logger.error(`Failed to read service account file at ${serviceAccountPath}: ${err.message}`);
    throw new Error(`Failed to read service account file at ${serviceAccountPath}: ${err.message}`);
}

// Initialisez Firebase Admin SDK
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://leon-art.firebaseio.com",
}, 'notification');

logger.info("Firebase Notification connected...");
export default admin;
