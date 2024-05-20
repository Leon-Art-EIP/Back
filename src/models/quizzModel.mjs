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
    const quizzRef = db.collection('Quizzes').doc(); // Génère un nouveau document avec un ID unique
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
    return quizzRef.id; // Retourner l'ID du nouveau quizz
  }

  // Trouver un quizz par ID
  static async findById(quizzId) {
    const quizzRef = db.collection('Quizzes').doc(quizzId);
    const doc = await quizzRef.get();
    if (!doc.exists) {
      throw new Error('Quizz not found');
    }
    return new Quizz(doc.data());
  }
}

export { Quizz };
