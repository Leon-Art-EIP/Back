import { ArtPublication } from "../../models/artPublicationModel.mjs";
import { Notification } from "../../models/notificationModel.mjs";
import { User } from "../../models/userModel.mjs";
import { createAndSendNotification } from "../notification/notificationController.mjs";
import { FieldValue } from 'firebase-admin/firestore';
import db from '../../config/db.mjs';

export const likeArtPublication = async (req, res) => {
  try {
    const userId = req.user.id;
    const artPublicationId = req.params.id;

    const artPublication = await ArtPublication.findById(artPublicationId);
    const user = await User.findById(userId);

    if (!artPublication) {
      return res.status(404).json({ msg: "Art publication not found" });
    }

    const isLiked = artPublication.likes.includes(userId);

    if (isLiked) {
      // Remove like from ArtPublication and User
      await db.collection('ArtPublications').doc(artPublicationId).update({
        likes: FieldValue.arrayRemove(userId)
      });
      await db.collection('Users').doc(userId).update({
        likedPublications: FieldValue.arrayRemove(artPublicationId)
      });
    } else {
      // Add like to ArtPublication and User
      await db.collection('ArtPublications').doc(artPublicationId).update({
        likes: FieldValue.arrayUnion(userId)
      });
      await db.collection('Users').doc(userId).update({
        likedPublications: FieldValue.arrayUnion(artPublicationId)
      });
      createAndSendNotification({
        recipientId: artPublication.userId,
        type: 'like',
        content: `${user.username}`,
        description: `someone liked your publication.`,
        referenceId: artPublicationId,
        sendPush: true,
      });
    }

    res.json({
      msg: "Like status updated",
      likeStatus: {
        artPublicationId,
        isLiked: !isLiked,
        totalLikes: isLiked ? artPublication.likes.length - 1 : artPublication.likes.length + 1,
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
    if (!artPublication) {
      return res.status(404).json({ msg: "Art publication not found" });
    }

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
    const limit = Number(req.query.limit) || parseInt(process.env.DEFAULT_PAGE_LIMIT, 10);
    const page = Number(req.query.page) || 1;

    const artPublication = await ArtPublication.findById(req.params.id);

    if (!artPublication) {
      return res.status(404).json({ msg: "Art publication not found" });
    }

    const likedUsers = await User.find({ _id: { $in: artPublication.likes } })
      .select("username")
      .limit(limit)
      .skip((page - 1) * limit);

    res.json({
      artPublicationId: artPublication._id,
      users: likedUsers,
    });
  } catch (err) /* istanbul ignore next */ {
    console.error(err.message);
    res.status(500).json({ msg: "Server Error" });
  }
};
