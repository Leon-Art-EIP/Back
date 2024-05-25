import { ArtPublication } from "../../models/artPublicationModel.mjs";
import { Comment } from "../../models/commentModel.mjs";
import { createAndSendNotification } from "../notification/notificationController.mjs";

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

    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ msg: 'Comment not found' });

    if (String(comment.userId) !== String(userId)) return res.status(403).json({ msg: 'Unauthorized' });

    await Comment.findByIdAndRemove(commentId);

    const artPublication = await ArtPublication.findById(comment.artPublicationId);
    artPublication.comments.pull(commentId);
    await artPublication.save();

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
