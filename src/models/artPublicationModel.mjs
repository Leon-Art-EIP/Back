// Import Firestore from your configured instance or the Firebase Admin SDK
import db from '../config/db.mjs'; // Ensure this is correctly set up to access Firestore

class ArtPublication {
  constructor(data) {
    this.userId = data.userId; // ID of the user who created the art publication
    this.image = data.image || 'uploads/static/default-image-art.jpg'; // Image URL
    this.artType = data.artType; // Type of art
    this.name = data.name; // Name of the art
    this.description = data.description || ''; // Description of the art
    this.dimension = data.dimension || ''; // Dimensions of the art
    this.isForSale = data.isForSale || false; // Whether the art is for sale
    this.isSold = data.isSold || false; // Whether the art is sold
    this.price = data.price; // Price of the art
    this.location = data.location || ''; // Location of the art
    this.likes = data.likes || []; // Array of user IDs who liked the art
    this.comments = data.comments || []; // Array of comment IDs on the art
  }

  // Save the art publication to Firestore
  async save() {
    const artPublicationRef = db.collection('ArtPublications').doc(); // Creates a new document with a generated ID
    await artPublicationRef.set({
      userId: this.userId,
      image: this.image,
      artType: this.artType,
      name: this.name,
      description: this.description,
      dimension: this.dimension,
      isForSale: this.isForSale,
      isSold: this.isSold,
      price: this.price,
      location: this.location,
      likes: this.likes,
      comments: this.comments
    });
    this.id = artPublicationRef.id; // Store the Firestore document ID within the object
    return this;
  }

  // Static method to fetch an art publication by ID from Firestore
  static async findById(artPublicationId) {
    const doc = await db.collection('ArtPublications').doc(artPublicationId).get();
    if (!doc.exists) {
      throw new Error('Art publication not found');
    }
    return new ArtPublication({ ...doc.data(), id: doc.id });
  }
}

// Export the ArtPublication class so it can be used elsewhere in your application
export { ArtPublication };
