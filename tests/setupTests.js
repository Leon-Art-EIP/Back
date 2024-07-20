import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

process.env.NODE_ENV = 'dev';
process.env.TEST_ENABLED = true;
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.FIRESTORE_PROJECT_ID = 'leon-art-d8942';

const firebaseConfig = {
  apiKey: 'fake-api-key',
  authDomain: 'fake-auth-domain',
  projectId: process.env.FIRESTORE_PROJECT_ID,
  storageBucket: 'fake-storage-bucket',
  messagingSenderId: 'fake-sender-id',
  appId: 'fake-app-id',
};

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

// Connect to Firestore emulator
connectFirestoreEmulator(firestore, 'localhost', 8080);

global.firestore = firestore;
