import db from '../config/db.mjs';

class Article {
  constructor(data) {
    this._id = data._id; // Ajout du champ _id
    this.title = data.title;
    this.mainImage = data.mainImage;
    this.content = data.content;
    this.authorId = data.authorId;
    this.createdAt = data.createdAt || new Date().toISOString();
  }

  async save() {
    try {
      const articleRef = db.collection('Articles').doc();
      await articleRef.set({
        title: this.title,
        mainImage: this.mainImage,
        content: this.content,
        authorId: this.authorId,
        createdAt: this.createdAt
      });
      this._id = articleRef.id; // Stocke l'ID du document Firestore dans le champ _id
      return this;
    } catch (error) {
      console.error('Error saving article:', error);
      throw new Error('Error saving article');
    }
  }

  static async findById(articleId) {
    try {
      const doc = await db.collection('Articles').doc(articleId).get();
      if (!doc.exists) {
        throw new Error('Article not found');
      }
      return new Article({ ...doc.data(), _id: doc.id }); // Inclure l'ID du document dans la réponse
    } catch (error) {
      console.error('Error finding article by ID:', error);
      throw new Error('Error finding article');
    }
  }

  async update(updateData) {
    try {
      const articleRef = db.collection('Articles').doc(this._id);
      await articleRef.update({
        ...updateData,
        updatedAt: new Date().toISOString() // Optionally add/update a timestamp field
      });
      Object.assign(this, updateData);
      return this;
    } catch (error) {
      console.error('Error updating article:', error);
      throw new Error('Error updating article');
    }
  }

  async delete() {
    try {
      const articleRef = db.collection('Articles').doc(this._id);
      await articleRef.delete();
      return true;
    } catch (error) {
      console.error('Error deleting article:', error);
      throw new Error('Error deleting article');
    }
  }

  static async deleteById(articleId) {
    try {
      const articleRef = db.collection('Articles').doc(articleId);
      await articleRef.delete();
      return true;
    } catch (error) {
      console.error('Error deleting article:', error);
      throw new Error('Error deleting article');
    }
  }

  static async deleteOne(query) {
    try {
      const articles = await this.find(query);
      if (articles.length > 0) {
        await db.collection('Articles').doc(articles[0]._id).delete();
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Error deleting article:', error);
      throw new Error('Error deleting article');
    }
  }

  static async find(query = {}) {
    try {
      if (!query || Object.keys(query).length === 0) {
        throw new Error("Query parameter is missing or invalid");
      }
      const querySnapshot = await db.collection('Articles')
        .where(Object.keys(query)[0], '==', Object.values(query)[0])
        .get();

      if (!querySnapshot.empty) {
        return querySnapshot.docs.map(doc => new Article({ ...doc.data(), _id: doc.id }));
      } else {
        return [];
      }
    } catch (error) {
      console.error('Error finding articles by query:', error);
      throw new Error('Error finding articles');
    }
  }

  static async findWithOrder(query = {}, orderByField, orderDirection = 'asc') {
    try {
      let queryRef = db.collection('Articles');

      if (Object.keys(query).length > 0) {
        queryRef = queryRef.where(Object.keys(query)[0], '==', Object.values(query)[0]);
      }

      queryRef = queryRef.orderBy(orderByField, orderDirection);

      const querySnapshot = await queryRef.get();

      if (!querySnapshot.empty) {
        return querySnapshot.docs.map(doc => new Article({ ...doc.data(), _id: doc.id }));
      } else {
        return [];
      }
    } catch (error) {
      console.error('Error finding articles by query:', error);
      throw new Error('Error finding articles');
    }
  }
}

export { Article };
