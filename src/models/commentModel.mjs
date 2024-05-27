import db from '../config/db.mjs';
import { v4 as uuidv4 } from 'uuid';

const cleanUndefinedFields = (obj) => {
  return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined));
};

class Comment {
  constructor(data) {
    this._id = data._id || uuidv4(); // Generate or use provided UUID
    this.userId = data.userId;
    this.artPublicationId = data.artPublicationId;
    this.text = data.text;
    this.createdAt = data.createdAt || new Date().toISOString();
  }

  async save() {
    try {
      console.log('Saving comment:', this);
      const commentRef = db.collection('Comments').doc();
      const data = {
        _id: this._id,
        userId: this.userId,
        artPublicationId: this.artPublicationId,
        text: this.text,
        createdAt: this.createdAt
      };
      await commentRef.set(data);
      await commentRef.update({ _id: commentRef.id })
      this._id = commentRef.id;
      console.log('Comment saved successfully');

      return this;
    } catch (error) {
      console.error('Error saving comment:', error);
      throw new Error('Error saving comment');
    }
  }

  toJSON() {
    return {
      _id: this._id,
      userId: this.userId,
      artPublicationId: this.artPublicationId,
      text: this.text,
      createdAt: this.createdAt
    };
  }

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

  static async updateById(commentId, updateData) {
    try {
      const commentRef = db.collection('Comments').doc(commentId);
      await commentRef.update({
        ...updateData,
        updatedAt: new Date()
      });
      console.log('Comment updated successfully');
    } catch (error) {
      console.error('Error updating comment:', error);
      throw new Error('Error updating comment');
    }
  }

  async update(updateData) {
    try {
      const commentRef = db.collection('Comments').doc(this._id);
      await commentRef.update({
        ...updateData,
        updatedAt: new Date()
      });
      Object.assign(this, updateData);
      console.log('Comment updated successfully');
      return this;
    } catch (error) {
      console.error('Error updating comment:', error);
      throw new Error('Error updating comment');
    }
  }

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

  static async delete() {
    try {
      const commentRef = db.collection('Comments').doc(this._id);
      await commentRef.delete();
      console.log('Comment deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw new Error('Error deleting comment');
    }
  }

  static async findWithOrder(query = {}, orderByField = 'createdAt', orderDirection = 'asc', limit, offset) {
    try {
      let queryRef = db.collection('Comments');

      if (Object.keys(query).length > 0) {
        for (const field in query) {
          queryRef = queryRef.where(field, '==', query[field]);
        }
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
        return querySnapshot.docs.map(doc => new Comment({ ...doc.data(), id: doc.id }));
      } else {
        return [];
      }
    } catch (error) {
      console.error('Error finding comments:', error);
      throw new Error('Error finding comments');
    }
  }

  static async findByIdAndRemove(commentId) {
    try {
      const commentRef = db.collection('Comments').doc(commentId);
      const doc = await commentRef.get();
      if (!doc.exists) {
        throw new Error('Comment not found');
      }
      await commentRef.delete();
      console.log('Comment deleted successfully');
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw new Error('Error deleting comment');
    }
  }

}

export { Comment };
