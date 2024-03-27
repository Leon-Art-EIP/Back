import Stripe from 'stripe';
import dotenv from 'dotenv';
dotenv.config();

const stripeKey = process.env.STRIPE_SECRET_KEY;
console.log(" process.env.STRIPE_SECRET_KEY = " +  process.env.STRIPE_SECRET_KEY);
const stripe = new Stripe(stripeKey);

export default stripe;