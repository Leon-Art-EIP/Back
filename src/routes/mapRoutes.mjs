import { Router } from "express";
const router = Router();
import { getUsersWithArtNearLocation } from "../controllers/map/mapController.mjs";
import { authenticate } from "../middleware/authenticate.mjs";

/**
 * @swagger
 * /api/map/nearby-art:
 *   get:
 *     summary: Get users with art publications near a location
 *     description: Allows a user to find other users with art publications within a certain radius from a specified location.
 *     tags: [Map]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: latitude
 *         schema:
 *           type: number
 *         required: true
 *         description: Latitude of the search center
 *       - in: query
 *         name: longitude
 *         schema:
 *           type: number
 *         required: true
 *         description: Longitude of the search center
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *         required: true
 *         description: Search radius in kilometers
 *     responses:
 *       200:
 *         description: List of users with art publications within the specified radius
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   username:
 *                     type: string
 *                   profilePicture:
 *                     type: string
 *                   location:
 *                     type: object
 *                     properties:
 *                       type:
 *                         type: string
 *                         enum: [Point]
 *                       coordinates:
 *                         type: array
 *                         items:
 *                           type: number
 *       400:
 *         description: Missing or invalid query parameters
 *       500:
 *         description: Server Error
 */
router.get("/nearby-art", authenticate, getUsersWithArtNearLocation);

export default router;
