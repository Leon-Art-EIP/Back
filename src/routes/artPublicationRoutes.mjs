import express from 'express';
const router = express.Router();
import { authenticate } from "../middleware/authenticate.mjs";
import { createArtPublication, deleteArtPublication, getArtPublicationById, getFollowedArtPublications, getLatestArtPublications, getArtPublicationsByUser, getArtPublicationsImages } from '../controllers/artPublication/artPublicationController.mjs';
import { likeArtPublication, getPublicationLikeCount, getUsersWhoLikedPublication } from '../controllers/artPublication/likeController.mjs';
import { addComment, deleteComment, likeComment, getCommentsByArtPublicationId } from '../controllers/artPublication/commentController.mjs';
import { validateComment } from '../middleware/validation/commentValidation.mjs';
import { validateArtPublication, validateArtPublicationId } from '../middleware/validation/artPublicationValidation.mjs';
import { validateUserId } from '../middleware/validation/userValidation.mjs';
import {
    uploadArtImage
  } from "../middleware/uploadMiddleware.mjs";

router.get("/images", getArtPublicationsImages);

/**
 * @swagger
 * /api/art-publication:
 *   post:
 *     summary: Create an Art Publication
 *     description: |
 *       Allows an authenticated user to publish their art.
 *       The publication can include various details like art type, name, description, dimension, and more.
 *       Additionally, users can specify if the art is for sale and its price.
 *     tags: [ArtPublication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Art image file (jpeg, jpg, png up to 5MB).
 *               artType:
 *                 type: string
 *                 description: Type of the art being published.
 *                 example: "Peinture"
 *               name:
 *                 type: string
 *                 description: Name or title of the art.
 *                 example: "Sunset by the Lake"
 *               description:
 *                 type: string
 *                 description: A short description of the art.
 *                 example: "A beautiful sunset captured in oil."
 *               dimension:
 *                 type: string
 *                 description: Dimensions of the art.
 *                 example: "50cm x 70cm"
 *               isForSale:
 *                 type: boolean
 *                 description: Is the art for sale?
 *                 example: true
 *               price:
 *                 type: number
 *                 description: Price if the art is for sale.
 *                 example: 350
 *               location:
 *                 type: string
 *                 description: Location where the art can be viewed or bought.
 *                 example: "40.7128, 74.0060"
 *     responses:
 *       200:
 *         description: Art publication created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   description: Message indicating the success of the art publication.
 *       401:
 *         description: No token provided or token is invalid.
 *       422:
 *         description: Validation error (e.g. missing fields, invalid entries).
 *       500:
 *         description: Server Error.
 */
router.post('/', authenticate, uploadArtImage, validateArtPublication, createArtPublication);

/**
 * @swagger
 * /api/art-publication/{_id}:
 *   delete:
 *     summary: Delete an Art Publication
 *     description: |
 *       Allows an authenticated user to delete their art publication. Deletion is not allowed if there is an unfinished order associated with the art publication.
 *     tags: [ArtPublication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: _id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the art publication to delete.
 *     responses:
 *       200:
 *         description: Art publication deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   description: Message indicating the success of the deletion.
 *       400:
 *         description: Cannot delete art publication with unfinished orders.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   description: Error message indicating the reason for failure.
 *       401:
 *         description: No token provided or token is invalid.
 *       404:
 *         description: Art publication not found.
 *       500:
 *         description: Server Error.
 */
router.delete('/:_id', authenticate, validateArtPublicationId, deleteArtPublication);

/**
 * @swagger
 * /api/art-publication/comment/{id}:
 *   post:
 *     summary: Add a comment to an art publication
 *     description: Allows an authenticated user to comment on an art publication by ID.
 *     tags: [ArtPublication Comment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the art publication to comment on.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *                 description: Comment text.
 *               parentCommentId:
 *                 type: string
 *                 description: ID of the parent comment (optional).
 *     responses:
 *       200:
 *         description: Comment added.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Art publication not found.
 *       500:
 *         description: Server error.
 */
router.post('/comment/:id', authenticate, validateComment, addComment);

/**
 * @swagger
 * /api/art-publication/comment/{commentId}:
 *   delete:
 *     summary: Delete a comment from an art publication
 *     description: Allows an authenticated user to delete a comment they've made on an art publication.
 *     tags: [ArtPublication Comment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the comment to delete.
 *     responses:
 *       200:
 *         description: Comment deleted.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Comment belongs to another user.
 *       404:
 *         description: Comment not found.
 *       500:
 *         description: Server error.
 */
router.delete('/comment/:commentId', authenticate, deleteComment);

/**
 * @swagger
 * /api/art-publication/comment/{commentId}/like:
 *   post:
 *     summary: Like or unlike a comment on an art publication
 *     description: Allows an authenticated user to like or unlike a comment by ID.
 *     tags: [ArtPublication Comment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the comment to like or unlike.
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
 *                     commentId:
 *                       type: string
 *                     isLiked:
 *                       type: boolean
 *                     totalLikes:
 *                       type: integer
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Comment not found.
 *       500:
 *         description: Server error.
 */
router.post('/comment/:commentId/like', authenticate, likeComment);

/**
 * @swagger
 * /api/art-publication/comment/{id}:
 *   get:
 *     summary: Get comments for an art publication
 *     description: Fetches paginated comments for an art publication by ID.
 *     tags: [ArtPublication Comment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the art publication to fetch comments for.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of comments to return per page (optional).
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number to fetch (optional).
 *       - in: query
 *         name: nestedLimit
 *         schema:
 *           type: integer
 *         description: Number of nested comments to return per page (optional).
 *       - in: query
 *         name: nestedPage
 *         schema:
 *           type: integer
 *         description: Page number for nested comments pagination (optional).
 *     responses:
 *       200:
 *         description: List of comments.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   userId:
 *                     type: string
 *                     description: ID of the user who commented.
 *                   artPublicationId:
 *                     type: string
 *                     description: ID of the related art publication.
 *                   text:
 *                     type: string
 *                     description: Comment text.
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     description: Date and time when the comment was created.
 *                   likes:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: Array of user IDs who liked the comment.
 *                   isLiked:
 *                     type: boolean
 *                     description: Whether the authenticated user has liked the comment.
 *                   parentCommentId:
 *                     type: string
 *                     description: ID of the parent comment (if it's a reply).
 *                   nestedComments:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         userId:
 *                           type: string
 *                         text:
 *                           type: string
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                         likes:
 *                           type: array
 *                           items:
 *                             type: string
 *                         isLiked:
 *                           type: boolean
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Art publication not found.
 *       500:
 *         description: Server error.
 */
router.get('/comment/:id', authenticate, getCommentsByArtPublicationId);

/**
 * @swagger
 * /api/art-publication/{_id}:
 *   get:
 *     summary: Retrieve an Art Publication by ID
 *     description: Allows an authenticated user to retrieve details of an art publication using its unique identifier (_id).
 *     tags: [ArtPublication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: _id
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique identifier (_id) of the art publication.
 *     responses:
 *       200:
 *         description: Returns the requested art publication, including the total number of likes.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   description: The unique identifier of the art publication.
 *                 userId:
 *                   type: string
 *                   description: The ID of the user who posted the art publication.
 *                 image:
 *                   type: string
 *                   description: URL to the image of the art.
 *                 artType:
 *                   type: string
 *                   description: The type of art.
 *                 name:
 *                   type: string
 *                   description: The name of the art.
 *                 description:
 *                   type: string
 *                   description: A short description of the art.
 *                 dimension:
 *                   type: string
 *                   description: Dimensions of the art.
 *                 isForSale:
 *                   type: boolean
 *                   description: Whether the art is for sale.
 *                 price:
 *                   type: number
 *                   description: Price of the art if it is for sale.
 *                 location:
 *                   type: string
 *                   description: The location where the art can be viewed or purchased.
 *                 likes:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: Array of user IDs who liked the publication.
 *                 totalLikes:
 *                   type: integer
 *                   description: Total number of likes the art publication has received.
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   description: The date and time when the art publication was created.
 *       401:
 *         description: No token provided or token is invalid.
 *       404:
 *         description: Art publication not found.
 *       500:
 *         description: Server Error.
 */
router.get('/:_id', authenticate, validateArtPublicationId, getArtPublicationById);

/**
 * @swagger
 * /api/art-publication/feed/latest:
 *   get:
 *     summary: Retrieve latest Art Publications
 *     description: Get the latest art publications with pagination.
 *     tags: [ArtPublication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Maximum number of records to return.
 *     responses:
 *       200:
 *         description: Returns the latest art publications.
 *       401:
 *         description: No token provided or token is invalid.
 *       500:
 *         description: Server Error.
 */
router.get('/feed/latest', authenticate, getLatestArtPublications);

/**
 * @swagger
 * /api/art-publication/feed/followed:
 *   get:
 *     summary: Retrieve Art Publications from followed accounts
 *     description: Get the latest art publications from followed accounts with pagination.
 *     tags: [ArtPublication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Maximum number of records to return.
 *     responses:
 *       200:
 *         description: Returns the art publications from followed accounts.
 *       401:
 *         description: No token provided or token is invalid.
 *       500:
 *         description: Server Error.
 */
router.get('/feed/followed', authenticate, getFollowedArtPublications);

/**
 * @swagger
 * /api/art-publication/user/{userId}:
 *   get:
 *     summary: Retrieve Art Publications by User ID
 *     description: Get all art publications of a specific user with pagination.
 *     tags: [ArtPublication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user.
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Maximum number of records to return.
 *     responses:
 *       200:
 *         description: Returns the art publications of the specified user.
 *       401:
 *         description: No token provided or token is invalid.
 *       422:
 *         description: Invalid User ID.
 *       500:
 *         description: Server Error.
 */
router.get('/user/:userId', authenticate, validateUserId, getArtPublicationsByUser);

/**
 * @swagger
 * /api/art-publication/like/{id}:
 *   post:
 *     summary: Like or unlike an art publication
 *     description: Allows an authenticated user to like or unlike an art publication by ID and retrieve the current like count.
 *     tags: [ArtPublication Like]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the art publication to like or unlike.
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
 *                     artPublicationId:
 *                       type: string
 *                     isLiked:
 *                       type: boolean
 *                     totalLikes:
 *                       type: integer
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Art publication not found.
 *       500:
 *         description: Server error.
 */
router.post('/like/:id', authenticate, likeArtPublication);

/**
 * @swagger
 * /api/art-publication/like-count/{id}:
 *   get:
 *     summary: Retrieve the number of likes for a specific art publication
 *     tags: [ArtPublication Like]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the art publication.
 *     responses:
 *       200:
 *         description: Returns the number of likes for the given art publication ID.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 artPublicationId:
 *                   type: string
 *                 totalLikes:
 *                   type: integer
 *       404:
 *         description: Art publication not found.
 *       500:
 *         description: Server error.
 */
router.get('/like-count/:id', getPublicationLikeCount);

/**
 * @swagger
 * /api/art-publication/users-who-liked/{id}:
 *   get:
 *     summary: Retrieve users who liked a specific art publication with pagination
 *     tags: [ArtPublication Like]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the art publication.
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of users to retrieve per page.
 *     responses:
 *       200:
 *         description: Returns a list of users who liked the given art publication.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 artPublicationId:
 *                   type: string
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       username:
 *                         type: string
 *       404:
 *         description: Art publication not found.
 *       500:
 *         description: Server error.
 */
router.get('/users-who-liked/:id', getUsersWhoLikedPublication);


export default router;
