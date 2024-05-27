import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import db from '../config/db.mjs'; // Assurez-vous que c'est le chemin correct pour accéder à Firestore
import { v4 as uuid } from 'uuid'; // Importez la fonction uuid pour générer des identifiants uniques

const firestore = getFirestore();

class Collection {
  constructor(data) {
    this._id = data.id || uuid(); // Firestore document ID  
    this.name = data.name; // Name of the collection
    this.artPublications = data.artPublications || []; // Array of ArtPublication document IDs
    this.isPublic = data.isPublic !== undefined ? data.isPublic : true; // Whether the collection is public
    this.userId = data.userId; // ID of the user who owns the collection
  }

  // Save the collection to Firestore
  async save() {
    try {
      const collectionRef = firestore.collection('Collections').doc(); // Creates a new document with a generated ID
      await collectionRef.set({
        name: this.name,
        artPublications: this.artPublications,
        isPublic: this.isPublic,
        userId: this.userId
      });
      this._id = collectionRef.id; // Store the Firestore document ID within the object
      return this;
    } catch (error) {
      console.error('Error saving collection:', error);
      throw new Error('Error saving collection');
    }
  }

  // Static method to fetch a collection by ID from Firestore
  static async findById(collectionId) {
    try {
      const doc = await firestore.collection('Collections').doc(collectionId).get();
      if (!doc.exists) {
        throw new Error('Collection not found');
      }
      return new Collection({ ...doc.data(), _id: doc.id });
    } catch (error) {
      console.error('Error finding collection by ID:', error);
      throw new Error('Error finding collection');
    }
  }

  // Static method to update a collection by ID
  static async updateById(collectionId, updateData) {
    try {
      const collectionRef = firestore.collection('Collections').doc(collectionId);
      await collectionRef.update({
        ...updateData,
        updatedAt: new Date() // Optionally add/update a timestamp field
      });
      console.log('Collection updated successfully');
    } catch (error) {
      console.error('Error updating collection:', error);
      throw new Error('Error updating collection');
    }
  }

  // Update the current collection instance
  async update(updateData) {
    try {
      const collectionRef = firestore.collection('Collections').doc(this._id);
      await collectionRef.update({
        ...updateData,
        updatedAt: new Date() // Optionally add/update a timestamp field
      });
      Object.assign(this, updateData); // Update the local instance with new data
      console.log('Collection updated successfully');
      return this;
    } catch (error) {
      console.error('Error updating collection:', error);
      throw new Error('Error updating collection');
    }
  }

  // Static method to delete a collection by ID
  static async deleteById(collectionId) {
    try {
      const collectionRef = firestore.collection('Collections').doc(collectionId);
      await collectionRef.delete();
      console.log('Collection deleted successfully');
    } catch (error) {
      console.error('Error deleting collection:', error);
      throw new Error('Error deleting collection');
    }
  }

  // Add an art publication to the collection
  async addArtPublication(artPublicationId) {
    try {
      if (!this.artPublications.includes(artPublicationId)) {
        this.artPublications.push(artPublicationId);
        await this.update({ artPublications: this.artPublications });
      }
      console.log('Art publication added successfully');
      return this;
    } catch (error) {
      console.error('Error adding art publication:', error);
      throw new Error('Error adding art publication');
    }
  }

  // Remove an art publication from the collection
  async removeArtPublication(artPublicationId) {
    try {
      const index = this.artPublications.indexOf(artPublicationId);
      if (index > -1) {
        this.artPublications.splice(index, 1);
        await this.update({ artPublications: this.artPublications });
      }
      console.log('Art publication removed successfully');
      return this;
    } catch (error) {
      console.error('Error removing art publication:', error);
      throw new Error('Error removing art publication');
    }
  }

  static async find(query) {
    try {
      let collectionsRef = firestore.collection('Collections');
      if (query) {
        if (query.userId) {
          collectionsRef = collectionsRef.where('userId', '==', query.userId);
        }
        if (query.isPublic !== undefined) {
          collectionsRef = collectionsRef.where('isPublic', '==', query.isPublic);
        }
      }
      const snapshot = await collectionsRef.get();
      const collections = [];
      snapshot.forEach(doc => {
        collections.push(new Collection({ ...doc.data(), _id: doc.id }));
      });
      return collections;
    } catch (error) {
      console.error('Error finding collections:', error);
      throw new Error('Error finding collections');
    }
  }

  static async findOneAndUpdate(query, updateData, options = {}) {
    try {
      let collectionsRef = firestore.collection('Collections');

      // Ajouter des conditions de requête pour la recherche de collection
      if (query.userId) {
        collectionsRef = collectionsRef.where('userId', '==', query.userId);
      }
      if (query.name) {
        collectionsRef = collectionsRef.where('name', '==', query.name);
      }

      const snapshot = await collectionsRef.limit(1).get();

      if (snapshot.empty) {
        if (options.upsert) {
          // Créer une nouvelle collection si elle n'existe pas et si upsert est vrai
          const newCollection = new Collection({ ...query, ...updateData });
          await newCollection.save();
          return newCollection;
        } else {
          throw new Error('Collection not found');
        }
      }

      const doc = snapshot.docs[0];
      await doc.ref.update({
        ...updateData,
        updatedAt: new Date() // Optionally add/update a timestamp field
      });

      return new Collection({ ...doc.data(), _id: doc.id });
    } catch (error) {
      console.error('Error finding and updating collection:', error);
      throw new Error('Error finding and updating collection');
    }
  }
}

// Export the Collection class so it can be used elsewhere in your application
export default Collection;
