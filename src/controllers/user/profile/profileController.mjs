import db from '../../../config/db.mjs';

export const getProfile = async (req, res) => {
  try {
    const userId = req.params.userId;
    const userDoc = await db.collection('Users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Supprimer les champs que vous ne voulez pas inclure dans la réponse
    const { password, email, fcmToken, ...userData } = userDoc.data();
    const userProfile = { ...userData, _id: userDoc.id };

    res.json(userProfile);
  } catch (err) /* istanbul ignore next */ {
    console.error(err.message);
    res.status(500).json({ msg: "Server Error" });
  }
};

export const updateBiography = async (req, res) => {
  try {
    const userId = req.user.id;
    const { biography } = req.body;

    // Mettre à jour l'utilisateur et récupérer les données mises à jour
    await db.collection('Users').doc(userId).update({ biography });
    const updatedUserDoc = await db.collection('Users').doc(userId).get();

    const userWithoutSensitiveInfo = updatedUserDoc.data();
    delete userWithoutSensitiveInfo.password;
    delete userWithoutSensitiveInfo.email;

    res.json(userWithoutSensitiveInfo);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server Error" });
  }
};

export const updateAvailability = async (req, res) => {
  try {
    const userId = req.user.id;
    const { availability } = req.body;
    await db.collection('Users').doc(userId).update({ availability });
    const updatedUserDoc = await db.collection('Users').doc(userId).get();

    const userWithoutSensitiveInfo = updatedUserDoc.data();
    delete userWithoutSensitiveInfo.password;
    delete userWithoutSensitiveInfo.email;

    res.json(userWithoutSensitiveInfo);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server Error" });
  }
};

export const updateProfilePicture = async (req, res) => {
  try {
    const userId = req.user.id;
    const profilePicture = req.file.path; // getting file path from multer
    await db.collection('Users').doc(userId).update({ profilePicture });
    const updatedUserDoc = await db.collection('Users').doc(userId).get();

    const userWithoutSensitiveInfo = updatedUserDoc.data();
    delete userWithoutSensitiveInfo.password;
    delete userWithoutSensitiveInfo.email;

    res.json(userWithoutSensitiveInfo);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server Error" });
  }
};

export const updateBannerPicture = async (req, res) => {
  try {
    const userId = req.user.id;
    const bannerPicture = req.file.path; // getting file path from multer
    await db.collection('Users').doc(userId).update({ bannerPicture });
    const updatedUserDoc = await db.collection('Users').doc(userId).get();

    const userWithoutSensitiveInfo = updatedUserDoc.data();
    delete userWithoutSensitiveInfo.password;
    delete userWithoutSensitiveInfo.email;

    res.json(userWithoutSensitiveInfo);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server Error" });
  }
};
