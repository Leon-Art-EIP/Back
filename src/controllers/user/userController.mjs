import { User } from "../../models/userModel.mjs";
import db from "../../config/db.mjs";

export const checkUsernameAvailability = async (req, res) => {
  const username = req.params.username;

  try {
    if (!username || username.length < 3 || username.length > 20 || !/^\w+$/.test(username)) {
      return res.status(400).json({ msg: "Invalid username format" });
    }

    const querySnapshot = await db.collection('Users').where('username', '==', username).limit(1).get();
    if (!querySnapshot.empty) {
      return res.status(409).json({ msg: "Username is already in use" });
    }

    return res.json({ msg: "Username is available" });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ msg: "Server Error" });
  }
};

export const checkEmailAvailability = async (req, res) => {
  const email = req.params.email;

  try {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ msg: "Invalid email format" });
    }

    const querySnapshot = await db.collection('Users').where('email', '==', email).limit(1).get();
    if (!querySnapshot.empty) {
      return res.status(409).json({ msg: "Email is already in use" });
    }

    return res.json({ msg: "Email is available" });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ msg: "Server Error" });
  }
};
