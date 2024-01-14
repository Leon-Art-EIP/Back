import express from "express";
const router = express.Router();
import { authenticate } from "../middleware/authenticate.mjs";
import {
  addToCollection,
  getArtPublicationsInCollection,
  getPublicCollections,
  getMyCollections,
  deleteCollection,
} from "../controllers/collection/collectionController.mjs";
import { validateCollection } from "../middleware/validation/collectionValidation.mjs";

/**
 * @swagger
 * /api/collection:
 *   post:
 *     summary: Add an art publication to a user's collection
 *     description: Allows an authenticated user to add an art publication to a specified or new collection.
 *     tags: [Collection]
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
 *               isPublic:
 *                 type: boolean
 *                 description: If the collection is public.
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
router.post("/", authenticate, validateCollection, addToCollection);

/**
 * @swagger
 * /api/collection/{collectionId}:
 *   delete:
 *     summary: Delete a collection by ID
 *     description: Allows an authenticated user to delete a specific collection.
 *     tags: [Collection]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: collectionId
 *         required: true
 *         description: ID of the collection.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Collection deleted successfully.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Collection not found.
 *       500:
 *         description: Server error.
 */
router.delete("/:collectionId", authenticate, deleteCollection);

/**
 * @swagger
 * /api/collection/my-collections:
 *   get:
 *     summary: Get collections of the logged-in user
 *     description: Allows an authenticated user to fetch all their collections.
 *     tags: [Collection]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's collections.
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Server error.
 */
router.get("/my-collections", authenticate, getMyCollections);

/**
 * @swagger
 * /api/collection/user/{userId}/collections:
 *   get:
 *     summary: Get public collections of a specific user
 *     description: Retrieve all public collections of the given user.
 *     tags: [Collection]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         description: ID of the user.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of user's public collections.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Server error.
 */
router.get("/user/:userId/collections", getPublicCollections);

/**
 * @swagger
 * /api/collection/{collectionId}/publications:
 *   get:
 *     summary: Get art publications in a collection by collection ID
 *     description: Retrieve art publications of a specific collection.
 *     tags: [Collection]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: collectionId
 *         required: true
 *         description: ID of the collection.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of art publications in the collection.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Collection not found.
 *       500:
 *         description: Server error.
 */
router.get(
  "/:collectionId/publications",
  authenticate,
  getArtPublicationsInCollection
);

/**
 * @swagger
 * /api/collection/{collectionId}/remove:
 *   patch:
 *     summary: Remove art publications from a collection
 *     description: Allows an authenticated user to remove one or multiple art publications from a specified collection.
 *     tags: [Collection]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: collectionId
 *         required: true
 *         description: ID of the collection.
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               artPublicationIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of art publication IDs to be removed from the collection.
 *     responses:
 *       200:
 *         description: Art publications removed from collection successfully.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Collection not found.
 *       500:
 *         description: Server error.
 */
router.patch("/:collectionId/remove", authenticate, removeFromCollection);

export default router;
