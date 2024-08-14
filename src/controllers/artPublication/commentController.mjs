import db from '../../config/db.mjs';
import { v4 as uuidv4 } from 'uuid';
import logger from '../../admin/logger.mjs';
import { FieldValue } from 'firebase-admin/firestore';
import { Comment } from '../../models/commentModel.mjs';

// Helper function to clean undefined fields
const cleanUndefinedFields = (obj) => {
  return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined));
};

export const addComment = async (req, res) => {
  try {
    const userId = req.user.id;
    const artPublicationId = req.params.id;
    const { text, parentCommentId = null } = req.body;

    const newCommentId = uuidv4();
    const newCommentData = cleanUndefinedFields({
      userId,
      artPublicationId,
      text,
      createdAt: new Date().toISOString(),
      parentCommentId,
      likes: []
    });

    const commentRef = db.collection('Comments').doc(newCommentId);
    await commentRef.set(newCommentData);

    logger.info('Comment added successfully', { comment: newCommentData });

    res.json({
      msg: 'Comment added',
      comment: {
        id: newCommentId,
        ...newCommentData
      }
    });
  } catch (err) {
    logger.error('Error adding comment', { error: err.message, stack: err.stack });
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

    logger.info('Comment deleted successfully', { commentId });

    res.json({ msg: 'Comment deleted' });
  } catch (err) {
    logger.error('Error deleting comment', { error: err.message, stack: err.stack });
    res.status(500).json({ msg: 'Server Error' });
  }
};

export const likeComment = async (req, res) => {
  try {
    const userId = req.user.id;
    const commentId = req.params.commentId;

    const commentDoc = await db.collection('Comments').doc(commentId).get();
    if (!commentDoc.exists) return res.status(404).json({ msg: 'Comment not found' });

    const comment = commentDoc.data();
    let isLiked;

    if (comment.likes.includes(userId)) {
      comment.likes = comment.likes.filter(id => id !== userId);
      isLiked = false;
    } else {
      comment.likes.push(userId);
      isLiked = true;
    }

    await db.collection('Comments').doc(commentId).update({ likes: comment.likes });

    res.json({
      msg: 'Like status updated',
      likeStatus: {
        commentId,
        isLiked,
        totalLikes: comment.likes.length,
      },
    });
  } catch (err) {
    logger.error('Error updating like status', { error: err.message, stack: err.stack });
    res.status(500).json({ msg: 'Server Error' });
  }
};

export const getCommentsByArtPublicationId = async (req, res) => {
  try {
    const userId = req.user.id;
    const artPublicationId = req.params.id;
    const limit = Number(req.query.limit) || parseInt(process.env.DEFAULT_PAGE_LIMIT, 10);
    const page = Number(req.query.page) || 1;
    const offset = (page - 1) * limit;

    const commentsQuerySnapshot = await db.collection('Comments')
      .where('artPublicationId', '==', artPublicationId)
      .where('parentCommentId', '==', null)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .offset(offset)
      .get();

    const comments = await Promise.all(commentsQuerySnapshot.docs.map(async doc => {
      const comment = doc.data();
      comment.isLiked = comment.likes.includes(userId);
      comment.id = doc.id;

      // Fetch nested comments with pagination
      const nestedCommentsLimit = Number(req.query.nestedLimit) || parseInt(process.env.DEFAULT_PAGE_LIMIT, 10);
      const nestedCommentsPage = Number(req.query.nestedPage) || 1;
      const nestedOffset = (nestedCommentsPage - 1) * nestedCommentsLimit;

      const nestedCommentsSnapshot = await db.collection('Comments')
        .where('parentCommentId', '==', comment.id)
        .orderBy('createdAt', 'desc')
        .limit(nestedCommentsLimit)
        .offset(nestedOffset)
        .get();

      comment.nestedComments = nestedCommentsSnapshot.docs.map(nestedDoc => {
        const nestedComment = nestedDoc.data();
        nestedComment.isLiked = nestedComment.likes.includes(userId);
        nestedComment.id = nestedDoc.id;
        // nestedComment.createdAt = nestedComment.createdAt.toDate().toISOString();
        // just... why ?
        return nestedComment;
      });

      return comment;
    }));

    logger.info('Fetched comments for art publication', { artPublicationId, count: comments.length });

    res.json(comments);
  } catch (err) {
    logger.error('Error fetching comments for art publication', { error: err.message, stack: err.stack });
    res.status(500).json({ msg: 'Server Error' });
  }
};
