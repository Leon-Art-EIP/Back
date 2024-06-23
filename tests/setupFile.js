import * as firebase from '@firebase/testing';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectId = "leon-art-d8942"; // Remplacez par un ID de projet de test
const firestoreRules = fs.readFileSync('firestore.rules');

let testEnv;

beforeAll(async () => {
  await firebase.loadFirestoreRules({
    projectId,
    rules: firestoreRules,
  });

  testEnv = firebase.initializeTestApp({
    projectId,
    auth: { uid: "testUser" }
  });

  global.db = testEnv.firestore();
}, 30000); // Ajout d'un délai de 30 secondes pour beforeAll

afterAll(async () => {
  // Nettoyage de l'environnement de test Firebase
  await firebase.clearFirestoreData({ projectId });
  await Promise.all(firebase.apps().map(app => app.delete()));
});