import db from '../config/db.mjs'; // Assurez-vous que c'est le chemin correct pour accéder à Firestore

class Message {
  constructor(data) {
    this.id = data.id; // ID of the conversation to which this message belongs
    this.senderId = data.senderId; // User ID of the sender
    this.contentType = data.contentType; // Type of content, e.g., 'text', 'image'
    this.content = data.content; // Content of the message
    this.dateTime = data.dateTime; // Date and time when the message was sent
    this.read = data.read || false; // Whether the message has been read, default is false
  }

  // Save the message to Firestore
  async save() {
    try {
      const messageRef = db.collection('Messages').doc(); // Creates a new document with a generated ID
      await messageRef.set({
        id: this.id,
        senderId: this.senderId,
        contentType: this.contentType,
        content: this.content,
        dateTime: this.dateTime,
        read: this.read
      });
      this.messageId = messageRef.id; // Store the Firestore document ID within the object
      return this;
    } catch (error) {
      console.error('Error saving message:', error);
      throw new Error('Error saving message');
    }
  }

  // Static method to fetch a message by ID from Firestore
  static async findById(messageId) {
    try {
      const doc = await db.collection('Messages').doc(messageId).get();
      if (!doc.exists) {
        throw new Error('Message not found');
      }
      return new Message({ ...doc.data(), messageId: doc.id });
    } catch (error) {
      console.error('Error finding message by ID:', error);
      throw new Error('Error finding message');
    }
  }

  // Static method to update a message by ID
  static async updateById(messageId, updateData) {
    try {
      const messageRef = db.collection('Messages').doc(messageId);
      await messageRef.update(updateData);
      console.log('Message updated successfully');
    } catch (error) {
      console.error('Error updating message:', error);
      throw new Error('Error updating message');
    }
  }

  // Static method to delete a message by ID
  static async deleteById(messageId) {
    try {
      const messageRef = db.collection('Messages').doc(messageId);
      await messageRef.delete();
      console.log('Message deleted successfully');
    } catch (error) {
      console.error('Error deleting message:', error);
      throw new Error('Error deleting message');
    }
  }

  // Mark a message as read
  async markAsRead() {
    try {
      const messageRef = db.collection('Messages').doc(this.messageId);
      await messageRef.update({ read: true });
      this.read = true; // Update the local instance
      console.log('Message marked as read');
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw new Error('Error marking message as read');
    }
  }

  static async update(updateData) {
    try {
      const messageRef = db.collection('Messages').doc(this.messageId);
      await messageRef.update({
        ...updateData,
        updatedAt: new Date() // Optionally add/update a timestamp field
      });
      Object.assign(this, updateData); // Update the local instance with new data
      console.log('Message updated successfully');
      return this;
    } catch (error) {
      console.error('Error updating message:', error);
      throw new Error('Error updating message');
    }
  }
}

// Export the Message class so it can be used elsewhere in your application
export default Message;
