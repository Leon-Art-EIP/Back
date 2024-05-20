import admin from 'firebase-admin';
import serviceAccountJson from '../../leon-art-d8942-firebase-adminsdk-zkdcu-115fd03559.json' assert { type: 'json' };

// Initialise Firebase Admin directement sans utiliser une fonction
admin.initializeApp({
  credential: admin.credential.cert(serviceAccountJson)
});

console.log("Firebase connected...");
const db = admin.firestore();

export default db;
