import { User } from "../../../models/userModel.mjs";

export const getProfile = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId).select("-password -email -fcmToken");
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    res.json(user);
  } catch (err) /* istanbul ignore next */ {
    console.error(err.message);
    res.status(500).json({ msg: "Server Error" });
  }
};

export const updateBiography = async (req, res) => {
  try {
    const userId = req.user.id;
    const { biography } = req.body;
    const user = await User.findByIdAndUpdate(userId, { biography }, { new: true }).select("-password -email");
    res.json(user);
  } catch (err) /* istanbul ignore next */ {
    console.error(err.message);
    res.status(500).json({ msg: "Server Error" });
  }
};

export const updateAvailability = async (req, res) => {
  try {
    const userId = req.user.id;
    const { availability } = req.body;
    const user = await User.findByIdAndUpdate(userId, { availability }, { new: true }).select("-password -email");
    res.json(user);
  } catch (err) /* istanbul ignore next */ {
    console.error(err.message);
    res.status(500).json({ msg: "Server Error" });
  }
};

export const updateProfilePicture = async (req, res) => {
  try {
    const userId = req.user.id;
    const profilePicture = req.file.path; // getting file path from multer
    const user = await User.findByIdAndUpdate(userId, { profilePicture }, { new: true }).select("-password -email");
    res.json(user);
  } catch (err) /* istanbul ignore next */ {
    console.error(err.message);
    res.status(500).json({ msg: "Server Error" });
  }
};

export const updateBannerPicture = async (req, res) => {
  try {
    const userId = req.user.id;
    const bannerPicture = req.file.path; // getting file path from multer
    const user = await User.findByIdAndUpdate(userId, { bannerPicture }, { new: true }).select("-password -email");
    res.json(user);
  } catch (err) /* istanbul ignore next */ {
    console.error(err.message);
    res.status(500).json({ msg: "Server Error" });
  }
};