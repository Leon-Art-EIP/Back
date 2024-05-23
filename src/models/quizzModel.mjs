import db from '../config/db.mjs'; // Assurez-vous que c'est le chemin correct pour votre instance Firestore

class Quizz {
  constructor(data) {
    this.userId = data.userId; // Stocker l'identifiant de l'utilisateur
    this.objective = data.objective;
    this.artInterestType = data.artInterestType || [];
    this.artSellingType = data.artSellingType || [];
    this.location = data.location || "";
    this.customCommands = data.customCommands || "";
    this.budget = data.budget || "";
    this.discoveryMethod = data.discoveryMethod || "";
  }

  // Sauvegarder le quizz dans Firestore
  async save() {
    if (!this.userId) {
      throw new Error('userId is required');
    }
    try {
      const quizzRef = db.collection('Quizzes').doc();
      await quizzRef.set({
        userId: this.userId,
        objective: this.objective,
        artInterestType: this.artInterestType,
        artSellingType: this.artSellingType,
        location: this.location,
        customCommands: this.customCommands,
        budget: this.budget,
        discoveryMethod: this.discoveryMethod
      });
      this.id = quizzRef.id;
      return this;
    } catch (error) {
      console.error('Error saving quizz:', error);
      throw new Error('Error saving quizz');
    }
  }

  // Trouver un quizz par ID
  static async findById(quizzId) {
    try {
      const quizzRef = db.collection('Quizzes').doc(quizzId);
      const doc = await quizzRef.get();
      if (!doc.exists) {
        throw new Error('Quizz not found');
      }
      return new Quizz(doc.data());
    } catch (error) {
      console.error('Error finding quizz:', error);
      throw new Error('Error finding quizz');
    }
  }

  // Mettre à jour un quizz par ID
  static async updateById(quizzId, updateData) {
    try {
      const quizzRef = db.collection('Quizzes').doc(quizzId);
      await quizzRef.update(updateData);
      console.log('Quizz updated successfully');
    } catch (error) {
      console.error('Error updating quizz:', error);
      throw new Error('Error updating quizz');
    }
  }

  // Supprimer un quizz par ID
  static async deleteById(quizzId) {
    try {
      const quizzRef = db.collection('Quizzes').doc(quizzId);
      await quizzRef.delete();
      console.log('Quizz deleted successfully');
    } catch (error) {
      console.error('Error deleting quizz:', error);
      throw new Error('Error deleting quizz');
    }
  }

  // Mettre à jour le quizz actuel
  async update(updateData) {
    try {
      const quizzRef = db.collection('Quizzes').doc(this.id);
      await quizzRef.update(updateData);
      console.log('Quizz updated successfully');
    } catch (error) {
      console.error('Error updating quizz:', error);
      throw new Error('Error updating quizz');
    }
  }
}

export { Quizz };
