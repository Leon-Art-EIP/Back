import express from 'express';
import { authenticate } from "../middleware/authenticate.mjs";
import { getInfractions, signalUser, signalArtPublication } from '../controllers/signalment/signalmentController.mjs';

const router = express.Router();

/**
 * @swagger
 * /api/signalments/infractions:
 *   get:
 *     summary: Get list of possible infractions
 *     description: Retrieve a list of possible infractions for signalments.
 *     tags: [Signalment]
 *     responses:
 *       200:
 *         description: List of possible infractions.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 */
router.get('/infractions', getInfractions);

/**
 * @swagger
 * /api/signalments/user:
 *   post:
 *     summary: Signal a user
 *     description: Allows an authenticated user to signal another user for infractions.
 *     tags: [Signalment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 description: The ID of the user being signaled.
 *               infraction:
 *                 type: string
 *                 description: Type of infraction observed.
 *               message:
 *                 type: string
 *                 description: Additional message describing the infraction.
 *     responses:
 *       200:
 *         description: User signalment created successfully.
 *       400:
 *         description: Invalid request data.
 *       500:
 *         description: Server error.
 */
router.post('/user', authenticate, signalUser);

/**
 * @swagger
 * /api/signalments/art-publication:
 *   post:
 *     summary: Signal an art publication
 *     description: Allows an authenticated user to signal an art publication for infractions.
 *     tags: [Signalment]
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
 *                 description: The ID of the art publication being signaled.
 *               infraction:
 *                 type: string
 *                 description: Type of infraction observed.
 *               message:
 *                 type: string
 *                 description: Additional message describing the infraction.
 *     responses:
 *       200:
 *         description: Art publication signalment created successfully.
 *       400:
 *         description: Invalid request data.
 *       500:
 *         description: Server error.
 */
router.post('/art-publication', authenticate, signalArtPublication);

export default router;
