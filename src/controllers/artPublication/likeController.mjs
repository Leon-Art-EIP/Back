import { ArtPublication } from "../../models/artPublicationModel.mjs";
import { Notification } from "../../models/notificationModel.mjs";
import { User } from "../../models/userModel.mjs";

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
    }

    // Send notification if the publication is liked
    if (!artPublication.likes.includes(userId)) {
      const recipient = await User.findById(artPublication.userId);
      const notification = new Notification({
        recipient: recipient._id,
        content: `${user.username} liked your publication`,
        type: "like",
      });
      await notification.save();

      // Send push notification if recipient has FCM token
      if (recipient.fcmToken) /* istanbul ignore next */ {
        sendFCMMessage(
          recipient.fcmToken,
          "New Like",
          `${user.username} liked your publication`
        );
      }
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
