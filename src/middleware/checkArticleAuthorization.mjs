import db from '../config/db.mjs'; // Assurez-vous que c'est le chemin correct pour votre instance Firestore
import { User } from '../models/userModel.mjs';

export const checkArticleAuthorization = async (req, res, next) => {
  try {
    const userRef = db.collection('Users').doc(req.user.id);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ msg: "User not found" });
    }

    const user = new User({ ...userDoc.data(), id: userDoc.id });

    if (!user.canPostArticles) {
      return res.status(403).json({ msg: "User not authorized to post articles" });
    }

    next();
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ msg: "Server Error" });
  }
};
