import { User } from "../../models/userModel.mjs";
import db from "../../config/db.mjs";
import logger from "../../config/logger.js";

export const checkUsernameAvailability = async (req, res) => {
  const username = req.params.username;

  try {
    if (!username || username.length < 3 || username.length > 20 || !/^\w+$/.test(username)) {
      logger.warn(`Invalid username format: ${username}`);
      return res.status(400).json({ msg: "Invalid username format" });
    }

    const querySnapshot = await db.collection('Users').where('username', '==', username).limit(1).get();
    if (!querySnapshot.empty) {
      logger.info(`Username already in use: ${username}`);
      return res.status(409).json({ msg: "Username is already in use" });
    }

    logger.info(`Username is available: ${username}`);
    return res.json({ msg: "Username is available" });
  } catch (err) {
    logger.error(`Error checking username availability: ${err.message}`, { error: err });
    return res.status(500).json({ msg: "Server Error" });
  }
};

export const checkEmailAvailability = async (req, res) => {
  const email = req.params.email;

  try {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email || !emailRegex.test(email)) {
      logger.warn(`Invalid email format: ${email}`);
      return res.status(400).json({ msg: "Invalid email format" });
    }

    const querySnapshot = await db.collection('Users').where('email', '==', email).limit(1).get();
    if (!querySnapshot.empty) {
      logger.info(`Email already in use: ${email}`);
      return res.status(409).json({ msg: "Email is already in use" });
    }

    logger.info(`Email is available: ${email}`);
    return res.json({ msg: "Email is available" });
  } catch (err) {
    logger.error(`Error checking email availability: ${err.message}`, { error: err });
    return res.status(500).json({ msg: "Server Error" });
  }
};
