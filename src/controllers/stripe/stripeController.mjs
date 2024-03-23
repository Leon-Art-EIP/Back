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
      content: `Your payment for order ${order._id} has been successfully processed.`,
      referenceId: order._id,
      sendPush: true,
    });

    // Optionally, notify the seller that the payment has been received and the order is now being processed
    createAndSendNotification({
      recipientId: order.sellerId,
      type: "order_processing",
      content: `Payment for order ${order._id} has been received. The order is now being processed.`,
      referenceId: order._id,
      sendPush: true,
    });
    res.status(200).json({ received: true });
  } else {
    // Handle other event types
    console.log(`Unhandled event type ${event.type}`);
    res.status(200).json({ received: true });
  }
};