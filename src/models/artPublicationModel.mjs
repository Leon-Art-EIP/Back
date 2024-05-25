import db from '../config/db.mjs';
import { v4 as uuidv4 } from 'uuid';

const cleanUndefinedFields = (obj) => {
  return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined));
};

class ArtPublication {
  constructor(data) {
    this._id = data._id || uuidv4();
    this.userId = data.userId;
    this.image = data.image || 'uploads/static/default-image-art.jpg';
    this.artType = data.artType;
    this.name = data.name;
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

  async save() {
    const artPublicationRef = db.collection('ArtPublications').doc();
    const data = cleanUndefinedFields(this.toJSON());
    await artPublicationRef.set(data);
    this._id = artPublicationRef.id;
    return this;
  }

  toJSON() {
    return {
      userId: this.userId,
      image: this.image,
      artType: this.artType,
      name: this.name,
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

  static async findById(artPublicationId) {
    const doc = await db.collection('ArtPublications').doc(artPublicationId).get();
    if (!doc.exists) {
      throw new Error('Art publication not found');
    }
    return new ArtPublication({ ...doc.data(), id: doc.id });
  }

  static async find(query = {}) {
    let queryRef = db.collection('ArtPublications');

    if (Object.keys(query).length > 0) {
      queryRef = queryRef.where(Object.keys(query)[0], '==', Object.values(query)[0]);
    }

    const querySnapshot = await queryRef.get();

    if (!querySnapshot.empty) {
      return querySnapshot.docs.map(doc => new ArtPublication({ ...doc.data(), id: doc.id }));
    } else {
      return [];
    }
  }

  static async findWithOrder(query = {}, orderByField, orderDirection = 'asc', limit, offset) {
    let queryRef = db.collection('ArtPublications');

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
      return querySnapshot.docs.map(doc => new ArtPublication({ ...doc.data(), id: doc.id }));
    } else {
      return [];
    }
  }

  static async deleteOne(query) {
    const artPublication = await this.findOne(query);
    if (artPublication) {
      await db.collection('ArtPublications').doc(artPublication.id).delete();
      return true;
    } else {
      return false;
    }
  }

  async update(data) {
    const artPublicationRef = db.collection('ArtPublications').doc(this.id);
    const doc = await artPublicationRef.get();
    if (doc.exists) {
      const cleanData = cleanUndefinedFields(data);
      await artPublicationRef.update(cleanData);
      Object.assign(this, data);
      return true;
    } else {
      return false;
    }
  }
}

export { ArtPublication };
