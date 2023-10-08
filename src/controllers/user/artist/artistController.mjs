import { User } from "../../../models/UserModel.mjs";

export const getLatestArtists = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || process.env.DEFAULT_PAGE_LIMIT;
    const page = Number(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const artists = await User.find({ is_artist: true })
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limit)
      .select('-password'); // Exclude sensitive info

    return res.json({ artists });
  } catch (err) /* istanbul ignore next */ {
    console.error(err.message);
    return res.status(500).json({ msg: "Server Error" });
  }
};
