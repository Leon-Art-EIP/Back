import { FieldValue } from 'firebase-admin/firestore';
import db from '../../config/db.mjs';
import { createAndSendNotification } from '../notification/notificationController.mjs';
import logger from '../../admin/logger.mjs'; // Assurez-vous que le chemin est correct

export const likeArtPublication = async (req, res) => {
  try {
    const userId = req.user.id;
    const artPublicationId = req.params.id;

    const artPublicationRef = db.collection('ArtPublications').doc(artPublicationId);
    const artPublicationDoc = await artPublicationRef.get();
    if (!artPublicationDoc.exists) {
      logger.warn("Art publication not found", { artPublicationId });
      return res.status(404).json({ msg: "Art publication not found" });
    }

    const artPublication = artPublicationDoc.data();
    if (!artPublication.likes) {
      artPublication.likes = []; // Initialize likes as an empty array if it doesn't exist
    }
    const isLiked = artPublication.likes.includes(userId);

    if (isLiked) {
      await artPublicationRef.update({
        likes: FieldValue.arrayRemove(userId)
      });
    } else {
      await artPublicationRef.update({
        likes: FieldValue.arrayUnion(userId)
      });

      const userDoc = await db.collection('Users').doc(userId).get();
      createAndSendNotification({
        recipientId: artPublication.userId,
        type: 'like',
        content: `${userDoc.data().username}`,
        description: `someone liked your publication.`,
        referenceId: artPublicationId,
        sendPush: true,
      });
    }

    logger.info("Like status updated", { artPublicationId, userId, isLiked: !isLiked });

    res.json({
      msg: "Like status updated",
      likeStatus: {
        artPublicationId,
        isLiked: !isLiked,
        totalLikes: isLiked ? artPublication.likes.length - 1 : artPublication.likes.length + 1,
      },
    });
  } catch (err) {
    logger.error('Error updating like status', { error: err.message, stack: err.stack });
    res.status(500).json({ msg: "Server Error" });
  }
};

export const getPublicationLikeCount = async (req, res) => {
  try {
    const artPublicationDoc = await db.collection('ArtPublications').doc(req.params.id).get();
    if (!artPublicationDoc.exists) {
      logger.warn("Art publication not found", { artPublicationId: req.params.id });
      return res.status(404).json({ msg: "Art publication not found" });
    }

    const artPublication = artPublicationDoc.data();
    res.json({
      artPublicationId: artPublication._id,
      totalLikes: artPublication.likes.length,
    });
  } catch (err) {
    logger.error('Error getting publication like count', { error: err.message, stack: err.stack });
    res.status(500).json({ msg: "Server Error" });
  }
};

import admin from 'firebase-admin';

export const getUsersWhoLikedPublication = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || parseInt(process.env.DEFAULT_PAGE_LIMIT, 10);
    const page = Number(req.query.page) || 1;
    const offset = (page - 1) * limit;

    if (req.params.id === undefined) {
      return res.status(400).json({ msg: "Missing art publication ID" });
    }

    const artPublicationDoc = await db.collection('ArtPublications').doc(req.params.id).get();
    if (!artPublicationDoc.exists) {
      logger.warn("Art publication not found", { artPublicationId: req.params.id });
      return res.status(404).json({ msg: "Art publication not found" });
    }

    const artPublication = artPublicationDoc.data();
    if (!artPublication.likes || artPublication.likes.length === 0) {
      return res.status(200).json({ artPublicationId: artPublication._id, users: [] });
    }

    console.log('artPublication.likes', artPublication.likes);

    // Utiliser admin.firestore.FieldPath.documentId() pour Firebase Admin SDK
    const likedUsersSnapshot = await db.collection('Users')
      .where(admin.firestore.FieldPath.documentId(), 'in', artPublication.likes)
      .limit(limit)
      .get();

    const likedUsers = likedUsersSnapshot.docs.map(doc => ({
      _id: doc.id,  // Identifiant du document
      username: doc.data().username,
    }));

    console.log('likedUsers', likedUsers);

    logger.info("Fetched users who liked the publication", { artPublicationId: req.params.id, count: likedUsers.length });

    res.json({
      artPublicationId: artPublication._id,
      users: likedUsers,
    });
  } catch (err) {
    logger.error('Error getting users who liked publication', { error: err.message, stack: err.stack });
    res.status(500).json({ msg: "Server Error" });
  }
};
