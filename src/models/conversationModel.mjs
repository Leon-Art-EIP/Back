// Import Firestore from your configured instance or the Firebase Admin SDK
import db from '../config/db.mjs'; // Ensure this is set up correctly to access Firestore

class Conversation {
  constructor(data) {
    this.lastMessage = data.lastMessage; // The last message text in the conversation
    this.unreadMessages = data.unreadMessages || false; // Boolean to track if there are unread messages
    this.userOneId = data.userOneId; // ID of the first user
    this.userOneName = data.userOneName; // Name of the first user
    this.userOnePicture = data.userOnePicture; // Picture URL of the first user
    this.userTwoId = data.userTwoId; // ID of the second user
    this.userTwoName = data.userTwoName; // Name of the second user
    this.userTwoPicture = data.userTwoPicture; // Picture URL of the second user
  }

  // Save the conversation to Firestore
  async save() {
    const conversationRef = db.collection('Conversations').doc(); // Creates a new document with a generated ID
    await conversationRef.set({
      lastMessage: this.lastMessage,
      unreadMessages: this.unreadMessages,
      userOneId: this.userOneId,
      userOneName: this.userOneName,
      userOnePicture: this.userOnePicture,
      userTwoId: this.userTwoId,
      userTwoName: this.userTwoName,
      userTwoPicture: this.userTwoPicture
    });
    this.id = conversationRef.id; // Store the Firestore document ID within the object
    return this;
  }

  // Static method to fetch a conversation by ID from Firestore
  static async findById(conversationId) {
    const doc = await db.collection('Conversations').doc(conversationId).get();
    if (!doc.exists) {
      throw new Error('Conversation not found');
    }
    return new Conversation({ ...doc.data(), id: doc.id });
  }
}

// Export the Conversation class so it can be used elsewhere in your application
export default Conversation;
