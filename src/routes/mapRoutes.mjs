import { Router } from "express";
const router = Router();
import { getUsersWithArtNearLocation } from "../controllers/map/mapController.mjs";
import { authenticate } from "../middleware/authenticate.mjs";

/**
 * @swagger
 * /api/map/nearby-art:
 *   get:
 *     summary: Get users with art publications near a location
 *     description: Allows a user to find other users with art publications within a certain radius from a specified location. Only users with art publications are retrieved.
 *     tags: [Map]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: latitude
 *         schema:
 *           type: number
 *         required: true
 *         description: Latitude of the search center.
 *       - in: query
 *         name: longitude
 *         schema:
 *           type: number
 *         required: true
 *         description: Longitude of the search center.
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *         required: true
 *         description: Search radius in kilometers.
 *     responses:
 *       200:
 *         description: List of users with art publications within the specified radius.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     description: The user ID.
 *                   username:
 *                     type: string
 *                     description: The username of the user.
 *                   profilePicture:
 *                     type: string
 *                     description: The URL of the user's profile picture.
 *       400:
 *         description: Missing or invalid query parameters.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   description: Error message.
 *       401:
 *         description: No token provided or token is invalid.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   description: Error message.
 *       500:
 *         description: Server Error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   description: Error message.
 */
router.get("/nearby-art", authenticate, getUsersWithArtNearLocation);

export default router;
