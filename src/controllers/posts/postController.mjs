import { Post } from '../../models/postModel.mjs';
import { User } from '../../models/userModel.mjs';
import { ArtPublication } from '../../models/artPublicationModel.mjs';

export const createPost = async (req, res) => {
  try {
    const userId = req.user.id;
    const { text, artPublicationId } = req.body;

    // Check if the user has already posted in the last hour
    const lastPost = await Post.findOne({ userId }).sort({ createdAt: -1 });
    if (lastPost && (Date.now() - new Date(lastPost.createdAt).getTime()) < 3600000) {
      return res.status(400).json({ msg: 'You can only post once per hour' });
    }

    const newPost = new Post({
      userId,
      text,
      artPublicationId,
    });

    await newPost.save();

    return res.json({ msg: 'Post created successfully!', post: newPost });
  } catch (err) /* istanbul ignore next */ {
    console.error(err.message);
    return res.status(500).json({ msg: 'Server Error' });
  }
};

export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }

    if (post.userId.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'User not authorized to delete this post' });
    }

    await Post.deleteOne({ _id: id });

    res.json({ msg: 'Post deleted successfully' });
  } catch (err) /* istanbul ignore next */ {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

export const getPosts = async (req, res) => {
  try {
    const { filter, timeframe } = req.query;
    let posts;

    if (filter === 'popular') {
      let dateLimit;
      switch (timeframe) {
        case '24h':
          dateLimit = new Date(Date.now() - 24 * 60 * 60 * 1000);
          break;
        case 'week':
          dateLimit = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          dateLimit = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'all':
        default:
          dateLimit = new Date(0);
          break;
      }

      posts = await Post.find({ createdAt: { $gte: dateLimit } })
        .sort({ likes: -1 })
        .populate('userId', 'username profilePicture')
        .populate('artPublicationId', 'name');
    } else if (filter === 'recent') {
      posts = await Post.find()
        .sort({ createdAt: -1 })
        .populate('userId', 'username profilePicture')
        .populate('artPublicationId', 'name');
    } else if (filter === 'user') {
      const userId = req.user.id;
      posts = await Post.find({ userId })
        .sort({ createdAt: -1 })
        .populate('userId', 'username profilePicture')
        .populate('artPublicationId', 'name');
    } else {
      return res.status(400).json({ msg: 'Invalid filter option' });
    }

    res.json(posts);
  } catch (err) /* istanbul ignore next */ {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

export const likePost = async (req, res) => {
  try {
    const userId = req.user.id;
    const postId = req.params.id;

    const post = await Post.findById(postId);
    const user = await User.findById(userId);

    if (!post) return res.status(404).json({ msg: 'Post not found' });

    if (post.likes.includes(userId)) {
      // Remove like from Post
      post.likes.pull(userId);
    } else {
      // Add like to Post
      post.likes.push(userId);
    }

    await post.save();

    res.json({
      msg: 'Like status updated',
      likeStatus: {
        postId,
        isLiked: post.likes.includes(userId),
        totalLikes: post.likes.length,
      },
    });
  } catch (err) /* istanbul ignore next */ {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

export const getPostLikeCount = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: 'Post not found' });

    res.json({
      postId: post._id,
      totalLikes: post.likes.length,
    });
  } catch (err) /* istanbul ignore next */ {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};
