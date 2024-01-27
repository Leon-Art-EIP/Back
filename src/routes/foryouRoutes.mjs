import { authenticate } from "../middleware/authenticate.mjs";
import { getArtPublications } from "../controllers/foryou/foryou.mjs";
import express from 'express';

const router = express.Router();

/**
 * @swagger
 * /api/foryou:
 *   get:
 *     summary: Get Art Publications
 *     description: Get all art publications sorted by recency.
 *     tags: [For You]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Art Publications
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ArtPublication'
 *       401:
 *         description: Unauthorized access, no valid token provided.
 *       500:
 *         description: Server error.
 */

router.get('/', authenticate, getArtPublications);

export default router;