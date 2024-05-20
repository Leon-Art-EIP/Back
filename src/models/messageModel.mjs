// Import Firestore from your configured instance or the Firebase Admin SDK
import db from '../config/db.mjs'; // Ensure this is set up correctly to access Firestore

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
  }

  // Static method to fetch a message by ID from Firestore
  static async findById(messageId) {
    const doc = await db.collection('Messages').doc(messageId).get();
    if (!doc.exists) {
      throw new Error('Message not found');
    }
    return new Message({ ...doc.data(), messageId: doc.id });
  }
}

// Export the Message class so it can be used elsewhere in your application
export default Message;
