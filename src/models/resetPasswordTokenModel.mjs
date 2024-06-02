import db from '../config/db.mjs'; // Assurez-vous que c'est le chemin correct pour l'instance Firestore

class ResetToken {
  constructor(data) {
    this.email = data.email;
    this.token = data.token;
    this.expire_at = data.expire_at || new Date();
  }

  // Sauvegarder le token dans Firestore
  async save() {
    try {
      const resetTokenRef = db.collection('ResetTokens').doc(this.email); // Utiliser l'email comme ID pour l'unicité
      await resetTokenRef.set({
        email: this.email,
        token: this.token,
        expire_at: this.expire_at
      });
      console.log('Token saved successfully');
    } catch (error) {
      console.error('Error saving token:', error);
      throw new Error('Error saving token');
    }
  }

  // Trouver un token par email
  static async findByEmail(email) {
    try {
      const resetTokenRef = db.collection('ResetTokens').doc(email);
      const doc = await resetTokenRef.get();
      if (!doc.exists) {
        return null;
      }
      return new ResetToken(doc.data());
    } catch (error) {
      console.error('Error finding token by email:', error);
      throw new Error('Error finding token');
    }
  }

  // Mettre à jour un token par email
  static async updateByEmail(email, updateData) {
    try {
      const resetTokenRef = db.collection('ResetTokens').doc(email);
      await resetTokenRef.update(updateData);
      console.log('Token updated successfully');
    } catch (error) {
      console.error('Error updating token:', error);
      throw new Error('Error updating token');
    }
  }

  // Supprimer un token par email
  static async deleteByEmail(email) {
    try {
      const resetTokenRef = db.collection('ResetTokens').doc(email);
      await resetTokenRef.delete();
      console.log('Token deleted successfully');
    } catch (error) {
      console.error('Error deleting token:', error);
      throw new Error('Error deleting token');
    }
  }

  // Mettre à jour le token actuel
  async update(updateData) {
    try {
      const resetTokenRef = db.collection('ResetTokens').doc(this.email);
      await resetTokenRef.update(updateData);
      console.log('Token updated successfully');
    } catch (error) {
      console.error('Error updating token:', error);
      throw new Error('Error updating token');
    }
  }
}

export { ResetToken };
