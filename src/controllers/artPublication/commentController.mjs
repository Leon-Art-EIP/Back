import { ArtPublication } from "../../models/artPublicationModel.mjs";
import { Comment } from "../../models/commentModel.mjs";
import { createAndSendNotification } from "../notification/notificationController.mjs";
import { format } from 'date-fns';
import { FieldValue } from 'firebase-admin/firestore';
import db from '../../config/db.mjs';

export const addComment = async (req, res) => {
  try {
    const userId = req.user.id;
    const artPublicationId = req.params.id;
    const { text } = req.body;

    // Check if the art publication exists
    const artPublication = await ArtPublication.findById(artPublicationId);
    if (!artPublication) return res.status(404).json({ msg: 'Art publication not found' });

    // Create and save the new comment
    const newComment = new Comment({ userId, artPublicationId, text });
    await newComment.save();

    console.log('Comment going to be added:', newComment);
    // Update the art publication to include the new comment ID
    const updatedComments = [...artPublication.comments, newComment._id];
    await artPublication.update({ comments: updatedComments });

    // Send notification to the art publication owner
    if (artPublication.userId.toString() !== userId) {
      // Don't notify if the user comments on their own publication
      createAndSendNotification({
        recipientId: artPublication.userId,
        type: "comment",
        content: ` `,
        referenceId: artPublicationId,
        description: `A new comment has been added to your publication.`,
        sendPush: true,
      });
    }

    res.json({
      msg: 'Comment added',
      comment: {
        id: newComment._id,
        userId,
        artPublicationId,
        text,
        createdAt: newComment.createdAt
      }
    });
  } catch (err) /* istanbul ignore next */ {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error', details: err.message });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const userId = req.user.id;
    const commentId = req.params.commentId;

    console.log(`User ID: ${userId}`);
    console.log(`Comment ID: ${commentId}`);

    const commentDoc = await db.collection('Comments').doc(commentId).get();
    if (!commentDoc.exists) return res.status(404).json({ msg: 'Comment not found' });

    const comment = commentDoc.data();
    if (String(comment.userId) !== String(userId)) {
      console.error('Unauthorized attempt to delete comment');
      return res.status(403).json({ msg: 'Unauthorized' });
    }

    await db.collection('Comments').doc(commentId).delete();

    const artPublicationDoc = await db.collection('ArtPublications').doc(comment.artPublicationId).get();
    if (!artPublicationDoc.exists) {
      console.error('Art publication not found while deleting comment');
      return res.status(404).json({ msg: 'Art publication not found' });
    }

    await db.collection('ArtPublications').doc(comment.artPublicationId).update({
      comments: FieldValue.arrayRemove(commentId)
    });

    res.json({
      msg: 'Comment deleted',
      commentId,
      userId
    });
  } catch (err) /* istanbul ignore next */ {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error', details: err.message });
  }
};


export const getCommentsByArtPublicationId = async (req, res) => {
  try {
    const artPublicationId = req.params.id;
    const limit = Number(req.query.limit) || parseInt(process.env.DEFAULT_PAGE_LIMIT, 10);
    const page = Number(req.query.page) || 1;
    const offset = (page - 1) * limit;

    // Check if the art publication exists
    const artPublication = await ArtPublication.findById(artPublicationId);
    if (!artPublication) return res.status(404).json({ msg: 'Art publication not found' });

    // Fetch the comments
    const comments = await Comment.findWithOrder({ artPublicationId }, 'createdAt', 'desc', limit, offset);

    // Format the dates of the comments
    const formattedComments = comments.map(comment => ({
      ...comment,
      createdAt: format(new Date(comment.createdAt), 'yyyy-MM-dd HH:mm:ss') // Format the date as desired
    }));

    // Return the paginated comments
    res.json(formattedComments);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error', details: err.message });
  }
};