class ArtPublication {
  constructor(data) {
    this._id = data._id || uuidv4();
    this.userId = data.userId;
    this.image = data.image || 'uploads/static/default-image-art.jpg';
    this.artType = data.artType;
    this.name = data.name;
    this.name_lowercase = data.name.toLowerCase();
    this.description = data.description || '';
    this.dimension = data.dimension || '';
    this.isForSale = data.isForSale || false;
    this.isSold = data.isSold || false;
    this.price = data.price;
    this.location = data.location || '';
    this.likes = data.likes || [];
    this.comments = data.comments || [];
    this.createdAt = data.createdAt || new Date();
  }

  toJSON() {
    return {
      _id: this._id,
      userId: this.userId,
      image: this.image,
      artType: this.artType,
      name: this.name,
      name_lowercase: this.name_lowercase,
      description: this.description,
      dimension: this.dimension,
      isForSale: this.isForSale,
      isSold: this.isSold,
      price: this.price,
      location: this.location,
      likes: this.likes,
      comments: this.comments,
      createdAt: this.createdAt
    };
  }
}

export { ArtPublication };