import { Order } from "../../models/orderModel.mjs";
import { ArtPublication } from "../../models/artPublicationModel.mjs";
import { createAndSendNotification } from "../notification/notificationController.mjs";
import stripe from '../../utils/stripeClient.mjs';
import db from "../../config/db.mjs";

export const createOrder = async (req, res) => {
  const BASE_WEB_URL = process.env.BASE_WEB_URL || "localhost:3000";
  try {
    const { artPublicationId } = req.body;
    const buyerId = req.user.id;
    const artPublication = await ArtPublication.findById(artPublicationId);

    if (!artPublication || !artPublication.isForSale || artPublication.isSold) {
      return res.status(400).json({ msg: "Art publication not available for sale" });
    }

    // Vérifier si une commande payée existe déjà pour cette publication
    const existingOrder = await Order.findOne({
      artPublicationId: artPublication._id,
      paymentStatus: "paid",
    });

    if (existingOrder) {
      /* istanbul ignore next */ return res.status(400).json({ msg: "This art has already been sold" });
    }

    const sellerId = artPublication.userId;

    // Créer d'abord l'objet newOrder
    const newOrder = new Order({
      artPublicationId,
      buyerId,
      sellerId,
      orderPrice: artPublication.price,
      paymentStatus: "paid",
      orderRating: null, // Initialize optional fields to null
      stripePaymentIntentId: null,
      stripeSessionId: null,
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
      success_url: `${BASE_WEB_URL}/single/${artPublicationId}/success`,
      cancel_url: `${BASE_WEB_URL}/single/${artPublicationId}/canceled`,
    });

    // Enregistrer l'ID de la session de paiement dans la commande
    await Order.updateById(newOrder.id, { stripeSessionId: session.id });

    res.status(201).json({
      msg: "Order created and Stripe Checkout session initiated",
      order: newOrder,
      url: session.url,
    });
  } catch (err) /* istanbul ignore next */ {
    console.error(err.message);
    res.status(500).json({ msg: "Server Error" });
  }
};

export const updateOrderToShipping = async (req, res) => {
  try /* istanbul ignore next */ {
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
      /* istanbul ignore next */ return res
        .status(400)
        .json({ msg: "Order must be in paid state to mark as shipping" });
    }

    await Order.updateById(order.id, { orderState: "shipping", });

    // Send notification to the buyer about the order shipping status
    createAndSendNotification({
      recipientId: order.buyerId,
      type: "order_shipping",
      content: ` `,
      referenceId: order.id,
      description: `The seller marked your order as currently in shipping`,
      sendPush: true,
    });

    res.json({ msg: "Order updated to shipping state", order });
  } catch (err) /* istanbul ignore next */ {
    console.error(err.message);
    res.status(500).json({ msg: "Server Error" });
  }
};

export const getLatestBuyOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = Number(req.query.limit) || parseInt(process.env.DEFAULT_PAGE_LIMIT, 10);
    const page = Number(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const buyOrders = await Order.findWithOrder({
      buyerId: userId,
      paymentStatus: { $in: ["paid", "refunded"] }
    }, 'createdAt', 'desc', limit, skip);

    const formattedOrders = await Promise.all(buyOrders.map(async (order) => {
      const artPublicationDoc = await db.collection('ArtPublications').doc(order.artPublicationId).get();
      if (!artPublicationDoc.exists) {
        throw new Error(`Art publication with ID ${order.artPublicationId} not found`);
      }
      const artPublication = artPublicationDoc.data();

      return {
        orderId: order.id,
        buyerId: order.buyerId,
        buyerName: order.buyerName,
        sellerId: order.sellerId,
        sellerName: order.sellerName,
        orderState: order.orderState,
        paymentStatus: order.paymentStatus,
        orderPrice: order.orderPrice,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        artPublicationId: order.artPublicationId,
        artPublicationName: artPublication.name,
        artPublicationDescription: artPublication.description,
        artPublicationPrice: artPublication.price,
        artPublicationImage: artPublication.image,
      };
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
    const limit = Number(req.query.limit) || parseInt(process.env.DEFAULT_PAGE_LIMIT, 10);
    const page = Number(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const sellOrders = await Order.findWithOrder({
      sellerId: userId,
      paymentStatus: { $in: ["paid", "refunded"] }
    }, 'createdAt', 'desc', limit, skip);

    const formattedOrders = await Promise.all(sellOrders.map(async (order) => {
      const artPublicationDoc = await db.collection('ArtPublications').doc(order.artPublicationId).get();
      if (!artPublicationDoc.exists) {
        throw new Error(`Art publication with ID ${order.artPublicationId} not found`);
      }
      const artPublication = artPublicationDoc.data();

      return {
        orderId: order.id,
        buyerId: order.buyerId,
        buyerName: order.buyerName,
        sellerId: order.sellerId,
        sellerName: order.sellerName,
        orderState: order.orderState,
        paymentStatus: order.paymentStatus,
        orderPrice: order.orderPrice,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        artPublicationId: order.artPublicationId,
        artPublicationName: artPublication.name,
        artPublicationDescription: artPublication.description,
        artPublicationPrice: artPublication.price,
        artPublicationImage: artPublication.image,
      };
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

    // Simplified query to find the order
    let order = await Order.findOne({
      _id: orderId,
      buyerId: userId,
      paymentStatus: "paid", // Check for "paid" first
    });

    if (!order) {
      order = await Order.findOne({
        _id: orderId,
        buyerId: userId,
        paymentStatus: "refunded", // Check for "refunded" next
      });

      if (!order) {
        return res.status(404).json({ msg: "Order not found" });
      }
    }

    // Fetching related artPublication and seller details
    const artPublicationDoc = await db.collection('ArtPublications').doc(order.artPublicationId).get();
    if (!artPublicationDoc.exists) {
      return res.status(404).json({ msg: "Art publication not found" });
    }
    const artPublication = artPublicationDoc.data();

    const sellerDoc = await db.collection('Users').doc(order.sellerId).get();
    if (!sellerDoc.exists) {
      return res.status(404).json({ msg: "Seller not found" });
    }
    const seller = sellerDoc.data();

    const formattedOrder = {
      orderId: order._id,
      orderState: order.orderState,
      orderPrice: order.orderPrice,
      artPublicationId: order.artPublicationId,
      artPublicationName: artPublication.name,
      artPublicationDescription: artPublication.description,
      artPublicationPrice: artPublication.price,
      artPublicationImage: artPublication.image,
      sellerId: order.sellerId,
      sellerName: seller.username,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      buyerId: order.buyerId,
      buyerName: req.user.username // Assuming req.user has the buyer's username
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

    // Simplified query to find the order
    let order = await Order.findOne({
      _id: orderId,
      sellerId: userId,
      paymentStatus: "paid", // Check for "paid" first
    });

    if (!order) {
      order = await Order.findOne({
        _id: orderId,
        sellerId: userId,
        paymentStatus: "refunded", // Check for "refunded" next
      });

      if (!order) {
        return res.status(404).json({ msg: "Order not found" });
      }
    }

    // Fetching related artPublication and buyer details
    const artPublicationDoc = await db.collection('ArtPublications').doc(order.artPublicationId).get();
    if (!artPublicationDoc.exists) {
      return res.status(404).json({ msg: "Art publication not found" });
    }
    const artPublication = artPublicationDoc.data();

    const buyerDoc = await db.collection('Users').doc(order.buyerId).get();
    if (!buyerDoc.exists) {
      return res.status(404).json({ msg: "Buyer not found" });
    }
    const buyer = buyerDoc.data();

    const formattedOrder = {
      orderId: order._id,
      orderState: order.orderState,
      orderPrice: order.orderPrice,
      artPublicationId: order.artPublicationId,
      artPublicationName: artPublication.name,
      artPublicationDescription: artPublication.description,
      artPublicationPrice: artPublication.price,
      artPublicationImage: artPublication.image,
      buyerId: order.buyerId,
      buyerName: buyer.username,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      sellerId: order.sellerId,
      sellerName: req.user.username // Assuming req.user has the seller's username
    };

    res.json(formattedOrder);
  } catch (err) /* istanbul ignore next */ {
    console.error(err.message);
    res.status(500).json({ msg: "Server Error" });
  }
};


export const cancelOrder = async (req, res) => /* istanbul ignore next */ {
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
    await Order.updateById(order.id, {
      orderState: "cancelled",
      paymentStatus: order.paymentStatus === "paid" ? "refunded" : "pending",
    });

    // If the artPublication is not sold to someone else, set it as unsold
    const artPublication = await ArtPublication.findById(order.artPublicationId);
    if (artPublication && artPublication.isSold) {
      const otherPaidOrder = await Order.findOne({
        artPublicationId: order.artPublicationId,
        paymentStatus: "paid",
        _id: { $ne: orderId },
      });

      if (!otherPaidOrder) {
        await ArtPublication.updateById(artPublication.id, { isSold: false });
      }
    }

    // Notify the seller (current user)
    createAndSendNotification({
      recipientId: order.sellerId,
      type: "order_cancelled",
      content: ` `,
      referenceId: order._id,
      description: `You just cancelled an order`,
      sendPush: true,
    });

    // Notify the buyer
    createAndSendNotification({
      recipientId: order.buyerId,
      type: "order_cancelled",
      content: ` `,
      referenceId: order._id,
      description: `One of your order was cancelled`,
      sendPush: true,
    });

    res.json({ msg: "Order cancelled successfully", order });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server Error" });
  }
};

async function refundOrder(orderId) /* istanbul ignore next */ {
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

  await Order.updateById(order.id, { paymentStatus: "refunded" });

  return order;
}

export const confirmDeliveryAndRateOrder = async (req, res) => {
  try /* istanbul ignore next */ {
    const { orderId, rating } = req.body;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ msg: "Order not found" });
    }
    if (order.buyerId.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Unauthorized" });
    }

    await Order.updateById(order.id, {
      orderState: "completed",
      orderRating: rating,
    });

    // Notify the seller
    createAndSendNotification({
      recipientId: order.sellerId,
      type: "order_completed",
      content: `${rating}`,
      referenceId: order._id,
      description: `One of your Order is completed ! You got a rating of ${rating} stars !`,
      sendPush: true,
    });

    res.json({ msg: "Order completed and rated successfully", order });
  } catch (err) /* istanbul ignore next */ {
    console.error(err.message);
    res.status(500).json({ msg: "Server Error" });
  }
};