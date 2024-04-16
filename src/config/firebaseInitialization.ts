// Importation des modules nécessaires
import admin from 'firebase-admin';
import fireorm from 'fireorm';

// Importation de la configuration de Firebase Admin avec l'assertion de type
import serviceAccount from '../../leon-art-d8942-firebase-adminsdk-zkdcu-115fd03559.json' assert { type: 'json' };

// Initialisation de Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});

// Obtention de l'instance Firestore
const firestore = admin.firestore();

// Initialisation de fireorm avec l'instance Firestore
fireorm.initialize(firestore);
