// Import Firestore from your configured instance or the Firebase Admin SDK
import db from '../config/db.mjs'; // Ensure this is correctly set up to access Firestore

class Collection {
  constructor(data) {
    this.name = data.name; // Name of the collection
    this.artPublications = data.artPublications || []; // Array of ArtPublication document IDs
    this.isPublic = data.isPublic !== undefined ? data.isPublic : true; // Whether the collection is public
    this.userId = data.userId; // ID of the user who owns the collection
  }

  // Save the collection to Firestore
  async save() {
    const collectionRef = db.collection('Collections').doc(); // Creates a new document with a generated ID
    await collectionRef.set({
      name: this.name,
      artPublications: this.artPublications,
      isPublic: this.isPublic,
      userId: this.userId
    });
    this.id = collectionRef.id; // Store the Firestore document ID within the object
    return this;
  }

  // Static method to fetch a collection by ID from Firestore
  static async findById(collectionId) {
    const doc = await db.collection('Collections').doc(collectionId).get();
    if (!doc.exists) {
      throw new Error('Collection not found');
    }
    return new Collection({ ...doc.data(), id: doc.id });
  }

  // Optionally, you could add methods to update the collection, add or remove art publications, etc.
}

// Export the Collection class so it can be used elsewhere in your application
export default Collection;
