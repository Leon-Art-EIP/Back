import express from 'express';
import { authenticate } from "../middleware/authenticate.mjs";
import { setupStripeAccount, getStripeAccount } from '../controllers/stripe/stripeController.mjs';

const router = express.Router();

router.post('/setup-stripe', authenticate, setupStripeAccount);
router.get('/get-stripe-account', authenticate, getStripeAccount);

export default router;