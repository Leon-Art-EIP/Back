import express from 'express';
import { createStripeAccountLink } from '../controllers/stripe/stripeController.mjs';
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
 *       500:
 *         description: Server error.
 */
router.post('/account-link', authenticate, createStripeAccountLink);

export default router;