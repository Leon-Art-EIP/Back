import { User } from "../../../models/UserModel.mjs";

export const getLatestArtists = async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;  // You can adjust the default limit as needed
  const skip = parseInt(req.query.skip) || 0;  // To handle pagination

  try {
    const artists = await User.find({ is_artist: true })
      .sort({ _id: -1 })  // Latest first based on ObjectId timestamp
      .skip(skip)
      .limit(limit)
      .select('-password');  // Exclude sensitive info

    return res.json({ artists });
  } catch (err) /* istanbul ignore next */ {
    console.error(err.message);
    return res.status(500).json({ msg: "Server Error" });
  }
};