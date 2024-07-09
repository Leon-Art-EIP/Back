class Comment {
  constructor(data) {
    this._id = data._id || uuidv4();
    this.userId = data.userId;
    this.artPublicationId = data.artPublicationId;
    this.text = data.text;
    this.createdAt = data.createdAt || new Date().toISOString();
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
}

export { Comment };
