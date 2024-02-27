import { Order } from "../../models/orderModel.mjs";
import { ArtPublication } from "../../models/artPublicationModel.mjs";
import { createAndSendNotification } from "../notification/notificationController.mjs";
import Stripe from "stripe";
let stripe;

export const initializeStripe = (stripeKey) => {
  stripe = new Stripe(stripeKey);
};
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "whsec_...";

const BASE_WEB_URL = process.env.BASE_WEB_URL || "localhost:3000";

export const createOrder = async (req, res) => {
  try {
    const { artPublicationId } = req.body;
    const buyerId = req.user.id;
    const artPublication = await ArtPublication.findById(artPublicationId);

    if (!artPublication || !artPublication.isForSale || artPublication.isSold) {
      return res
        .status(400)
        .json({ msg: "Art publication not available for sale" });
    }

    // Vérifier si une commande payée existe déjà pour cette publication
    const existingOrder = await Order.findOne({
      artPublicationId: artPublication._id,
      paymentStatus: "paid",
    });

    if (existingOrder) {
      return res.status(400).json({ msg: "This art has already been sold" });
    }

    const sellerId = artPublication.userId;

    // Créer d'abord l'objet newOrder
    const newOrder = new Order({
      artPublicationId,
      buyerId,
      sellerId,
      orderPrice: artPublication.price,
      paymentStatus: "pending",
    });
    await newOrder.save();

    // Créer une session Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: artPublication.name, // ou autre nom de produit
            },
            unit_amount: artPublication.price * 100,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `http://${BASE_WEB_URL}/single/${artPublicationId}/success`,
      cancel_url: `http://${BASE_WEB_URL}/single/${artPublicationId}/canceled`,
    });

    // Enregistrer l'ID de la session de paiement dans la commande
    newOrder.stripeSessionId = session.id;
    await newOrder.save();

    res.status(201).json({
      msg: "Order created and Stripe Checkout session initiated",
      sessionId: session.id, // Envoyer l'ID de session au frontend
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server Error" });
  }
};

export const handleStripeWebhook = async (
  req,
  res
) => /* istanbul ignore next */ {
  const sig = req.headers["stripe-signature"];
  let event;

  const webhookSecret =
    process.env.STRIPE_WEBHOOK_SECRET_DEV || process.env.STRIPE_WEBHOOK_SECRET;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;
    const orderId = paymentIntent.metadata.orderId;

    try {
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).send("Order not found");
      }

      // Vérifier s'il existe une autre commande payée pour la même publication d'art
      const existingPaidOrder = await Order.findOne({
        _id: { $ne: order._id },
        artPublicationId: order.artPublicationId,
        paymentStatus: "paid",
      });

      if (existingPaidOrder) {
        // Rembourser la commande car la publication a déjà été vendue
        await refundOrder(order._id);
        return res.status(200).json({ received: true, action: "refunded" });
      }

      const artPublication = await ArtPublication.findById(
        order.artPublicationId
      );
      if (artPublication && !artPublication.isSold) {
        artPublication.isSold = true;
        await artPublication.save();
      }

      order.paymentStatus = "paid";

      await order.save();
      // Notify the buyer about payment success
      createAndSendNotification({
        recipientId: order.buyerId,
        type: "payment_success",
        content: `Your payment for order ${orderId} has been successfully processed.`,
        referenceId: order._id,
        sendPush: true,
      });

      // Optionally, notify the seller that the payment has been received and the order is now being processed
      createAndSendNotification({
        recipientId: order.sellerId,
        type: "order_processing",
        content: `Payment for order ${orderId} has been received. The order is now being processed.`,
        referenceId: order._id,
        sendPush: true,
      });
    } catch (err) /* istanbul ignore next */ {
      console.error(err);
      return res.status(500).send("Internal Server Error");
    }
  }

  res.status(200).json({ received: true });
};

export const getLatestBuyOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = Number(req.query.limit) || process.env.DEFAULT_PAGE_LIMIT;
    const page = Number(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const buyOrders = await Order.find({ buyerId: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("artPublicationId", "name description price image");

    const formattedOrders = buyOrders.map((order) => ({
      orderId: order._id,
      orderState: order.orderState,
      orderPrice: order.orderPrice,
      artPublicationName: order.artPublicationId.name,
      artPublicationDescription: order.artPublicationId.description,
      artPublicationPrice: order.artPublicationId.price,
      artPublicationImage: order.artPublicationId.image,
    }));

    res.json(formattedOrders);
  } catch (err) /* istanbul ignore next */ {
    console.error(err.message);
    res.status(500).json({ msg: "Server Error" });
  }
};

export const getLatestSellOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = Number(req.query.limit) || process.env.DEFAULT_PAGE_LIMIT;
    const page = Number(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const sellOrders = await Order.find({
      sellerId: userId,
      paymentStatus: "paid",
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("artPublicationId", "name description price image");

    const formattedOrders = sellOrders.map((order) => ({
      orderId: order._id,
      orderState: order.orderState,
      orderPrice: order.orderPrice,
      artPublicationName: order.artPublicationId.name,
      artPublicationDescription: order.artPublicationId.description,
      artPublicationPrice: order.artPublicationId.price,
      artPublicationImage: order.artPublicationId.image,
    }));

    res.json(formattedOrders);
  } catch (err) /* istanbul ignore next */ {
    console.error(err.message);
    res.status(500).json({ msg: "Server Error" });
  }
};

export const getBuyOrderById = async (req, res) => {
  try {
    const orderId = req.params.id;
    const userId = req.user.id;

    const order = await Order.findOne({ _id: orderId, buyerId: userId })
      .populate("artPublicationId", "name description price image")
      .populate("sellerId", "username");

    if (!order) {
      return res.status(404).json({ msg: "Order not found" });
    }

    const formattedOrder = {
      orderId: order._id,
      orderState: order.orderState,
      orderPrice: order.orderPrice,
      artPublicationName: order.artPublicationId.name,
      artPublicationDescription: order.artPublicationId.description,
      artPublicationPrice: order.artPublicationId.price,
      artPublicationImage: order.artPublicationId.image,
      sellerName: order.sellerId.username,
      sellerId: order.sellerId._id,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };

    res.json(formattedOrder);
  } catch (err) /* istanbul ignore next */ {
    console.error(err.message);
    res.status(500).json({ msg: "Server Error" });
  }
};

export const getSellOrderById = async (req, res) => {
  try {
    const orderId = req.params.id;
    const userId = req.user.id;

    const order = await Order.findOne({
      _id: orderId,
      sellerId: userId,
      paymentStatus: "paid",
    })
      .populate("artPublicationId", "name description price image")
      .populate("buyerId", "username");

    if (!order) {
      return res.status(404).json({ msg: "Order not found" });
    }

    const formattedOrder = {
      orderId: order._id,
      orderState: order.orderState,
      orderPrice: order.orderPrice,
      artPublicationName: order.artPublicationId.name,
      artPublicationDescription: order.artPublicationId.description,
      artPublicationPrice: order.artPublicationId.price,
      artPublicationImage: order.artPublicationId.image,
      buyerName: order.buyerId.username,
      buyerId: order.buyerId._id,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };

    res.json(formattedOrder);
  } catch (err) /* istanbul ignore next */ {
    console.error(err.message);
    res.status(500).json({ msg: "Server Error" });
  }
};

export const cancelOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ msg: "Order not found" });
    }
    if (order.sellerId.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Unauthorized" });
    }

    // Vérifier si l'état du paiement permet l'annulation
    if (order.paymentStatus === "paid") {
      await refundOrder(orderId);
      // Remettre la publication d'art en vente si la commande est annulée
      const artPublication = await ArtPublication.findById(
        order.artPublicationId
      );
      if (artPublication) {
        artPublication.isSold = false;
        await artPublication.save();
      }
    } else {
      order.orderState = "cancelled";
      await order.save();
      // Remettre la publication d'art en vente si la commande est annulée
      const artPublication = await ArtPublication.findById(
        order.artPublicationId
      );
      if (artPublication) {
        artPublication.isSold = false;
        await artPublication.save();
      }
    }

    // Notify the seller (current user)
    createAndSendNotification({
      recipientId: order.sellerId,
      type: "order_cancelled",
      content: `Your order ${order._id} has been cancelled.`,
      referenceId: order._id,
      sendPush: true,
    });

    // Notify the buyer
    createAndSendNotification({
      recipientId: order.buyerId,
      type: "order_cancelled",
      content: `Your order ${order._id} has been cancelled.`,
      referenceId: order._id,
      sendPush: true,
    });

    res.json({ msg: "Order cancelled successfully", order });
  } catch (err) /* istanbul ignore next */ {
    console.error(err.message);
    res.status(500).json({ msg: "Server Error" });
  }
};

export const confirmDeliveryAndRateOrder = async (req, res) => {
  try {
    const { orderId, rating } = req.body;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ msg: "Order not found" });
    }
    if (order.buyerId.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Unauthorized" });
    }

    order.orderState = "completed";
    order.orderRating = rating;
    await order.save();

    // Notify the seller
    createAndSendNotification({
      recipientId: order.sellerId,
      type: "order_completed",
      content: `Your order ${order._id} has been marked as completed${
        rating ? ` with a rating of ${rating}/5` : ""
      }.`,
      referenceId: order._id,
      sendPush: true,
    });

    res.json({ msg: "Order completed and rated successfully", order });
  } catch (err) /* istanbul ignore next */ {
    console.error(err.message);
    res.status(500).json({ msg: "Server Error" });
  }
};

async function refundOrder(orderId) {
  const order = await Order.findById(orderId);
  if (!order) throw new Error("Order not found");

  if (!order.stripePaymentIntentId)
    throw new Error("No payment intent found for this order");

  await stripe.refunds.create({
    payment_intent: order.stripePaymentIntentId,
  });

  order.paymentStatus = "refunded";
  await order.save();

  return order;
}
