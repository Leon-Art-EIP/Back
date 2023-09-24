import express from 'express';
const router = express.Router();
import { authenticate } from "../middleware/authenticate.mjs";
import { createArtPublication } from '../controllers/artPublicationController.mjs';
import { likeArtPublication } from '../controllers/likeController.mjs';
import { addToCollection } from '../controllers/collectionController.mjs';
import { addComment, deleteComment } from '../controllers/commentController.mjs';
import { validateCollection } from '../middleware/collectionValidation.mjs';
import { validateComment } from '../middleware/commentValidation.mjs';
import { validateArtPublication } from '../middleware/artPublicationValidation.mjs';

/**
 * @swagger
 * /api/art-publication:
 *   post:
 *     summary: Create an Art Publication
 *     description: |
 *       Allows an authenticated user to publish their art.
 *       The publication can include various details like art type, name, description, dimension, and more.
 *       Additionally, users can specify if the art is for sale and its price.
 *     tags: [Art Publication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 description: URL of the art image.
 *                 example: "https://someimage.com/myart.png"
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
router.post('/', authenticate, validateArtPublication, createArtPublication);

/**
 * @swagger
 * /api/art-publication/like/{id}:
 *   post:
 *     summary: Like or unlike an art publication
 *     description: Allows an authenticated user to like or unlike an art publication by ID.
 *     tags: [ArtPublication]
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
 *         description: Like status updated.
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
 * /api/art-publication/collection:
 *   post:
 *     summary: Add an art publication to a user collection
 *     description: Allows an authenticated user to add an art publication to a specified or new collection.
 *     tags: [ArtPublication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               artPublicationId:
 *                 type: string
 *                 description: ID of the art publication to add to the collection.
 *               collectionName:
 *                 type: string
 *                 description: Name of the collection.
 *     responses:
 *       200:
 *         description: Added to collection.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Art publication not found.
 *       500:
 *         description: Server error.
 */
router.post('/collection', authenticate, validateCollection, addToCollection);

/**
 * @swagger
 * /api/art-publication/comment/{id}:
 *   post:
 *     summary: Add a comment to an art publication
 *     description: Allows an authenticated user to comment on an art publication by ID.
 *     tags: [ArtPublication]
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
 *     tags: [ArtPublication]
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



export default router;
