import express from 'express';
import { createStripeAccountLink, checkStripeAccountLink } from '../controllers/stripe/stripeController.mjs';
import { authenticate } from "../middleware/authenticate.mjs";

const router = express.Router();

/**
 * @swagger
 * /api/stripe/account-link:
 *   post:
 *     summary: Create Stripe account link
 *     tags: [Stripe]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               source:
 *                 type: string
 *                 description: Source of the request ('web' or 'mobile').
 *     responses:
 *       200:
 *         description: Stripe account link created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                   description: URL to open in the webview to link the Stripe account.
 *       400:
 *         description: User already has a linked Stripe account.
 *       500:
 *         description: Server error.
 */
router.post('/account-link', authenticate, createStripeAccountLink);

/**
 * @swagger
 * /api/stripe/account-link-status:
 *   get:
 *     summary: Check if the user has a linked Stripe account
 *     tags: [Stripe]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Stripe account link status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 linked:
 *                   type: boolean
 *                   description: Indicates whether the user has a completely linked Stripe account or not
 *       '404':
 *         description: User has not linked a Stripe account
 *       '500':
 *         description: Server error
 */
router.get('/account-link-status', authenticate, checkStripeAccountLink);

export default router;