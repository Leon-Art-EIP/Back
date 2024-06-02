import admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/db.mjs';

class User {
  constructor(data) {
    this.id = data.id || uuidv4(); // Générer un UUID si l'ID n'est pas fourni
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
    await db.collection('Users').doc(this.id).set(this.toJSON());
    return this.id;
  }

  toJSON() {
    return {
      username: this.username,
      email: this.email,
      password: this.password,
      is_artist: this.is_artist,
      biography: this.biography,
      availability: this.availability,
      subscription: this.subscription,
      collections: this.collections,
      subscriptions: this.subscriptions,
      subscribers: this.subscribers,
      subscribersCount: this.subscribersCount,
      likedPublications: this.likedPublications,
      canPostArticles: this.canPostArticles,
      fcmToken: this.fcmToken,
      profilePicture: this.profilePicture,
      bannerPicture: this.bannerPicture,
      stripeAccountId: this.stripeAccountId
    };
  }

  static async findById(userId) {
    return await this.findUserById(userId);
  }

  static async findUserById(userId) {
    const doc = await db.collection('Users').doc(userId).get();
    if (doc.exists) {
      const user = new User(doc.data());
      user.id = doc.id;
      return user;
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
      const user = new User(doc.data());
      user.id = doc.id;
      return user;
    } else {
      return null;
    }
  }

  static async deleteOne(query) {
    const user = await this.findOne(query);
    if (user) {
      await db.collection('Users').doc(user.id).delete();
      return true;
    } else {
      return false;
    }
  }

  async update(data) {
    await db.collection('Users').doc(this.id).update(data);
    Object.assign(this, data);
    return true;
  }

  async delete() {
    await db.collection('Users').doc(this.id).delete();
    return true;
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

  static async create(data) {
    const user = new User(data);
    return await user.save();
  }

  static async findAll() {
    const users = await db.collection('Users').get();
    const usersList = [];
    users.forEach((doc) => {
      const user = new User(doc.data());
      user.id = doc.id;
      usersList.push(user);
    });
    return usersList;
  }

  static async find(query = {}) {
    if (!query || Object.keys(query).length === 0) {
      throw new Error("Query parameter is missing or invalid");
    }
    const users = await db.collection('Users').where(Object.keys(query)[0], '==', Object.values(query)[0]).get();
    const usersList = [];
    users.forEach((doc) => {
      const user = new User(doc.data());
      user.id = doc.id;
      usersList.push(user);
    });
    return usersList;
  }

  static async updateById(userId, updateData) {
    const userRef = db.collection('Users').doc(userId);
    await userRef.update({
      ...updateData,
      updatedAt: new Date() // Optionally add/update a timestamp field
    });
    return true;
  }

  static async findByIdAndUpdate(userId, updateData) {
    const userRef = db.collection('Users').doc(userId);
    const doc = await userRef.get();
    if (!doc.exists) {
      throw new Error('User not found');
    }
    await userRef.update({
      ...updateData,
      updatedAt: new Date() // Optionally add/update a timestamp field
    });
    const updatedDoc = await userRef.get();
    return new User({ ...updatedDoc.data(), id: updatedDoc.id });
  }
}

export { User };
