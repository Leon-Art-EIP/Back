import db from '../../config/db.mjs';
import bcrypt from "bcrypt";

export const changePassword = async (req, res) => {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;

  try {
    const userRef = db.collection('Users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ msg: "User not found" });
    }

    const userData = userDoc.data();
    const isMatch = await bcrypt.compare(currentPassword, userData.password);

    if (!isMatch) {
      return res.status(400).json({ msg: "Incorrect current password" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await userRef.update({ password: hashedPassword });

    res.json({ msg: "Password changed successfully" });
  } catch (err) /* istanbul ignore next */ {
    console.error(err.message);
    res.status(500).json({ msg: "Server Error" });
  }
};
