import db from '../config/db.mjs'; // Assurez-vous que c'est le chemin correct pour l'instance Firestore

class ResetToken {
  constructor(data) {
    this.email = data.email;
    this.token = data.token;
    this.expire_at = data.expire_at || new Date();
  }

  // Sauvegarder le token dans Firestore
  async save() {
    const resetTokenRef = db.collection('ResetTokens').doc(this.email); // Utiliser l'email comme ID pour l'unicité
    await resetTokenRef.set({
      email: this.email,
      token: this.token,
      expire_at: this.expire_at
    });
  }

  // Trouver un token par email
  static async findByEmail(email) {
    const resetTokenRef = db.collection('ResetTokens').doc(email);
    const doc = await resetTokenRef.get();
    if (!doc.exists) {
      return null;
    }
    return new ResetToken(doc.data());
  }
}

export { ResetToken };
