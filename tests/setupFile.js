import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import fs from 'fs';

let testEnv;

beforeAll(async () => {
  // Initialisation de l'environnement de test Firebase
  testEnv = await initializeTestEnvironment({
    projectId: process.env.FIREBASE_PROJECT_ID,
    firestore: {
      host: "localhost",
      port: 8080,
      rules: fs.readFileSync('firestore.rules', 'utf8'), // Charger les règles de sécurité Firestore
    },
  });

  // Attendre que l'émulateur soit prêt
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Initialiser les contextes d'authentification et Firestore pour les tests
  const context = testEnv.unauthenticatedContext();
  global.db = context.firestore();
  global.auth = context.auth();
}, 30000); // Ajout d'un délai de 30 secondes pour beforeAll

afterAll(async () => {
  // Nettoyage de l'environnement de test Firebase
  if (testEnv) {
    await testEnv.cleanup();
  }
});
