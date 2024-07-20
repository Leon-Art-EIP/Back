import { v4 as uuidv4 } from 'uuid';

class Post {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.userId = data.userId;
    this.text = data.text;
    this.artPublicationId = data.artPublicationId || null;
    this.likes = data.likes || [];
    this.createdAt = data.createdAt || new Date();
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      text: this.text,
      artPublicationId: this.artPublicationId,
      likes: this.likes,
      createdAt: this.createdAt,
    };
  }
}

export { Post };
