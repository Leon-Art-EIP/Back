import admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/db.mjs';

// Définition d'un modèle utilisateur simplifié
class User {
  constructor(data) {
    this.username = data.username;
    this.email = data.email;
    this.password = data.password; // Assurez-vous de stocker des mots de passe hashés
    this.is_artist = data.is_artist || false;
    this.biography = data.biography || '';
    this.availability = data.availability || 'unavailable';
    this.subscription = data.subscription || 'standard';
    this.collections = data.collections || [];
    this.subscriptions = data.subscriptions || [];
    this.subscribers = data.subscribers || [];
    this.subscribersCount = data.subscribersCount || 0;
    this.likedPublications = data.likedPublications || [];
    this.canPostArticles = data.canPostArticles || true;
    this.fcmToken = data.fcmToken || '';
    this.profilePicture = data.profilePicture || 'uploads/static/default-profile-pic.png';
    this.bannerPicture = data.bannerPicture || 'uploads/static/default-banner-pic.png';
    this.stripeAccountId = data.stripeAccountId || '';
  }

  async save() {
    const id = uuidv4(); // Générer un UUID pour chaque nouvel utilisateur
    await db.collection('Users').doc(id).set({ ...this });
    return id;
  }

  static async findUserById(userId) {
    const doc = await db.collection('Users').doc(userId).get();
    if (doc.exists) {
      return new User(doc.data());
    } else {
      return null;
    }
  }

  static async findOne(query) {
    const querySnapshot = await db.collection('Users')
      .where(Object.keys(query)[0], '==', Object.values(query)[0])
      .limit(1)
      .get();

    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return new User(doc.data());
    } else {
      return null;
    }
  }

  static async DeleteOne(query) {
    const user = await this.findOne(query);
    if (user) {
      await db.collection('Users').doc(user.id).delete();
      return true;
    } else {
      return false;
    }
  }

  async update(data) {
    const user = await db.collection('Users').doc(this.id).get();
    if (user.exists) {
      await db.collection('Users').doc(this.id).update({ ...data });
      return true;
    } else {
      return false;
    }
  }

  async delete() {
    const user = await db.collection('Users').doc(this.id).get();
    if (user.exists) {
      await db.collection('Users').doc(this.id).delete();
      return true;
    } else {
      return false;
    }
  }

  static async deleteMany(query) {
    const users = await db.collection('Users').where(Object.keys(query)[0], '==', Object.values(query)[0]).get();
    if (!users.empty) {
      users.forEach(async (doc) => {
        await db.collection('Users').doc(doc.id).delete();
      });
      return true;
    } else {
      return false;
    }
  }

  static async create(query) {
    const user = new User(query);
    return await user.save();
  }
}

export { User };