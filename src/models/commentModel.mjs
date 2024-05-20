// Import Firestore from your configured instance or the Firebase Admin SDK
import db from '../config/db.mjs'; // Ensure this is correctly set up to access Firestore

class Comment {
  constructor(data) {
    this.userId = data.userId; // ID of the user who made the comment
    this.artPublicationId = data.artPublicationId; // ID of the art publication being commented on
    this.text = data.text; // The comment text
    this.createdAt = data.createdAt || new Date(); // Date and time the comment was made
  }

  // Save the comment to Firestore
  async save() {
    const commentRef = db.collection('Comments').doc(); // Creates a new document with a generated ID
    await commentRef.set({
      userId: this.userId,
      artPublicationId: this.artPublicationId,
      text: this.text,
      createdAt: this.createdAt
    });
    this.id = commentRef.id; // Store the Firestore document ID within the object
    return this;
  }

  // Static method to fetch a comment by ID from Firestore
  static async findById(commentId) {
    const doc = await db.collection('Comments').doc(commentId).get();
    if (!doc.exists) {
      throw new Error('Comment not found');
    }
    return new Comment({ ...doc.data(), id: doc.id });
  }
}

// Export the Comment class so it can be used elsewhere in your application
export { Comment };
