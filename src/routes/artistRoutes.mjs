import express from 'express';
import { getLatestArtists } from '../controllers/user/artist/artistController.mjs';
import { authenticate } from '../middleware/authenticate.mjs';

const router = express.Router();

/**
 * @swagger
 * /api/artists/latest:
 *   get:
 *     summary: Fetch Latest Artists
 *     description: |
 *       Retrieve the latest artists that have marked themselves as `is_artist`. 
 *       The result is sorted by creation date (latest first) and can be paginated using query parameters.
 *     tags: [Artists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: The number of artists to retrieve (default is 10).
 *         example: 5
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: The page number for pagination.
 *         example: 2
 *     responses:
 *       200:
 *         description: Successful retrieval of artists.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 artists:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       username:
 *                         type: string
 *                       email:
 *                         type: string
 *                       is_artist:
 *                         type: boolean
 *                       biography:
 *                         type: string
 *                       availability:
 *                         type: string
 *                       subscription:
 *                         type: string
 *                       collections:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             name:
 *                               type: string
 *                       subscriptions:
 *                         type: array
 *                         items:
 *                           type: string
 *                       subscribersCount:
 *                         type: integer
 *                       likedPublications:
 *                         type: array
 *                         items:
 *                           type: string
 *       401:
 *         description: No token provided or token is invalid.
 *       500:
 *         description: Server Error.
 */
router.get('/latest', authenticate, getLatestArtists); 

export default router;
