import { User } from "../../models/userModel.mjs";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { isTokenValid } from "../../utils/tokenValidation.mjs";

export const signup = async (req, res) => {
  const { username, email, password, is_artist, fcmToken } = req.body;

  try {
    // Check if email already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(409).json({ msg: "Email already in use" });
    }

    // Check if username already exists
    user = await User.findOne({ username });
    if (user) {
      return res.status(409).json({ msg: "Username already in use" });
    }

    // Create new user
    user = new User({ username, email, password, is_artist, fcmToken }); 

    // Hash password and save user to database
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    
    await user.save();

    // Generate and return jwt token
    const payload = {
      user: { id: user.id },
    };
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: Number(process.env.JWT_EXPIRATION) || 3600 },
      (err, token) => {
        /* istanbul ignore next */
        if (err) {
          console.error(err.message);
          return res.status(500).json({ msg: "Error generating token" });
        }
        res.json({
          token,
          user: {
            id: user.id,
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
  } catch (err) /* istanbul ignore next */ {
    console.error(err.message);
    res.status(500).json({ msg: "Server Error" });
  }
};
