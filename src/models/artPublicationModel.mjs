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
    await artPublicationRef.update({ _id: artPublicationRef.id });
    this._id = artPublicationRef.id;
    return this;
  }

  toJSON() {
    return {
      _id: this._id,
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
    return new ArtPublication({ ...doc.data(), _id: doc.id });
  }

  static async find(query = {}) {
    let queryRef = db.collection('ArtPublications');

    if (Object.keys(query).length > 0) {
      queryRef = queryRef.where(Object.keys(query)[0], '==', Object.values(query)[0]);
    }

    const querySnapshot = await queryRef.get();

    if (!querySnapshot.empty) {
      return querySnapshot.docs.map(doc => new ArtPublication({ ...doc.data(), _id: doc.id }));
    } else {
      return [];
    }
  }

  static async findOne(query) {
    let queryRef = db.collection('ArtPublications');

    if (Object.keys(query).length > 0) {
      queryRef = queryRef.where(Object.keys(query)[0], '==', Object.values(query)[0]);
    }

    const querySnapshot = await queryRef.limit(1).get();

    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return new ArtPublication({ ...doc.data(), _id: doc.id });
    } else {
      return null;
    }
  }

  static async findWithOrder(query = {}, orderByField, orderDirection = 'asc', limit, offset) {
    try {
      let queryRef = db.collection('ArtPublications');

      if (Object.keys(query).length > 0) {
        for (const [key, value] of Object.entries(query)) {
          if (Array.isArray(value)) {
            console.log(`Adding where clause for array: ${key} array-contains-any`, value);
            queryRef = queryRef.where(key, 'array-contains-any', value);
          } else {
            console.log(`Adding where clause: ${key} == ${value}`);
            queryRef = queryRef.where(key, '==', value);
          }
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
        const results = querySnapshot.docs.map(doc => new ArtPublication({ ...doc.data(), id: doc.id }));
        return results;
      } else {
        return [];
      }
    } catch (error) {
      console.error('Error finding art publications with order:', error);
      throw new Error('Error finding art publications with order');
    }
  }

  static async findWithArrayContainsAny(field, values, orderByField, orderDirection = 'asc', limit, offset) {
    try {
      let queryRef = db.collection('ArtPublications');

      console.log('Initial query:', { [field]: values });

      queryRef = queryRef.where(field, 'in', values);

      queryRef = queryRef.orderBy(orderByField, orderDirection);
      console.log(`Ordering by ${orderByField} ${orderDirection}`);

      if (offset) {
        queryRef = queryRef.offset(offset);
        console.log(`Offset: ${offset}`);
      }

      if (limit) {
        queryRef = queryRef.limit(limit);
        console.log(`Limit: ${limit}`);
      }

      const querySnapshot = await queryRef.get();

      if (!querySnapshot.empty) {
        const results = querySnapshot.docs.map(doc => new ArtPublication({ ...doc.data(), _id: doc.id }));
        console.log('Query results:', results);
        return results;
      } else {
        console.log('No documents found');
        return [];
      }
    } catch (error) {
      console.error('Error finding art publications with array-contains-any:', error);
      throw new Error('Error finding art publications with array-contains-any');
    }
  }

  static async deleteOne(query) {
    const artPublication = await this.findOne(query);
    if (artPublication) {
      await db.collection('ArtPublications').doc(artPublication._id).delete();
      return true;
    } else {
      return false;
    }
  }

  async update(data) {
    const artPublicationRef = db.collection('ArtPublications').doc(this._id);
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
