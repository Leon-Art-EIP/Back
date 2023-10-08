export const checkArticleAuthorization = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user.canPostArticles) {
      return res
        .status(403)
        .json({ msg: "User not authorized to post articles" });
    }
    next();
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ msg: "Server Error" });
  }
};
