import db from '../config/db.mjs'; // Assurez-vous que c'est le chemin correct pour votre instance Firestore
import { User } from '../models/userModel.mjs';
import logger from '../config/logger.js'; // Assurez-vous que le chemin est correct pour votre logger

export const checkArticleAuthorization = async (req, res, next) => {
  try {
    const userRef = db.collection('Users').doc(req.user.id);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      logger.warn(`User not found: ${req.user.id}`);
      return res.status(404).json({ msg: "User not found" });
    }

    const user = new User({ ...userDoc.data(), id: userDoc.id });

    if (!user.canPostArticles) {
      logger.warn(`User not authorized to post articles: ${req.user.id}`);
      return res.status(403).json({ msg: "User not authorized to post articles" });
    }

    logger.info(`User authorized to post articles: ${req.user.id}`);
    next();
  } catch (err) {
    logger.error(`Server error: ${err.message}`);
    return res.status(500).json({ msg: "Server Error" });
  }
};
