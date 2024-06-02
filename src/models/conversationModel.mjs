import db from '../config/db.mjs'; // Assurez-vous que c'est le chemin correct pour accéder à Firestore

class Conversation {
  constructor(data) {
    this._id = data._id;
    this.lastMessage = data.lastMessage;
    this.unreadMessages = data.unreadMessages || false;
    this.UserOneId = data.UserOneId;
    this.UserOneName = data.UserOneName;
    this.UserOnePicture = data.UserOnePicture;
    this.UserTwoId = data.UserTwoId;
    this.UserTwoName = data.UserTwoName;
    this.UserTwoPicture = data.UserTwoPicture;
  }

  async save() {
    try {
      const conversationRef = db.collection('Conversations').doc(); // Creates a new document with a generated ID
      await conversationRef.set({
        lastMessage: this.lastMessage,
        unreadMessages: this.unreadMessages,
        UserOneId: this.UserOneId,
        UserOneName: this.UserOneName,
        UserOnePicture: this.UserOnePicture,
        UserTwoId: this.UserTwoId,
        UserTwoName: this.UserTwoName,
        UserTwoPicture: this.UserTwoPicture
      });
      this._id = conversationRef.id;
      return this;
    } catch (error) {
      console.error('Error saving conversation:', error);
      throw new Error('Error saving conversation');
    }
  }

  // Static method to fetch a conversation by ID from Firestore
  static async findById(conversationId) {
    try {
      const doc = await db.collection('Conversations').doc(conversationId).get();
      if (!doc.exists) {
        throw new Error('Conversation not found');
      }
      return new Conversation({ ...doc.data(), id: doc.id });
    } catch (error) {
      console.error('Error finding conversation by ID:', error);
      throw new Error('Error finding conversation');
    }
  }

  // Static method to update a conversation by ID
  static async updateById(conversationId, updateData) {
    try {
      const conversationRef = db.collection('Conversations').doc(conversationId);
      await conversationRef.update({
        ...updateData,
        updatedAt: new Date() // Optionally add/update a timestamp field
      });
      console.log('Conversation updated successfully');
    } catch (error) {
      console.error('Error updating conversation:', error);
      throw new Error('Error updating conversation');
    }
  }

  // Update the current conversation instance
  async update(updateData) {
    try {
      const conversationRef = db.collection('Conversations').doc(this.id);
      await conversationRef.update({
        ...updateData,
        updatedAt: new Date() // Optionally add/update a timestamp field
      });
      Object.assign(this, updateData); // Update the local instance with new data
      console.log('Conversation updated successfully');
      return this;
    } catch (error) {
      console.error('Error updating conversation:', error);
      throw new Error('Error updating conversation');
    }
  }

  // Static method to delete a conversation by ID
  static async deleteById(conversationId) {
    try {
      const conversationRef = db.collection('Conversations').doc(conversationId);
      await conversationRef.delete();
      console.log('Conversation deleted successfully');
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw new Error('Error deleting conversation');
    }
  }

  // Mark a conversation as having unread messages
  async markAsUnread() {
    try {
      const conversationRef = db.collection('Conversations').doc(this.id);
      await conversationRef.update({ unreadMessages: true });
      this.unreadMessages = true; // Update the local instance
      console.log('Conversation marked as unread');
    } catch (error) {
      console.error('Error marking conversation as unread:', error);
      throw new Error('Error marking conversation as unread');
    }
  }

  // Mark a conversation as having read messages
  async markAsRead() {
    try {
      const conversationRef = db.collection('Conversations').doc(this.id);
      await conversationRef.update({ unreadMessages: false });
      this.unreadMessages = false; // Update the local instance
      console.log('Conversation marked as read');
    } catch (error) {
      console.error('Error marking conversation as read:', error);
      throw new Error('Error marking conversation as read');
    }
  }

  static async updateOne(updateData) {
    try {
      const conversationRef = db.collection('Conversations').doc(updateData.id);
      await conversationRef.update({
        ...updateData,
        updatedAt: new Date() // Optionally add/update a timestamp field
      });
      console.log('Conversation updated successfully');
    } catch (error) {
      console.error('Error updating conversation:', error);
      throw new Error('Error updating conversation');
    }
  }

  static async deleteOne(query) {
    try {
      const conversations = await this.find(query);
      if (conversations.length > 0) {
        await db.collection('Conversations').doc(conversations[0].id).delete();
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw new Error('Error deleting conversation');
    }
  }

  static async find(query = {}) {
    try {
      let conversationsRef = db.collection('Conversations');
      if (query) {
        if (query.field && query.value) {
          conversationsRef = conversationsRef.where(query.field, '==', query.value);
        }
        if (query.limit) {
          conversationsRef = conversationsRef.limit(query.limit);
        }
      }
      const snapshot = await conversationsRef.get();
      const conversations = [];
      snapshot.forEach(doc => {
        conversations.push(new Conversation({ ...doc.data(), id: doc.id }));
      });
      return conversations;
    } catch (error) {
      console.error('Error finding conversations:', error);
      throw new Error('Error finding conversations');
    }
  }

  static async findOne(query) {
    if (!query.UserOneId || !query.UserTwoId) {
      throw new Error('User IDs cannot be undefined.');
    }

    const snapshot = await db.collection('Conversations')
      .where('UserOneId', '==', query.UserOneId)
      .where('UserTwoId', '==', query.UserTwoId)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return new Conversation({ ...doc.data(), _id: doc.id });
    }

    return null;
  }
}

// Export the Conversation class so it can be used elsewhere in your application
export default Conversation;
