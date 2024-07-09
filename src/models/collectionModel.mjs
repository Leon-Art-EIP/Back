class Collection {
  constructor(data) {
    this._id = data.id || data._id; // Firestore document ID  
    this.name = data.name; // Name of the collection
    this.artPublications = data.artPublications || []; // Array of ArtPublication document IDs
    this.isPublic = data.isPublic !== undefined ? data.isPublic : true; // Whether the collection is public
    this.userId = data.userId; // ID of the user who owns the collection
  }

  toJSON() {
    return {
      _id: this._id,
      name: this.name,
      artPublications: this.artPublications,
      isPublic: this.isPublic,
      userId: this.userId
    };
  }
}

export default Collection;
