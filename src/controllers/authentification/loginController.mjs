import { User } from "../../models/userModel.mjs";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const login = async (req, res) => {
  const { email, password, fcmToken } = req.body;

  try {
    // Check if user exists
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ msg: "Email not registered" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ msg: "Incorrect password" });
    }

    if (fcmToken) /* istanbul ignore next */ {
      user.fcmToken = fcmToken;
      await user.save();
    }

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
            collections: user.collections,
          },
        });
      }
    );
  } catch (err) /* istanbul ignore next */ {
    console.error(err.message);
    res.status(500).json({ msg: "Server Error" });
  }
};
