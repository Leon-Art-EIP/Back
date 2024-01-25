import { Order } from "../../models/orderModel.mjs";
import { ArtPublication } from "../../models/artPublicationModel.mjs";
import Stripe from "stripe";
let stripe;

export const initializeStripe = (stripeKey) => {
  stripe = new Stripe(stripeKey);
};

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
      url: session.url,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server Error" });
  }
};

export const handleStripeWebhook = async (req, res) => {
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
    console.log("checkout.session.completed TRIGGERED");
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
    console.log("TRANSACTION PAID !!!!");
    await order.save();

    res.status(200).json({ received: true });
  } else {
    // Handle other event types
    console.log(`Unhandled event type ${event.type}`);
    res.status(200).json({ received: true });
  }
};

export const updateOrderToShipping = async (req, res) => {
  try {
    const { orderId } = req.body; // Get orderId from request body
    const sellerId = req.user.id;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ msg: "Order not found" });
    }

    if (order.sellerId.toString() !== sellerId) {
      return res
        .status(403)
        .json({ msg: "Unauthorized: Only the seller can update the order" });
    }

    if (order.orderState !== "paid") {
      return res
        .status(400)
        .json({ msg: "Order must be in paid state to mark as shipping" });
    }

    order.orderState = "shipping";
    await order.save();

    res.json({ msg: "Order updated to shipping state", order });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server Error" });
  }
};

export const getLatestBuyOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = Number(req.query.limit) || process.env.DEFAULT_PAGE_LIMIT;
    const page = Number(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const buyOrders = await Order.find({
      buyerId: userId,
      paymentStatus: { $in: ["paid", "refunded"] }
    })
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
      paymentStatus: { $in: ["paid", "refunded"] }
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

    const order = await Order.findOne({
      _id: orderId,
      buyerId: userId,
      paymentStatus: { $in: ["paid", "refunded"] }
    })
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
      paymentStatus: { $in: ["paid", "refunded"] }
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

    // Only the seller can cancel the order
    if (order.sellerId.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Unauthorized" });
    }

    // If the order is already paid, initiate a refund
    if (order.paymentStatus === "paid") {
      // Refund through Stripe
      await refundOrder(order._id);
    }

    // Cancel the order in the database
    order.orderState = "cancelled";
    order.paymentStatus =
      order.paymentStatus === "paid" ? "refunded" : "pending";
    await order.save();

    // If the artPublication is not sold to someone else, set it as unsold
    const artPublication = await ArtPublication.findById(
      order.artPublicationId
    );
    if (artPublication && artPublication.isSold) {
      const otherPaidOrder = await Order.findOne({
        artPublicationId: order.artPublicationId,
        paymentStatus: "paid",
        _id: { $ne: orderId },
      });

      if (!otherPaidOrder) {
        artPublication.isSold = false;
        await artPublication.save();
      }
    }

    res.json({ msg: "Order cancelled successfully", order });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server Error" });
  }
};

async function refundOrder(orderId) {
  const order = await Order.findById(orderId);
  if (!order) throw new Error("Order not found");

  // Retrieve the Stripe Checkout session to get the payment intent
  const session = await stripe.checkout.sessions.retrieve(order.stripeSessionId);
  if (!session || !session.payment_intent) {
    throw new Error("No payment intent found for this order");
  }

  // Create a refund using the payment intent
  await stripe.refunds.create({
    payment_intent: session.payment_intent,
  });

  order.paymentStatus = 'refunded';
  await order.save();

  return order;
}


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

    res.json({ msg: "Order completed and rated successfully", order });
  } catch (err) /* istanbul ignore next */ {
    console.error(err.message);
    res.status(500).json({ msg: "Server Error" });
  }
};
