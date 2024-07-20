import db from '../../config/db.mjs';
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import logger from '../../admin/logger.mjs'; // Assurez-vous que le chemin est correct

export const login = async (req, res) => {
  const { email, password, fcmToken } = req.body;

  try {
    // Check if user exists
    const userRef = db.collection('Users').where('email', '==', email).limit(1);
    const userSnapshot = await userRef.get();

    if (userSnapshot.empty) {
      logger.warn("Email not registered", { email });
      return res.status(401).json({ msg: "Email not registered" });
    }

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();

    // Compare password
    const isMatch = await bcrypt.compare(password, userData.password);
    if (!isMatch) {
      logger.warn("Incorrect password", { email });
      return res.status(401).json({ msg: "Incorrect password" });
    }

    if (fcmToken) {
      await userDoc.ref.update({ fcmToken });
    }

    // Generate and return jwt token
    const payload = {
      user: { id: userDoc.id },
    };
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: Number(process.env.JWT_EXPIRATION) || 3600 },
      (err, token) => {
        if (err) {
          logger.error("Error generating token", { error: err.message, stack: err.stack});
          return res.status(500).json({ msg: "Error generating token" });
        }
        res.json({
          token,
          user: {
            id: userDoc.id,
            username: userData.username,
            email: userData.email,
            is_artist: userData.is_artist,
            availability: userData.availability,
            subscription: userData.subscription,
            collections: userData.collections,
          },
        });
        logger.info("User logged in successfully", { userId: userDoc.id });
      }
    );
  } catch (err) {
    logger.error("Server Error", { error: err.message, stack: err.stack});
    res.status(500).json({ msg: "Server Error" });
  }
};
