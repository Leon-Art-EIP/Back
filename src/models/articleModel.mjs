class Article {
  constructor(data) {
    this._id = data._id;
    this.title = data.title;
    this.mainImage = data.mainImage;
    this.content = data.content;
    this.authorId = data.authorId;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.position = data.position;
  }
}

export { Article };
