import { ArtPublication } from "../../models/artPublicationModel.mjs";
import { Notification } from "../../models/notificationModel.mjs";
import { User } from "../../models/userModel.mjs";
import { createAndSendNotification } from "../notification/notificationController.mjs";

export const likeArtPublication = async (req, res) => {
  try {
    const userId = req.user.id;
    const artPublicationId = req.params.id;

    const artPublication = await ArtPublication.findById(artPublicationId);
    const user = await User.findById(userId);

    if (!artPublication)
      return res.status(404).json({ msg: "Art publication not found" });

    if (artPublication.likes.includes(userId)) {
      // Remove like from ArtPublication
      artPublication.likes.pull(userId);
      // Remove liked publication from User
      user.likedPublications.pull(artPublicationId);
    } else {
      // Add like to ArtPublication
      artPublication.likes.push(userId);
      // Add liked publication to User
      user.likedPublications.push(artPublicationId);
      createAndSendNotification({
        recipientId: artPublication.userId,
        type: 'like',
        content: `${user.username}`,
        description: `someone liked your publication.`,
        referenceId: artPublicationId,
        sendPush: true,
      });
    }

    await artPublication.save();
    await user.save();

    res.json({
      msg: "Like status updated",
      likeStatus: {
        artPublicationId,
        isLiked: artPublication.likes.includes(userId),
        totalLikes: artPublication.likes.length, // Here's the count of likes
      },
    });
  } catch (err) /* istanbul ignore next */ {
    console.error(err.message);
    res.status(500).json({ msg: "Server Error" });
  }
};

export const getPublicationLikeCount = async (req, res) => {
  try {
    const artPublication = await ArtPublication.findById(req.params.id);
    if (!artPublication)
      return res.status(404).json({ msg: "Art publication not found" });

    res.json({
      artPublicationId: artPublication._id,
      totalLikes: artPublication.likes.length,
    });
  } catch (err) /* istanbul ignore next */ {
    console.error(err.message);
    res.status(500).json({ msg: "Server Error" });
  }
};

export const getUsersWhoLikedPublication = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || process.env.DEFAULT_PAGE_LIMIT;
    const page = Number(req.query.page) || 1;

    const artPublication = await ArtPublication.findById(
      req.params.id
    ).populate({
      path: "likes",
      model: "User",
      select: "username",
      options: {
        limit: limit,
        skip: (page - 1) * limit,
      },
    });

    if (!artPublication)
      return res.status(404).json({ msg: "Art publication not found" });

    res.json({
      artPublicationId: artPublication._id,
      users: artPublication.likes,
    });
  } catch (err) /* istanbul ignore next */ {
    console.error(err.message);
    res.status(500).json({ msg: "Server Error" });
  }
};
