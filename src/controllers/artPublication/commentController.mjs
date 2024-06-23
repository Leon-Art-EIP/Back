import { FieldValue } from 'firebase-admin/firestore';
import db from '../../config/db.mjs';
import { v4 as uuidv4 } from 'uuid';
import logger from '../../admin/logger.mjs'; // Assurez-vous que le chemin est correct

const cleanUndefinedFields = (obj) => {
  return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined));
};

export const addComment = async (req, res) => {
  try {
    const userId = req.user.id;
    const artPublicationId = req.params.id;
    const { text } = req.body;

    const newCommentId = uuidv4();
    const newCommentData = cleanUndefinedFields({
      userId,
      artPublicationId,
      text,
      createdAt: new Date().toISOString()
    });

    const commentRef = db.collection('Comments').doc(newCommentId);
    await commentRef.set(newCommentData);

    const artPublicationRef = db.collection('ArtPublications').doc(artPublicationId);
    await artPublicationRef.update({
      comments: FieldValue.arrayUnion(newCommentId)
    });

    logger.info('Comment added successfully', { comment: newCommentData });

    res.json({
      msg: 'Comment added',
      comment: {
        id: newCommentId,
        ...newCommentData
      }
    });
  } catch (err) {
    logger.error('Error adding comment', { error: err.message });
    res.status(500).json({ msg: 'Server Error' });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const userId = req.user.id;
    const commentId = req.params.commentId;

    const commentDoc = await db.collection('Comments').doc(commentId).get();
    if (!commentDoc.exists) {
      return res.status(404).json({ msg: 'Comment not found' });
    }

    const comment = commentDoc.data();
    if (comment.userId !== userId) {
      return res.status(403).json({ msg: 'Unauthorized' });
    }

    await db.collection('Comments').doc(commentId).delete();

    const artPublicationRef = db.collection('ArtPublications').doc(comment.artPublicationId);
    await artPublicationRef.update({
      comments: FieldValue.arrayRemove(commentId)
    });

    logger.info('Comment deleted successfully', { commentId });

    res.json({ msg: 'Comment deleted' });
  } catch (err) {
    logger.error('Error deleting comment', { error: err.message });
    res.status(500).json({ msg: 'Server Error' });
  }
};

export const getCommentsByArtPublicationId = async (req, res) => {
  try {
    const artPublicationId = req.params.id;
    const limit = Number(req.query.limit) || parseInt(process.env.DEFAULT_PAGE_LIMIT, 10);
    const page = Number(req.query.page) || 1;
    const offset = (page - 1) * limit;

    const artPublicationDoc = await db.collection('ArtPublications').doc(artPublicationId).get();
    if (!artPublicationDoc.exists) {
      return res.status(404).json({ msg: 'Art publication not found' });
    }

    const commentsQuerySnapshot = await db.collection('Comments')
      .where('artPublicationId', '==', artPublicationId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .offset(offset)
      .get();

    const comments = commentsQuerySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    logger.info('Fetched comments for art publication', { artPublicationId, count: comments.length });

    res.json(comments);
  } catch (err) {
    logger.error('Error fetching comments for art publication', { error: err.message });
    res.status(500).json({ msg: 'Server Error' });
  }
};
