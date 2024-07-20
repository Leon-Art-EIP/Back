import admin from 'firebase-admin';
import serviceAccountJson from '../../leon-art-d8942-firebase-adminsdk-zkdcu-115fd03559.json' assert { type: 'json' };
import logger from '../admin/logger.mjs'; // Assurez-vous d'avoir le chemin correct vers votre fichier de logger

// Initialise Firebase Admin directement sans utiliser une fonction
admin.initializeApp({
  credential: admin.credential.cert(serviceAccountJson)
});

logger.info("Firebase connected...");
const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });


export default db;
