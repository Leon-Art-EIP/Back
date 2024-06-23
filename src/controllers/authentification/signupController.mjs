import db from '../../config/db.mjs';
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const signup = async (req, res) => {
  const { username, email, password, is_artist, fcmToken } = req.body;

  try {
    // Check if email already exists
    const emailRef = db.collection('Users').where('email', '==', email).limit(1);
    const emailSnapshot = await emailRef.get();

    if (!emailSnapshot.empty) {
      return res.status(409).json({ msg: "Email already in use" });
    }

    // Check if username already exists
    const usernameRef = db.collection('Users').where('username', '==', username).limit(1);
    const usernameSnapshot = await usernameRef.get();

    if (!usernameSnapshot.empty) {
      return res.status(409).json({ msg: "Username already in use" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
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

    await newUserRef.set(user);

    // Generate and return jwt token
    const payload = {
      user: { id: newUserRef.id },
    };
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: Number(process.env.JWT_EXPIRATION) || 3600 },
      (err, token) => {
        if (err) {
          console.error(err.message);
          return res.status(500).json({ msg: "Error generating token" });
        }
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
    console.error(err.message);
    res.status(500).json({ msg: "Server Error" });
  }
};
