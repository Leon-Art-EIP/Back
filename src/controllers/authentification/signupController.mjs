import db from '../../config/db.mjs';
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import logger from '../../admin/logger.mjs';

export const signup = async (req, res) => {
  const { username, email, password, is_artist, fcmToken } = req.body;

  try {
    console.log("Checking if email already exists");
    const emailRef = db.collection('Users').where('email', '==', email).limit(1);
    const emailSnapshot = await emailRef.get();

    if (!emailSnapshot.empty) {
      logger.warn('Email already in use', { email });
      return res.status(409).json({ msg: "Email already in use" });
    }
    console.log("Email check passed");

    console.log("Checking if username already exists");
    const usernameRef = db.collection('Users').where('username', '==', username).limit(1);
    const usernameSnapshot = await usernameRef.get();

    if (!usernameSnapshot.empty) {
      logger.warn('Username already in use', { username });
      return res.status(409).json({ msg: "Username already in use" });
    }
    console.log("Username check passed");

    console.log("Hashing password");
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    console.log("Creating new user");
    const newUserRef = db.collection('Users').doc();
    const user = {
      id: newUserRef.id,
      username,
      email,
      password: hashedPassword,
      is_artist,
      fcmToken,
      availability: 'unavailable',
      subscription: 'standard',
      collections: [],
      subscriptions: [],
      subscribers: [],
      subscribersCount: 0,
      likedPublications: [],
      canPostArticles: true,
      profilePicture: 'uploads/static/default-profile-pic.png',
      bannerPicture: 'uploads/static/default-banner-pic.png',
      stripeAccountId: '',
    };

    console.log("Saving user to database");
    await newUserRef.set(user);

    console.log("Generating JWT token");
    const payload = {
      user: { id: newUserRef.id },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: Number(process.env.JWT_EXPIRATION) || 3600 },
      (err, token) => {
        if (err) {
          logger.error('Error generating token', { error: err.message, stack: err.stack});
          return res.status(500).json({ msg: "Error generating token" });
        }
        logger.info('User signed up successfully', { userId: newUserRef.id, username, email });
        res.json({
          token,
          user: {
            id: newUserRef.id,
            username: user.username,
            email: user.email,
            is_artist: user.is_artist,
            availability: user.availability,
            subscription: user.subscription,
            collections: user.collections
          },
        });
      }
    );
  } catch (err) {
    logger.error('Server Error', { error: err.message, stack: err.stack });
    res.status(500).json({ msg: "Server Error" });
  }
};
