import { Post } from '../../models/postModel.mjs';
import { User } from '../../models/userModel.mjs';
import { ArtPublication } from '../../models/artPublicationModel.mjs';
import db from '../../config/db.mjs';
import { v4 as uuidv4 } from 'uuid';
import logger from '../../admin/logger.mjs';

const cleanUndefinedFields = (obj) => {
  return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined));
};

export const createPost = async (req, res) => {
  try {
    const userId = req.user.id;
    const { text, artPublicationId } = req.body;

    // Fetch cooldown from environment variable or use 10 minutes as default
    const POST_COOLDOWN = parseInt(process.env.POST_COOLDOWN_MINUTES || 10) * 60000; // Convert minutes to milliseconds

    // Check if the user has already posted within the cooldown period
    const postsSnapshot = await db.collection('Posts').where('userId', '==', userId).orderBy('createdAt', 'desc').limit(1).get();
    if (!postsSnapshot.empty) {
      const lastPost = postsSnapshot.docs[0].data();
      if (lastPost.createdAt) {
        const lastPostTime = new Date(lastPost.createdAt.toDate()).getTime(); // Convert Firestore Timestamp to Date
        const currentTime = Date.now();
        
        if (currentTime - lastPostTime < POST_COOLDOWN) {
          const waitTime = Math.ceil((POST_COOLDOWN - (currentTime - lastPostTime)) / 60000);
          return res.status(400).json({ msg: `Please wait ${waitTime} more minute(s) before creating a new post.` });
        }
      } else {
        console.error('No valid createdAt timestamp found for the last post.');
      }
    }

    // Proceed with creating the post if cooldown is respected
    const newPostData = cleanUndefinedFields({
      userId,
      text,
      artPublicationId: artPublicationId || null,
      createdAt: new Date(),
      likes: [],
      id: uuidv4(),
    });

    const postRef = db.collection('Posts').doc(newPostData.id);
    await postRef.set(newPostData);

    const userDoc = await db.collection('Users').doc(userId).get();
    const user = userDoc.exists ? userDoc.data() : null;

    res.json({
      msg: 'Post created successfully!',
      post: newPostData,
      user: {
        username: user.username,
        profilePicture: user.profilePicture,
      },
    });
  } catch (err) {
    console.error('Error creating post', err);
    logger.error('Error creating post', { error: err.message, stack: err.stack });
    return res.status(500).json({ msg: 'Server Error' });
  }
};



export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const postDoc = await db.collection('Posts').doc(id).get();

    if (!postDoc.exists) {
      return res.status(404).json({ msg: 'Post not found' });
    }

    const post = postDoc.data();
    if (post.userId !== req.user.id) {
      return res.status(403).json({ msg: 'User not authorized to delete this post' });
    }

    await db.collection('Posts').doc(id).delete();

    res.json({ msg: 'Post deleted successfully' });
  } catch (err) {
    logger.error('Error deleting post', { error: err.message, stack: err.stack });
    res.status(500).json({ msg: 'Server Error' });
  }
};

export const getPosts = async (req, res) => {
  try {
    const { filter, timeframe } = req.query;
    let postsQuery = db.collection('Posts');

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
      postsQuery = postsQuery.where('createdAt', '>=', dateLimit).orderBy('likes', 'desc');
    } else if (filter === 'recent') {
      postsQuery = postsQuery.orderBy('createdAt', 'desc');
    } else if (filter === 'user') {
      const userId = req.user.id;
      postsQuery = postsQuery.where('userId', '==', userId).orderBy('createdAt', 'desc');
    } else {
      return res.status(400).json({ msg: 'Invalid filter option' });
    }

    const postsSnapshot = await postsQuery.get();
    const posts = await Promise.all(
      postsSnapshot.docs.map(async (postDoc) => {
        const post = postDoc.data();
        const userDoc = await db.collection('Users').doc(post.userId).get();
        const user = userDoc.exists ? userDoc.data() : null;
        const artPublicationDoc = post.artPublicationId ? await db.collection('ArtPublications').doc(post.artPublicationId).get() : null;
        const artPublication = artPublicationDoc?.exists ? artPublicationDoc.data() : null;

        // Convertir createdAt en objet Date
        const createdAt = post.createdAt ? post.createdAt.toDate() : null;

        return {
          ...post,
          createdAt, // Ajout de createdAt en tant que Date
          user: user ? { username: user.username, profilePicture: user.profilePicture } : null,
          artPublication: artPublication ? { name: artPublication.name } : null,
        };
      })
    );

    res.json(posts);
  } catch (err) {
    logger.error('Error fetching posts', { error: err.message, stack: err.stack });
    res.status(500).json({ msg: 'Server Error' });
  }
};

export const likePost = async (req, res) => {
  try {
    const userId = req.user.id;
    const postId = req.params.id;

    const postDoc = await db.collection('Posts').doc(postId).get();
    if (!postDoc.exists) return res.status(404).json({ msg: 'Post not found' });

    const post = postDoc.data();
    post.likes = post.likes || [];
    let isLiked;

    if (post.likes.includes(userId)) {
      post.likes = post.likes.filter(id => id !== userId);
      isLiked = false;
    } else {
      post.likes.push(userId);
      isLiked = true;
    }

    await db.collection('Posts').doc(postId).update({ likes: post.likes });

    res.json({
      msg: 'Like status updated',
      likeStatus: {
        postId,
        isLiked,
        totalLikes: post.likes.length,
      },
    });
  } catch (err) {
    logger.error('Error updating like status', { error: err.message, stack: err.stack });
    res.status(500).json({ msg: 'Server Error' });
  }
};


export const getPostLikeCount = async (req, res) => {
  try {
    const postDoc = await db.collection('Posts').doc(req.params.id).get();
    if (!postDoc.exists) return res.status(404).json({ msg: 'Post not found' });

    const post = postDoc.data();

    res.json({
      postId: post.id,
      totalLikes: post.likes.length,
    });
  } catch (err) {
    logger.error('Error fetching like count', { error: err.message, stack: err.stack });
    res.status(500).json({ msg: 'Server Error' });
  }
};
