import { Order } from "../../models/orderModel.mjs";
import { createAndSendNotification } from "../notification/notificationController.mjs";
import stripe from '../../utils/stripeClient.mjs';
import db from "../../config/db.mjs";
import logger from '../../admin/logger.mjs';

export const createOrder = async (req, res) => {
  const BASE_WEB_URL = process.env.BASE_WEB_URL || "localhost:3000";
  try {
    const { artPublicationId } = req.body;
    const buyerId = req.user.id;
    const artPublicationDoc = await db.collection('ArtPublications').doc(artPublicationId).get();
    const artPublication = artPublicationDoc.data();

    if (!artPublication || !artPublication.isForSale || artPublication.isSold) {
      return res.status(400).json({ msg: "Art publication not available for sale" });
    }

    const existingOrderSnapshot = await db.collection('Orders')
      .where('artPublicationId', '==', artPublicationId)
      .where('paymentStatus', '==', 'paid')
      .limit(1)
      .get();

    if (!existingOrderSnapshot.empty) {
      return res.status(400).json({ msg: "This art has already been sold" });
    }

    const sellerId = artPublication.userId;

    const newOrder = new Order({
      artPublicationId,
      buyerId,
      sellerId,
      orderPrice: artPublication.price,
      paymentStatus: "paid",
    });

    const orderRef = db.collection('Orders').doc(newOrder.id);
    await orderRef.set(newOrder.toJSON());

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: artPublication.name,
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

    await orderRef.update({ stripeSessionId: session.id });

    res.status(201).json({
      msg: "Order created and Stripe Checkout session initiated",
      order: newOrder,
      url: session.url,
    });
  } catch (err) {
    logger.error('Error creating order:', { error: err.message, stack: err.stack});
    res.status(500).json({ msg: "Server Error" });
  }
};

export const updateOrderToShipping = async (req, res) => {
  try {
    const { orderId } = req.body;
    const sellerId = req.user.id;

    const orderRef = db.collection('Orders').doc(orderId);
    const orderDoc = await orderRef.get();
    const order = orderDoc.data();

    if (!order) {
      return res.status(404).json({ msg: "Order not found" });
    }

    if (order.sellerId !== sellerId) {
      return res.status(403).json({ msg: "Unauthorized: Only the seller can update the order" });
    }

    if (order.orderState !== "paid") {
      return res.status(400).json({ msg: "Order must be in paid state to mark as shipping" });
    }

    await orderRef.update({ orderState: "shipping", updatedAt: new Date().toISOString() });

    createAndSendNotification({
      recipientId: order.buyerId,
      type: "order_shipping",
      content: ` `,
      referenceId: orderId,
      description: `The seller marked your order as currently in shipping`,
      sendPush: true,
    });

    res.json({ msg: "Order updated to shipping state", order: { ...order, orderState: "shipping" } });
  } catch (err) {
    logger.error('Error updating order to shipping:', { error: err.message, stack: err.stack});
    res.status(500).json({ msg: "Server Error" });
  }
};

export const getLatestBuyOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = Number(req.query.limit) || parseInt(process.env.DEFAULT_PAGE_LIMIT, 10);
    const page = Number(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const buyOrdersSnapshot = await db.collection('Orders')
      .where('buyerId', '==', userId)
      .where('paymentStatus', 'in', ["paid", "refunded"])
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .offset(skip)
      .get();

      const formattedOrders = await Promise.all(buyOrdersSnapshot.docs.map(async (doc) => {
        const order = doc.data();
        
        // Fetch the art publication
        const artPublicationDoc = await db.collection('ArtPublications').doc(order.artPublicationId).get();
        const artPublication = artPublicationDoc.exists ? artPublicationDoc.data() : null;
        
        return {
          orderId: order.id,
          buyerId: order.buyerId,
          sellerId: order.sellerId,
          orderState: order.orderState,
          paymentStatus: order.paymentStatus,
          orderPrice: order.orderPrice,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          
          // Use default values if artPublication is not found
          artPublicationId: order.artPublicationId,
          artPublicationName: artPublication ? artPublication.name : "Unknown",
          artPublicationDescription: artPublication ? artPublication.description : "No description available",
          artPublicationPrice: artPublication ? artPublication.price : order.orderPrice,
          artPublicationImage: artPublication ? artPublication.image : 'uploads/default-image-art.jpg',
          
          // Order rating might not exist, provide a default value
          orderRating: order.orderRating || 0,
        };
      }));
      

    res.json(formattedOrders);
  } catch (err) {
    logger.error('Error getting latest buy orders:', { error: err.message, stack: err.stack});
    res.status(500).json({ msg: "Server Error" });
  }
};

export const getLatestSellOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = Number(req.query.limit) || parseInt(process.env.DEFAULT_PAGE_LIMIT, 10);
    const page = Number(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const sellOrdersSnapshot = await db.collection('Orders')
      .where('sellerId', '==', userId)
      .where('paymentStatus', 'in', ["paid", "refunded"])
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .offset(skip)
      .get();

    const formattedOrders = await Promise.all(sellOrdersSnapshot.docs.map(async (doc) => {
      const order = doc.data();
      const artPublicationDoc = await db.collection('ArtPublications').doc(order.artPublicationId).get();
      const artPublication = artPublicationDoc.data();

      return {
        orderId: order.id,
        buyerId: order.buyerId,
        sellerId: order.sellerId,
        orderState: order.orderState,
        paymentStatus: order.paymentStatus,
        orderPrice: order.orderPrice,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        // Use default values if artPublication is not found
        artPublicationId: order.artPublicationId,
        artPublicationName: artPublication ? artPublication.name : "Unknown",
        artPublicationDescription: artPublication
          ? artPublication.description
          : "No description available",
        artPublicationPrice: artPublication
          ? artPublication.price
          : order.orderPrice,
        artPublicationImage: artPublication
          ? artPublication.image
          : "uploads/default-image-art.jpg",

        // Order rating might not exist, provide a default value
        orderRating: order.orderRating || 0,
      };
    }));

    res.json(formattedOrders);
  } catch (err) {
    logger.error('Error getting latest sell orders:', { error: err.message, stack: err.stack});
    res.status(500).json({ msg: "Server Error" });
  }
};

export const getBuyOrderById = async (req, res) => {
  try {
    const orderId = req.params.id;
    const userId = req.user.id;

    const orderDoc = await db.collection('Orders')
      .where('id', '==', orderId)
      .where('buyerId', '==', userId)
      .where('paymentStatus', 'in', ['paid', 'refunded'])
      .limit(1)
      .get();

    if (orderDoc.empty) {
      return res.status(404).json({ msg: "Order not found" });
    }

    const order = orderDoc.docs[0].data();
    const artPublicationDoc = await db.collection('ArtPublications').doc(order.artPublicationId).get();
    const artPublication = artPublicationDoc.exists ? artPublicationDoc.data() : null;
    const sellerDoc = await db.collection('Users').doc(order.sellerId).get();
    const seller = sellerDoc.data();

    const formattedOrder = {
      orderId: order.id,
      orderState: order.orderState,
      orderPrice: order.orderPrice,
      sellerId: order.sellerId,
      sellerName: seller.username,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      buyerId: order.buyerId,
      buyerName: req.user.username,
      // Use default values if artPublication is not found
      artPublicationId: order.artPublicationId,
      artPublicationName: artPublication ? artPublication.name : "Unknown",
      artPublicationDescription: artPublication
        ? artPublication.description
        : "No description available",
      artPublicationPrice: artPublication
        ? artPublication.price
        : order.orderPrice,
      artPublicationImage: artPublication
        ? artPublication.image
        : "uploads/default-image-art.jpg",

      // Order rating might not exist, provide a default value
      orderRating: order.orderRating || 0,
    };

    res.json(formattedOrder);
  } catch (err) {
    logger.error('Error getting buy order by id:', { error: err.message, stack: err.stack});
    res.status(500).json({ msg: "Server Error" });
  }
};

export const getSellOrderById = async (req, res) => {
  try {
    const orderId = req.params.id;
    const userId = req.user.id;

    const orderDoc = await db.collection('Orders')
      .where('id', '==', orderId)
      .where('sellerId', '==', userId)
      .where('paymentStatus', 'in', ['paid', 'refunded'])
      .limit(1)
      .get();

    if (orderDoc.empty) {
      return res.status(404).json({ msg: "Order not found" });
    }

    const order = orderDoc.docs[0].data();
    const artPublicationDoc = await db.collection('ArtPublications').doc(order.artPublicationId).get();
    const artPublication = artPublicationDoc.exists ? artPublicationDoc.data() : null;
    const buyerDoc = await db.collection('Users').doc(order.buyerId).get();
    const buyer = buyerDoc.data();

    const formattedOrder = {
      orderId: order.id,
      orderState: order.orderState,
      orderPrice: order.orderPrice,
      buyerId: order.buyerId,
      buyerName: buyer.username,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      sellerId: order.sellerId,
      sellerName: req.user.username,
      // Use default values if artPublication is not found
      artPublicationId: order.artPublicationId,
      artPublicationName: artPublication ? artPublication.name : "Unknown",
      artPublicationDescription: artPublication
        ? artPublication.description
        : "No description available",
      artPublicationPrice: artPublication
        ? artPublication.price
        : order.orderPrice,
      artPublicationImage: artPublication
        ? artPublication.image
        : "uploads/default-image-art.jpg",

      // Order rating might not exist, provide a default value
      orderRating: order.orderRating || 0,
    };

    res.json(formattedOrder);
  } catch (err) {
    logger.error('Error getting sell order by id:', { error: err.message, stack: err.stack});
    res.status(500).json({ msg: "Server Error" });
  }
};

export const cancelOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const orderDoc = await db.collection('Orders').doc(orderId).get();
    const order = orderDoc.data();

    if (!order) {
      return res.status(404).json({ msg: "Order not found" });
    }

    if (order.sellerId !== req.user.id) {
      return res.status(403).json({ msg: "Unauthorized" });
    }

    if (order.paymentStatus === "paid") {
      await refundOrder(orderId);
    }

    await db.collection('Orders').doc(orderId).update({
      orderState: "cancelled",
      paymentStatus: order.paymentStatus === "paid" ? "refunded" : "pending",
      updatedAt: new Date().toISOString(),
    });

    const artPublicationDoc = await db.collection('ArtPublications').doc(order.artPublicationId).get();
    const artPublication = artPublicationDoc.data();
    if (artPublication && artPublication.isSold) {
      const otherPaidOrderSnapshot = await db.collection('Orders')
        .where('artPublicationId', '==', order.artPublicationId)
        .where('paymentStatus', '==', 'paid')
        .where('id', '!=', orderId)
        .limit(1)
        .get();

      if (otherPaidOrderSnapshot.empty) {
        await db.collection('ArtPublications').doc(order.artPublicationId).update({ isSold: false });
      }
    }

    createAndSendNotification({
      recipientId: order.sellerId,
      type: "order_cancelled",
      content: ` `,
      referenceId: order.id,
      description: `You just cancelled an order`,
      sendPush: true,
    });

    createAndSendNotification({
      recipientId: order.buyerId,
      type: "order_cancelled",
      content: ` `,
      referenceId: order.id,
      description: `One of your orders was cancelled`,
      sendPush: true,
    });

    res.json({ msg: "Order cancelled successfully", order });
  } catch (err) {
    logger.error('Error cancelling order:', { error: err.message, stack: err.stack});
    res.status(500).json({ msg: "Server Error" });
  }
};

async function refundOrder(orderId) {
  const orderDoc = await db.collection('Orders').doc(orderId).get();
  const order = orderDoc.data();
  if (!order) throw new Error("Order not found");

  const session = await stripe.checkout.sessions.retrieve(order.stripeSessionId);
  if (!session || !session.payment_intent) {
    throw new Error("No payment intent found for this order");
  }

  await stripe.refunds.create({
    payment_intent: session.payment_intent,
  });

  await db.collection('Orders').doc(order.id).update({ paymentStatus: "refunded" });

  return order;
}

export const confirmDeliveryAndRateOrder = async (req, res) => {
  try {
    const { orderId, rating } = req.body;
    const orderDoc = await db.collection('Orders').doc(orderId).get();
    const order = orderDoc.data();

    if (!order) {
      return res.status(404).json({ msg: "Order not found" });
    }
    if (order.buyerId !== req.user.id) {
      return res.status(403).json({ msg: "Unauthorized" });
    }

    await db.collection('Orders').doc(order.id).update({
      orderState: "completed",
      orderRating: rating,
      updatedAt: new Date().toISOString(),
    });

    createAndSendNotification({
      recipientId: order.sellerId,
      type: "order_completed",
      content: `${rating}`,
      referenceId: order.id,
      description: `One of your orders is completed! You got a rating of ${rating} stars!`,
      sendPush: true,
    });

    res.json({ msg: "Order completed and rated successfully", order: { ...order, orderState: "completed", orderRating: rating } });
  } catch (err) {
    logger.error('Error confirming delivery and rating order:', { error: err.message, stack: err.stack});
    res.status(500).json({ msg: "Server Error" });
  }
};
