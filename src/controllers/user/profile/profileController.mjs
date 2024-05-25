import { User } from "../../../models/userModel.mjs";

export const getProfile = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Supprimer les champs que vous ne voulez pas inclure dans la réponse
    const { password, email, fcmToken, ...userProfile } = user;

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
    const updatedUser = await User.findByIdAndUpdate(userId, { biography });

    // Manuellement exclure les champs sensibles
    const userWithoutSensitiveInfo = updatedUser.toJSON();
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
    const updatedUser = await User.findByIdAndUpdate(userId, { availability }, { new: true });

    // Manuellement exclure les champs sensibles
    const userWithoutSensitiveInfo = updatedUser.toJSON();
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
    const updatedUser = await User.findByIdAndUpdate(userId, { profilePicture }, { new: true });

    // Manuellement exclure les champs sensibles
    const userWithoutSensitiveInfo = updatedUser.toJSON();
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
    const updatedUser = await User.findByIdAndUpdate(userId, { bannerPicture }, { new: true });

    // Manuellement exclure les champs sensibles
    const userWithoutSensitiveInfo = updatedUser.toJSON();
    delete userWithoutSensitiveInfo.password;
    delete userWithoutSensitiveInfo.email;

    res.json(userWithoutSensitiveInfo);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server Error" });
  }
};