import Stripe from 'stripe';

const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripe = new Stripe(stripeKey);

export default stripe;