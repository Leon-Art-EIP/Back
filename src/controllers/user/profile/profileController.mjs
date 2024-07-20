import db from '../../../config/db.mjs';
import logger from '../../../admin/logger.mjs'; // Assurez-vous que le chemin est correct

export const getProfile = async (req, res) => {
  try {
    const userId = req.params.userId;
    logger.info(`Fetching profile for user ID: ${userId}`);
    const userDoc = await db.collection('Users').doc(userId).get();
    if (!userDoc.exists) {
      logger.warn(`User not found: ${userId}`);
      return res.status(404).json({ msg: "User not found" });
    }

    // Supprimer les champs que vous ne voulez pas inclure dans la réponse
    const { password, email, fcmToken, ...userData } = userDoc.data();
    const userProfile = { ...userData, _id: userDoc.id };

    res.json(userProfile);
    logger.info(`Profile fetched successfully for user ID: ${userId}`);
  } catch (err) /* istanbul ignore next */ {
    logger.error(`Error fetching profile for user ID: ${req.params.userId} - ${err.message}`);
    res.status(500).json({ msg: "Server Error" });
  }
};

export const updateBiography = async (req, res) => {
  try {
    const userId = req.user.id;
    const { biography } = req.body;
    logger.info(`Updating biography for user ID: ${userId}`);

    // Mettre à jour l'utilisateur et récupérer les données mises à jour
    await db.collection('Users').doc(userId).update({ biography });
    const updatedUserDoc = await db.collection('Users').doc(userId).get();

    const userWithoutSensitiveInfo = updatedUserDoc.data();
    delete userWithoutSensitiveInfo.password;
    delete userWithoutSensitiveInfo.email;

    res.json(userWithoutSensitiveInfo);
    logger.info(`Biography updated successfully for user ID: ${userId}`);
  } catch (err) {
    logger.error(`Error updating biography for user ID: ${userId} - ${err.message}`);
    res.status(500).json({ msg: "Server Error" });
  }
};

export const updateAvailability = async (req, res) => {
  try {
    const userId = req.user.id;
    const { availability } = req.body;
    logger.info(`Updating availability for user ID: ${userId}`);
    await db.collection('Users').doc(userId).update({ availability });
    const updatedUserDoc = await db.collection('Users').doc(userId).get();

    const userWithoutSensitiveInfo = updatedUserDoc.data();
    delete userWithoutSensitiveInfo.password;
    delete userWithoutSensitiveInfo.email;

    res.json(userWithoutSensitiveInfo);
    logger.info(`Availability updated successfully for user ID: ${userId}`);
  } catch (err) {
    logger.error(`Error updating availability for user ID: ${userId} - ${err.message}`);
    res.status(500).json({ msg: "Server Error" });
  }
};

export const updateProfilePicture = async (req, res) => {
  try {
    const userId = req.user.id;
    const profilePicture = req.file.path; // getting file path from multer
    logger.info(`Updating profile picture for user ID: ${userId}`);
    await db.collection('Users').doc(userId).update({ profilePicture });
    const updatedUserDoc = await db.collection('Users').doc(userId).get();

    const userWithoutSensitiveInfo = updatedUserDoc.data();
    delete userWithoutSensitiveInfo.password;
    delete userWithoutSensitiveInfo.email;

    res.json(userWithoutSensitiveInfo);
    logger.info(`Profile picture updated successfully for user ID: ${userId}`);
  } catch (err) {
    logger.error(`Error updating profile picture for user ID: ${userId} - ${err.message}`);
    res.status(500).json({ msg: "Server Error" });
  }
};

export const updateBannerPicture = async (req, res) => {
  try {
    const userId = req.user.id;
    const bannerPicture = req.file.path; // getting file path from multer
    logger.info(`Updating banner picture for user ID: ${userId}`);
    await db.collection('Users').doc(userId).update({ bannerPicture });
    const updatedUserDoc = await db.collection('Users').doc(userId).get();

    const userWithoutSensitiveInfo = updatedUserDoc.data();
    delete userWithoutSensitiveInfo.password;
    delete userWithoutSensitiveInfo.email;

    res.json(userWithoutSensitiveInfo);
    logger.info(`Banner picture updated successfully for user ID: ${userId}`);
  } catch (err) {
    logger.error(`Error updating banner picture for user ID: ${userId} - ${err.message}`);
    res.status(500).json({ msg: "Server Error" });
  }
};
