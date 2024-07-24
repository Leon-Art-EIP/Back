import admin from 'firebase-admin';
import serviceAccountJson from '../../leon-art-d8942-firebase-adminsdk-zkdcu-115fd03559.json' assert { type: 'json' };
import logger from '../admin/logger.mjs'; // Assurez-vous d'avoir le chemin correct vers votre fichier de logger

// Log environment variable to ensure it's being read correctly
const firestoreEmulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
logger.info(`FIRESTORE_EMULATOR_HOST: ${firestoreEmulatorHost}`);

// Initialise Firebase Admin directement sans utiliser une fonction
admin.initializeApp({
  credential: admin.credential.cert(serviceAccountJson)
});

const db = admin.firestore();

if (firestoreEmulatorHost) {
  logger.info(`Connecting to Firestore emulator at ${firestoreEmulatorHost}`);
  db.settings({
    host: firestoreEmulatorHost,
    ssl: false,
    ignoreUndefinedProperties: true
  });
} else {
  logger.info('Connecting to Firestore production instance');
}

logger.info("Initialization complete");

// Test connection to Firestore to ensure the emulator is running
async function testFirestoreConnection() {
  try {
    logger.info("Attempting to connect to Firestore");
    await db.collection('test').doc('testDoc').get();
    logger.info('Connected to Firestore successfully.');
  } catch (error) {
    logger.error('Error connecting to Firestore:', error.message, error.stack);
    process.exit(1);
  }
}

testFirestoreConnection();

export default db;
