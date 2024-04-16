import User from "../../models/userModel"; // Adjust the import according to your project structure; ensure it's a TypeScript file (.ts)
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { getRepository } from "fireorm";
import { Request, Response } from "express";

const userRepository = getRepository(User);



export const signup = async (req: Request, res: Response): Promise<Response> => {
  const { username, email, password, is_artist, fcmToken } = req.body;

  try {
    // Check if email already exists
    let users = await userRepository.whereEqualTo('email', email).find();
    if (users.length > 0) {
      return res.status(409).json({ msg: "Email already in use" });
    }

    // Check if username already exists
    users = await userRepository.whereEqualTo('username', username).find();
    if (users.length > 0) {
      return res.status(409).json({ msg: "Username already in use" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = await userRepository.create({
      username,
      email,
      password: hashedPassword,
      is_artist,
      fcmToken,
      biography: "",
      availability: "",
      subscription: "",
      collections: [],
      subscriptions: [],
      subscribers: [],
      subscribersCount: 0,
      likedPublications: [],
      canPostArticles: false,
      profilePicture: "",
      bannerPicture: "",
      stripeAccountId: ""
    });

    // Generate and return jwt token
    const payload = {
      user: { id: newUser.id },
    };

    return new Promise((resolve, reject) => {
      jwt.sign(
        payload,
        process.env.JWT_SECRET || "secret", // Provide a non-null value for the secretOrPrivateKey parameter
        { expiresIn: Number(process.env.JWT_EXPIRATION) || 3600 },
        (err, token) => {
          if (err) {
            console.error('Error signing token:', err);
            reject(res.status(500).json({ msg: "Error generating token" }));
          } else {
            resolve(res.json({
              token,
              user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                is_artist: newUser.is_artist,
                // Include other fields as necessary
              },
            }));
          }
        }
      );
    });
  } catch (err) {
    console.error('Server Error:', err);
    return res.status(500).json({ msg: "Server Error" });
  }
};