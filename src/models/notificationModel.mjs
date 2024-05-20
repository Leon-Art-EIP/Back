// Import Firestore from your configured instance or the Firebase Admin SDK
import db from '../config/db.mjs'; // Ensure this is set up correctly to access Firestore

class Notification {
  constructor(data) {
    // Initialize the notification with data, providing default values if necessary
    this.recipient = data.recipient; // Expecting recipient's user ID as a string
    this.type = data.type; // Type of the notification, e.g., 'like', 'comment', 'order'
    this.content = data.content; // Custom message for the notification
    this.referenceId = data.referenceId || null; // Optional ID of the related item
    this.read = data.read || false; // Default false if not provided
    this.createdAt = data.createdAt || new Date(); // Use current time if not provided
  }

  // Save the notification to Firestore
  async save() {
    const notificationRef = db.collection('Notifications').doc(); // Creates a new document with a generated ID
    // Manually set the document data without using toJSON
    await notificationRef.set({
      recipient: this.recipient,
      type: this.type,
      content: this.content,
      referenceId: this.referenceId,
      read: this.read,
      createdAt: this.createdAt
    });
    this.id = notificationRef.id; // Store the Firestore document ID within the object
    return this;
  }

  // Static method to fetch a notification by ID from Firestore
  static async findById(notificationId) {
    const doc = await db.collection('Notifications').doc(notificationId).get();
    if (!doc.exists) {
      throw new Error('Notification not found');
    }
    // Construct a new Notification object with the document data
    return new Notification({ ...doc.data(), id: doc.id });
  }
}

// Export the Notification class so it can be used elsewhere in your application
export { Notification };
