import MockFirebase from 'firebase-mock';

// Initialiser les services mock
const mockAuth = new MockFirebase.MockFirebase();
const mockFirestore = new MockFirebase.MockFirestore();

mockAuth.autoFlush();
mockFirestore.autoFlush();

// Créer le SDK mock
const mockSdk = new MockFirebase.MockFirebaseSdk(
    // mock authentication
    () => mockAuth,
    // mock firestore
    () => mockFirestore
);

export default mockSdk;
