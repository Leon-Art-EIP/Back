import { ArtPublication } from '../models/ArtPublicationModel.mjs';
import { Comment } from '../models/CommentModel.mjs';

export const addComment = async (req, res) => {
  try {
    const userId = req.user.id;
    const artPublicationId = req.params.id;
    const { text } = req.body;

    const artPublication = await ArtPublication.findById(artPublicationId);
    if (!artPublication) return res.status(404).json({ msg: 'Art publication not found' });

    const newComment = new Comment({ userId, artPublicationId, text });
    await newComment.save();

    artPublication.comments.push(newComment._id);
    await artPublication.save();

    res.json({ 
        msg: 'Comment added',
        comment: {
          id: newComment._id,
          userId,
          artPublicationId,
          text
        }
      });
  } catch (err) /* istanbul ignore next */ {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
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
        commentId
      });
  } catch (err) /* istanbul ignore next */ {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};
