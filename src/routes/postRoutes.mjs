// routes/postRoutes.mjs
import express from 'express';
import { authenticate } from "../middleware/authenticate.mjs";
import {
  createPost,
  deletePost,
  getPosts,
  likePost,
  getPostLikeCount
} from '../controllers/posts/postController.mjs';

const router = express.Router();

/**
 * @swagger
 * /api/posts:
 *   post:
 *     summary: Create a new post
 *     description: Allows an authenticated user to create a new post.
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *                 description: The content of the post.
 *                 example: "This is a new post"
 *               artPublicationId:
 *                 type: string
 *                 description: The ID of the art publication linked to the post (optional).
 *     responses:
 *       200:
 *         description: Post created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                 post:
 *                   type: object
 *                   $ref: '#/components/schemas/Post'
 *       400:
 *         description: Validation error or user has posted within the last hour.
 *       401:
 *         description: No token provided or token is invalid.
 *       500:
 *         description: Server Error.
 */
router.post('/', authenticate, createPost);

/**
 * @swagger
 * /api/posts/{id}:
 *   delete:
 *     summary: Delete a post
 *     description: Allows an authenticated user to delete their own post.
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the post to delete.
 *     responses:
 *       200:
 *         description: Post deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *       401:
 *         description: No token provided or token is invalid.
 *       403:
 *         description: User not authorized to delete this post.
 *       404:
 *         description: Post not found.
 *       500:
 *         description: Server Error.
 */
router.delete('/:id', authenticate, deletePost);

/**
 * @swagger
 * /api/posts:
 *   get:
 *     summary: Get posts
 *     description: Retrieve posts with optional filters for popular, recent, or user posts.
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: filter
 *         required: true
 *         schema:
 *           type: string
 *           enum: [popular, recent, user]
 *         description: The filter type for the posts.
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [24h, week, month, all]
 *         description: The timeframe for popular posts (optional).
 *     responses:
 *       200:
 *         description: Returns a list of posts.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Post'
 *       401:
 *         description: No token provided or token is invalid.
 *       500:
 *         description: Server Error.
 */
router.get('/', authenticate, getPosts);

/**
 * @swagger
 * /api/posts/like/{id}:
 *   post:
 *     summary: Like or unlike a post
 *     description: Allows an authenticated user to like or unlike a post by ID and retrieve the current like count.
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the post to like or unlike.
 *     responses:
 *       200:
 *         description: Like status updated along with total like count.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                 likeStatus:
 *                   type: object
 *                   properties:
 *                     postId:
 *                       type: string
 *                     isLiked:
 *                       type: boolean
 *                     totalLikes:
 *                       type: integer
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Post not found.
 *       500:
 *         description: Server error.
 */
router.post('/like/:id', authenticate, likePost);

/**
 * @swagger
 * /api/posts/like-count/{id}:
 *   get:
 *     summary: Retrieve the number of likes for a specific post
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the post.
 *     responses:
 *       200:
 *         description: Returns the number of likes for the given post ID.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 postId:
 *                   type: string
 *                 totalLikes:
 *                   type: integer
 *       404:
 *         description: Post not found.
 *       500:
 *         description: Server error.
 */
router.get('/like-count/:id', getPostLikeCount);

export default router;
