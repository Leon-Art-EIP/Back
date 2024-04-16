import admin from 'firebase-admin';
import serviceAccountJson from '../../leon-art-d8942-firebase-adminsdk-zkdcu-115fd03559.json' assert { type: 'json' };

const serviceAccount = serviceAccountJson as admin.ServiceAccount;

const connectDB = async () => {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

    console.log("Firebase connected...");
    const db = admin.firestore();
    return db;
  } catch (err: unknown) {
    console.error("Error connecting to Firebase:", (err as Error).message);
    process.exit(1);
  }
};

export default connectDB;
