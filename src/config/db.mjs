import admin from 'firebase-admin';
// Notez l'ajout de "assert { type: 'json' }" à la fin de l'importation
import serviceAccount from '../../leon-art-d8942-firebase-adminsdk-zkdcu-115fd03559.json'assert { type: 'json' };

const connectDB = async () => {
  try {
    // Initialisez l'application Firebase Admin avec les informations d'authentification
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

    console.log("Firebase connected...");

    // Obtenez une référence à la base de données Firestore
    const db = admin.firestore();
    return db; // Retournez la référence pour l'utiliser dans votre application
  } catch (err) /* istanbul ignore next */ {
    console.error("Error connecting to Firebase:", err.message);
    process.exit(1);
  }
};

export default connectDB;
