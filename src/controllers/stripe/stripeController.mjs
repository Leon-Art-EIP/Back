import db from '../../config/db.mjs';
import { v4 as uuidv4 } from 'uuid';
import stripe from '../../utils/stripeClient.mjs';
import { socketManager } from '../../app.mjs';
import { createAndSendNotification } from "../notification/notificationController.mjs";
import logger from '../../admin/logger.mjs';

export const handleStripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    logger.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const session = event.data.object;
  const account = event.data.object;

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(session);
        break;
      case 'account.updated':
        await handleAccountUpdated(account);
        break;
      default:
        logger.info(`Unhandled event type ${event.type}`);
    }
    res.status(200).json({ received: true });
  } catch (error) {
    logger.error(`Error handling event ${event.type}: ${error.message}`);
    res.status(500).json({ msg: "Server Error" });
  }
};

const handleCheckoutSessionCompleted = async (session) => {
  if (!session || !session.id) {
    throw new Error("Invalid session data");
  }

  const orderSnapshot = await db.collection('Orders').where('stripeSessionId', '==', session.id).limit(1).get();
  if (orderSnapshot.empty) throw new Error("Order not found");

  const orderRef = orderSnapshot.docs[0].ref;
  const order = orderSnapshot.docs[0].data();

  logger.info(`Session ID: ${session.id}`);
logger.info(`Order Data: ${JSON.stringify(order)}`);

  if (!order.artPublicationId || !order.id) {
    throw new Error("Invalid order data");
  }

  const existingPaidOrderSnapshot = await db.collection('Orders')
    .where('artPublicationId', '==', order.artPublicationId)
    .where('paymentStatus', '==', 'paid')
    .where('_id', '!=', order.id)
    .limit(1)
    .get();

  if (!existingPaidOrderSnapshot.empty) {
    await refundOrder(order.id);
    return;
  }

  const artPublicationRef = db.collection('ArtPublications').doc(order.artPublicationId);
  await artPublicationRef.update({ isSold: true });

  await orderRef.update({ paymentStatus: "paid", orderState: "paid" });

  await createAndSendNotification({
    recipientId: order.sellerId,
    type: "payment_success",
    content: ` `,
    referenceId: order.id,
    description: `Someone just bought one of your publication!`,
    sendPush: true,
  });

  await createAndSendNotification({
    recipientId: order.buyerId,
    type: "order_processing",
    content: ` `,
    referenceId: order.id,
    description: `Your Payment has been received. The seller will proceed with the next steps.`,
    sendPush: true,
  });

  socketManager.handleRefreshOrders(order.sellerId);
};



const handleAccountUpdated = async (account) => {
  const userSnapshot = await db.collection('Users').where('metadata.userId', '==', account.metadata.userId).limit(1).get();
  if (userSnapshot.empty) throw new Error("User not found for the Stripe account");

  const userRef = userSnapshot.docs[0].ref;
  await userRef.update({ stripeAccountId: account.id });
  logger.info(`User linked Stripe account ${account.id}`);
};

export const createStripeAccountLink = async (req, res) => {
  try {
    const userId = req.user.id;
    const source = req.body.source;
    const userRef = db.collection('Users').doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) return res.status(404).json({ msg: 'User not found' });

    const user = userDoc.data();
    let account;

    if (user.stripeAccountId) {
      account = await stripe.accounts.retrieve(user.stripeAccountId);
      if (account.details_submitted) {
        return res.status(400).json({ msg: 'User already has a Stripe account linked' });
      } else {
        await stripe.accounts.del(user.stripeAccountId);
        await userRef.update({ stripeAccountId: null });
      }
    }

    account = await stripe.accounts.create({
      type: 'express',
      metadata: { userId: userId.toString() },
      business_type: 'individual',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    await userRef.update({ stripeAccountId: account.id });

    const refreshUrl = source === 'web' ? `${process.env.BASE_WEB_URL}/settings/me` : `${process.env.MOBILE_APP_URL_STRIPE_REDIRECT}`;
    const returnUrl = source === 'web' ? `${process.env.BASE_WEB_URL}/settings/me` : `${process.env.MOBILE_APP_URL_STRIPE_REDIRECT}`;

    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });

    res.json({ url: accountLink.url });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

export const checkStripeAccountLink = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRef = db.collection('Users').doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) return res.status(404).json({ msg: 'User not found' });

    const user = userDoc.data();
    if (!user.stripeAccountId) {
      return res.status(404).json({ msg: 'User has not linked a Stripe account' });
    }

    const account = await stripe.accounts.retrieve(user.stripeAccountId);
    res.status(200).json({ linked: account.details_submitted });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

const refundOrder = async (orderId) => {
  const orderSnapshot = await db.collection('Orders').doc(orderId).get();
  if (!orderSnapshot.exists) throw new Error("Order not found");

  const order = orderSnapshot.data();
  const session = await stripe.checkout.sessions.retrieve(order.stripeSessionId);
  if (!session || !session.payment_intent) throw new Error("No payment intent found for this order");

  await stripe.refunds.create({ payment_intent: session.payment_intent });
  await db.collection('Orders').doc(orderId).update({ paymentStatus: "refunded" });
};
