import db from '../../config/db.mjs';
import bcrypt from "bcrypt";
import logger from '../../admin/logger.mjs'; // Assurez-vous que le chemin est correct

export const changePassword = async (req, res) => {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;

  try {
    const userRef = db.collection('Users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      logger.warn("User not found", { userId });
      return res.status(404).json({ msg: "User not found" });
    }

    const userData = userDoc.data();
    const isMatch = await bcrypt.compare(currentPassword, userData.password);

    if (!isMatch) {
      logger.warn("Incorrect current password", { userId });
      return res.status(400).json({ msg: "Incorrect current password" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await userRef.update({ password: hashedPassword });

    logger.info("Password changed successfully", { userId });
    res.json({ msg: "Password changed successfully" });
  } catch (err) /* istanbul ignore next */ {
    logger.error('Server Error', { error: err.message, stack: err.stack});
    res.status(500).json({ msg: "Server Error" });
  }
};
