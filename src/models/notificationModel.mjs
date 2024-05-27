import db from '../config/db.mjs'; // Assurez-vous que c'est le chemin correct pour accéder à Firestore
import { v4 as uuidv4 } from 'uuid';

const cleanUndefinedFields = (obj) => {
  return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined));
};

class Notification {
  constructor(data) {
    this.recipient = data.recipient; // Expecting recipient's user ID as a string
    this.type = data.type; // Type of the notification, e.g., 'like', 'comment', 'order'
    this.content = data.content; // Custom message for the notification
    this.referenceId = data.referenceId || null; // Optional ID of the related item
    this.read = data.read || false; // Default false if not provided
    this.createdAt = data.createdAt || new Date().toISOString();
    this.id = data.id || uuidv4(); // Generate or use provided UUID
  }

  // Save the notification to Firestore
  async save() {
    try {
      const notificationRef = db.collection('Notifications').doc(); // Creates a new document with a generated ID
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
    } catch (error) {
      console.error('Error saving notification:', error);
      throw new Error('Error saving notification');
    }
  }

  // Static method to fetch a notification by ID from Firestore
  static async findById(notificationId) {
    try {
      const doc = await db.collection('Notifications').doc(notificationId).get();
      if (!doc.exists) {
        throw new Error('Notification not found');
      }
      return new Notification({ ...doc.data(), id: doc.id });
    } catch (error) {
      console.error('Error finding notification by ID:', error);
      throw new Error('Error finding notification');
    }
  }

  // Static method to update a notification by ID
  static async updateById(notificationId, updateData) {
    try {
      const notificationRef = db.collection('Notifications').doc(notificationId);
      await notificationRef.update(updateData);
      console.log('Notification updated successfully');
    } catch (error) {
      console.error('Error updating notification:', error);
      throw new Error('Error updating notification');
    }
  }

  // Static method to delete a notification by ID
  static async deleteById(notificationId) {
    try {
      const notificationRef = db.collection('Notifications').doc(notificationId);
      await notificationRef.delete();
      console.log('Notification deleted successfully');
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw new Error('Error deleting notification');
    }
  }

  // Mark a notification as read
  async markAsRead() {
    try {
      const notificationRef = db.collection('Notifications').doc(this.id);
      await notificationRef.update({ read: true });
      this.read = true; // Update the local instance
      console.log('Notification marked as read');
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw new Error('Error marking notification as read');
    }
  }

  static async update(updateData) {
    try {
      const notificationRef = db.collection('Notifications').doc(this.id);
      await notificationRef.update({
        ...updateData,
        updatedAt: new Date().toISOString() // Optionally add/update a timestamp field
      });
      Object.assign(this, updateData); // Update the local instance with new data
      console.log('Notification updated successfully');
      return this;
    } catch (error) {
      console.error('Error updating notification:', error);
      throw new Error('Error updating notification');
    }
  }

  static async find(query = {}) {
    let queryRef = db.collection('Notifications');

    if (Object.keys(query).length > 0) {
      queryRef = queryRef.where(Object.keys(query)[0], '==', Object.values(query)[0]);
    }

    const querySnapshot = await queryRef.get();

    if (!querySnapshot.empty) {
      return querySnapshot.docs.map(doc => new Notification({ ...doc.data(), id: doc.id }));
    } else {
      return [];
    }
  }

  static async findWithOrder(query = {}, orderByField, orderDirection = 'asc', limit, offset) {
    let queryRef = db.collection('Notifications');

    if (Object.keys(query).length > 0) {
      queryRef = queryRef.where(Object.keys(query)[0], '==', Object.values(query)[0]);
    }

    queryRef = queryRef.orderBy(orderByField, orderDirection);

    if (offset) {
      queryRef = queryRef.offset(offset);
    }

    if (limit) {
      queryRef = queryRef.limit(limit);
    }

    const querySnapshot = await queryRef.get();

    if (!querySnapshot.empty) {
      return querySnapshot.docs.map(doc => new Notification({ ...doc.data(), id: doc.id }));
    } else {
      return [];
    }
  }

  static async countDocuments(query) {
    try {
      let notificationsRef = db.collection('Notifications');
      // Apply the query parameters to the Firestore collection
      if (query) {
        if (query.recipient) {
          notificationsRef = notificationsRef.where('recipient', '==', query.recipient);
        }
        if (query.type) {
          notificationsRef = notificationsRef.where('type', '==', query.type);
        }
        if (query.read) {
          notificationsRef = notificationsRef.where('read', '==', query.read);
        }
      }
      // Retrieve the query results and return the count
      const snapshot = await notificationsRef.get();
      return snapshot.size;
    } catch (error) {
      console.error('Error counting notifications:', error);
      throw new Error('Error counting notifications');
    }
  }
}

// Export the Notification class so it can be used elsewhere in your application
export { Notification };
