import { v4 as uuidv4 } from 'uuid';

class Comment {
  constructor(data) {
    this._id = data._id || uuidv4();
    this.userId = data.userId;
    this.artPublicationId = data.artPublicationId;
    this.text = data.text;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.likes = data.likes || [];
    this.parentCommentId = data.parentCommentId || null; // For nested comments
  }

  toJSON() {
    return {
      _id: this._id,
      userId: this.userId,
      artPublicationId: this.artPublicationId,
      text: this.text,
      createdAt: this.createdAt,
      likes: this.likes,
      parentCommentId: this.parentCommentId
    };
  }
}

export { Comment };
