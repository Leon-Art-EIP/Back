import { ArtPublication } from "../../models/artPublicationModel.mjs";
import { Comment } from "../../models/commentModel.mjs";
import { createAndSendNotification } from "../notification/notificationController.mjs";

export const addComment = async (req, res) => {
  try {
    const userId = req.user.id;
    const artPublicationId = req.params.id;
    const { text } = req.body;

    const artPublication = await ArtPublication.findById(artPublicationId);
    if (!artPublication)
      return res.status(404).json({ msg: "Art publication not found" });

    const newComment = new Comment({ userId, artPublicationId, text });
    await newComment.save();

    artPublication.comments.push(newComment._id);
    await artPublication.save();

    // Send notification to the art publication owner
    if (artPublication.userId.toString() !== userId) {
      // Don't notify if the user comments on their own publication
      createAndSendNotification({
        recipientId: artPublication.userId,
        type: "comment",
        content: `A new comment has been added to your publication.`,
        referenceId: artPublicationId,
        sendPush: true,
      });
    }

    res.json({
      msg: "Comment added",
      comment: {
        id: newComment._id,
        userId,
        artPublicationId,
        text,
        createdAt: newComment.createdAt,
      },
    });
  } catch (err) /* istanbul ignore next */ {
    console.error(err.message);
    res.status(500).json({ msg: "Server Error", details: err.message });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const userId = req.user.id;
    const commentId = req.params.commentId;

    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ msg: "Comment not found" });

    if (String(comment.userId) !== String(userId))
      return res.status(403).json({ msg: "Unauthorized" });

    await Comment.findByIdAndRemove(commentId);

    const artPublication = await ArtPublication.findById(
      comment.artPublicationId
    );
    artPublication.comments.pull(commentId);
    await artPublication.save();

    res.json({
      msg: "Comment deleted",
      commentId,
      userId,
    });
  } catch (err) /* istanbul ignore next */ {
    console.error(err.message);
    res.status(500).json({ msg: "Server Error", details: err.message });
  }
};

export const getCommentsByArtPublicationId = async (req, res) => {
  try {
    const artPublicationId = req.params.id;
    const limit = Number(req.query.limit) || process.env.DEFAULT_PAGE_LIMIT;
    const page = Number(req.query.page) || 1;

    // Check if the art publication exists
    const artPublication = await ArtPublication.findById(artPublicationId);
    if (!artPublication)
      return res.status(404).json({ msg: "Art publication not found" });

    // Fetch the comments
    const comments = await Comment.find({ artPublicationId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    // Return the paginated comments
    res.json(comments);
  } catch (err) /* istanbul ignore next */ {
    console.error(err.message);
    res.status(500).json({ msg: "Server Error", details: err.message });
  }
};
