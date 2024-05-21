// Import Firestore from your configured instance or the Firebase Admin SDK
import db from '../config/db.mjs'; // Ensure this is set up correctly to access Firestore

class Article {
  constructor(data) {
    this.title = data.title; // Title of the article
    this.mainImage = data.mainImage; // URL to the main image of the article
    this.content = data.content; // HTML content of the article
    this.authorId = data.authorId; // ID of the author (user)
    this.createdAt = data.createdAt || new Date(); // Date and time the article was created
  }

  // Save the article to Firestore
  async save() {
    const articleRef = db.collection('Articles').doc(); // Creates a new document with a generated ID
    await articleRef.set({
      title: this.title,
      mainImage: this.mainImage,
      content: this.content,
      authorId: this.authorId,
      createdAt: this.createdAt
    });
    this.id = articleRef.id; // Store the Firestore document ID within the object
    return this;
  }

  // Static method to fetch an article by ID from Firestore
  static async findById(articleId) {
    const doc = await db.collection('Articles').doc(articleId).get();
    if (!doc.exists) {
      throw new Error('Article not found');
    }
    return new Article({ ...doc.data(), id: doc.id });
  }

  static async deleteOne(query) {
    const article = await this.findOne(query);
    if (article) {
      await db.collection('Articles').doc(article.id).delete();
      return true;
    } else {
      return false;
    }
  }

  static async update(data) {
    const article = await db.collection('Articles').doc(this.id).get();
    if (article.exists) {
      await db.collection('Articles').doc(this.id).update({ ...data });
      return true;
    } else {
      return false;
    }
  }

  static async delete() {
    const article = await db.collection('Articles').doc(this.id).get();
    if (article.exists) {
      await db.collection('Articles').doc(this.id).delete();
      return true;
    } else {
      return false;
    }
  }

  static async find(query) {
    const articles = await db.collection('Articles').where(Object.keys(query)[0], '==', Object.values(query)[0]).get();
    const results = [];
    articles.forEach((doc) => {
      results.push(new Article({ ...doc.data(), id: doc.id }));
    });
    return results;
  }

}

// Export the Article class so it can be used elsewhere in your application
export { Article };