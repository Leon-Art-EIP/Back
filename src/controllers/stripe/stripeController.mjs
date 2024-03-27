import { User } from "../../models/userModel.mjs";
import { Order } from "../../models/orderModel.mjs";
import { ArtPublication } from "../../models/artPublicationModel.mjs";
import { createAndSendNotification } from "../notification/notificationController.mjs";
import stripe from '../../utils/stripeClient.mjs';

export const handleStripeWebhook = async (
  req,
  res
) => /* istanbul ignore next */ {
  const sig = req.headers["stripe-signature"];
  let event;

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.log("err.message = " + err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  // Handle the checkout.session.completed event
  if (event.type === "checkout.session.completed") {
    console.log("checkout.session.completed event detected");
    const session = event.data.object;

    // Find the order by the Stripe session ID
    const order = await Order.findOne({ stripeSessionId: session.id });
    if (!order) {
      return res.status(404).send("Order not found");
    }

    // Check for existing paid orders for the same art publication
    const existingPaidOrder = await Order.findOne({
      _id: { $ne: order._id },
      artPublicationId: order.artPublicationId,
      paymentStatus: "paid",
    });

    if (existingPaidOrder) {
      console.log("already existingPaidOrder");
      // Refund the order as the art publication has already been sold
      await refundOrder(order._id);
      return res.status(200).json({ received: true, action: "refunded" });
    }

    // Mark the art publication as sold
    const artPublication = await ArtPublication.findById(
      order.artPublicationId
    );
    if (artPublication && !artPublication.isSold) {
      artPublication.isSold = true;
      await artPublication.save();
    }

    // Update the order status
    order.paymentStatus = "paid";
    order.orderState = "paid";
    await order.save();

    // Notify the buyer about payment success
    createAndSendNotification({
      recipientId: order.buyerId,
      type: "payment_success",
      content: ` `,
      referenceId: order._id,
      description: `Someone just bought one of your publication !`,
      sendPush: true,
    });

    // Optionally, notify the seller that the payment has been received and the order is now being processed
    createAndSendNotification({
      recipientId: order.sellerId,
      type: "order_processing",
      content: ` `,
      referenceId: order._id,
      description: `Your Payment has been received, The seller will proceed with the next steps.`,
      sendPush: true,
    });
    res.status(200).json({ received: true });
  }
  
  // Handle the account.updated event
  else if (event.type === 'account.updated') {
    const account = event.data.object;

    // Find the user associated with the Stripe account
    const user = await User.findOne({ 'metadata.userId': account.metadata.userId });

    if (user) {
      // Update the user with the Stripe account ID
      user.stripeAccountId = account.id;
      await user.save();
      console.log(`User ${user.username} linked Stripe account ${account.id}`);
    } else {
      console.log('User not found for the Stripe account');
    }
  }
  
  else {
    // Handle other event types
    console.log(`Unhandled event type ${event.type}`);
    res.status(200).json({ received: true });
  }
};

export const createStripeAccountLink = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    // Check if the user already has a Stripe account ID
    if (user.stripeAccountId) {
      return res.status(400).json({ msg: 'User already has a Stripe account linked' });
    }

    const account = await stripe.accounts.create({
      type: 'express',
      metadata: {
        userId: userId.toString(),
      },
      business_type: 'individual',
      capabilities: {
        card_payments: {
          requested: true,
        },
        transfers: { requested: true },
      },
    });

    // Update the user with the Stripe account ID
    user.stripeAccountId = account.id;
    await user.save();

    // Create an account link for the onboarding process
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.BASE_WEB_URL}/account/stripe/reauth`,
      return_url: `${process.env.BASE_WEB_URL}/account/stripe/return`,
      type: 'account_onboarding',
    });

    res.json({ url: accountLink.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};