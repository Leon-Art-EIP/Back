import db from '../config/db.mjs'; // Assurez-vous que c'est le chemin correct pour accéder à Firestore
import { v4 as uuidv4 } from 'uuid'; // Importez la fonction uuid pour générer des identifiants uniques
class Comment {
  constructor(data) {
    this._id = data._id || uuidv4(); // Firestore document ID
    this.userId = data.userId; // ID of the user who made the comment
    this.artPublicationId = data.artPublicationId; // ID of the art publication being commented on
    this.text = data.text; // The comment text
    this.createdAt = data.createdAt || new Date(); // Date and time the comment was made
  }

  // Save the comment to Firestore
  async save() {
    try {
      const commentRef = db.collection('Comments').doc(); // Creates a new document with a generated ID
      await commentRef.set({
        userId: this.userId,
        artPublicationId: this.artPublicationId,
        text: this.text,
        createdAt: this.createdAt
      });
      this._id = commentRef.id; // Store the Firestore document ID within the object
      return this;
    } catch (error) {
      console.error('Error saving comment:', error);
      throw new Error('Error saving comment');
    }
  }

  // Static method to fetch a comment by ID from Firestore
  static async findById(commentId) {
    try {
      const doc = await db.collection('Comments').doc(commentId).get();
      if (!doc.exists) {
        throw new Error('Comment not found');
      }
      return new Comment({ ...doc.data(), id: doc.id });
    } catch (error) {
      console.error('Error finding comment by ID:', error);
      throw new Error('Error finding comment');
    }
  }

  // Static method to update a comment by ID
  static async updateById(commentId, updateData) {
    try {
      const commentRef = db.collection('Comments').doc(commentId);
      await commentRef.update({
        ...updateData,
        updatedAt: new Date() // Optionally add/update a timestamp field
      });
      console.log('Comment updated successfully');
    } catch (error) {
      console.error('Error updating comment:', error);
      throw new Error('Error updating comment');
    }
  }

  // Update the current comment instance
  async update(updateData) {
    try {
      const commentRef = db.collection('Comments').doc(this.id);
      await commentRef.update({
        ...updateData,
        updatedAt: new Date() // Optionally add/update a timestamp field
      });
      Object.assign(this, updateData); // Update the local instance with new data
      console.log('Comment updated successfully');
      return this;
    } catch (error) {
      console.error('Error updating comment:', error);
      throw new Error('Error updating comment');
    }
  }

  // Static method to delete a comment by ID
  static async deleteById(commentId) {
    try {
      const commentRef = db.collection('Comments').doc(commentId);
      await commentRef.delete();
      console.log('Comment deleted successfully');
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw new Error('Error deleting comment');
    }
  }
}

// Export the Comment class so it can be used elsewhere in your application
export { Comment };
