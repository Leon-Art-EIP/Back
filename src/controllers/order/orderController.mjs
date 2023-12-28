// src/controllers/orderController.mjs

import { Order } from '../../models/orderModel.mjs';
import { ArtPublication } from '../../models/artPublicationModel.mjs';
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_...';

export const createOrder = async (req, res) => {
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
        return res.status(400).json({ msg: "This art has already been sold" });
      }
  
      const sellerId = artPublication.userId;
  
      // Créer d'abord l'objet newOrder
      const newOrder = new Order({
        artPublicationId,
        buyerId,
        sellerId,
        orderPrice: artPublication.price,
        paymentStatus: 'pending'
      });
      await newOrder.save();
  
      // Ensuite, créer l'intention de paiement Stripe avec l'ID de la commande
      const paymentIntent = await stripe.paymentIntents.create({
        amount: artPublication.price * 100,
        currency: "eur",
        payment_method_types: ["card"],
        metadata: { orderId: newOrder._id.toString() },
      });
  
      // Mettre à jour la commande avec l'ID de l'intention de paiement
      newOrder.stripePaymentIntentId = paymentIntent.id;
      await newOrder.save();
  
      res.status(201).json({
        msg: 'Order created successfully',
        order: {
          id: newOrder._id,
          artPublicationId: newOrder.artPublicationId,
          buyerId: newOrder.buyerId,
          sellerId: newOrder.sellerId,
          orderState: newOrder.orderState,
          orderPrice: newOrder.orderPrice,
          stripePaymentIntentId: newOrder.stripePaymentIntentId,
        },
        clientSecret: paymentIntent.client_secret,
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ msg: 'Server Error' });
    }
  };
  

export const handleStripeWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    // Choisissez la clé secrète de webhook appropriée
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET_DEV || process.env.STRIPE_WEBHOOK_SECRET;
  
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  
    if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        const orderId = paymentIntent.metadata.orderId;

        try {
            const order = await Order.findById(orderId);
            if (!order) {
                return res.status(404).send('Order not found');
            }

            // Vérifier s'il existe une autre commande payée pour la même publication d'art
            const existingPaidOrder = await Order.findOne({
                _id: { $ne: order._id },
                artPublicationId: order.artPublicationId,
                paymentStatus: 'paid'
            });

            if (existingPaidOrder) {
                // Rembourser la commande car la publication a déjà été vendue
                await refundOrder(order._id);
                return res.status(200).json({ received: true, action: 'refunded' });
            }

            const artPublication = await ArtPublication.findById(order.artPublicationId);
            if (artPublication && !artPublication.isSold) {
              artPublication.isSold = true;
              await artPublication.save();
            }

            order.paymentStatus = 'paid';
            await order.save();
        } catch (err) {
            console.error(err);
            return res.status(500).send('Internal Server Error');
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
                                   .limit(limit);
  
      res.json(buyOrders);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ msg: 'Server Error' });
    }
  };
  
  export const getLatestSellOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        const limit = Number(req.query.limit) || process.env.DEFAULT_PAGE_LIMIT;
        const page = Number(req.query.page) || 1;
        const skip = (page - 1) * limit;

        const sellOrders = await Order.find({ sellerId: userId, paymentStatus: 'paid' })
                                      .sort({ createdAt: -1 })
                                      .skip(skip)
                                      .limit(limit);

        res.json(sellOrders);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};
  
  export const getBuyOrderById = async (req, res) => {
    try {
      const orderId = req.params.id;
      const userId = req.user.id;
  
      const order = await Order.findOne({ _id: orderId, buyerId: userId });
      if (!order) {
        return res.status(404).json({ msg: 'Order not found' });
      }
  
      res.json(order);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ msg: 'Server Error' });
    }
  };
  
  export const getSellOrderById = async (req, res) => {
    try {
        const orderId = req.params.id;
        const userId = req.user.id;

        const order = await Order.findOne({ _id: orderId, sellerId: userId, paymentStatus: 'paid' });
        if (!order) {
            return res.status(404).json({ msg: 'Order not found' });
        }

        res.json(order);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};
  
  export const cancelOrder = async (req, res) => {
    try {
      const orderId = req.params.id;
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ msg: 'Order not found' });
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
  
      res.json({ msg: 'Order cancelled successfully', order });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ msg: 'Server Error' });
    }
  };
  
  export const confirmDeliveryAndRateOrder = async (req, res) => {
    try {
      const { orderId, rating } = req.body;
      const order = await Order.findById(orderId);
  
      if (!order) {
        return res.status(404).json({ msg: 'Order not found' });
      }
      if (order.buyerId.toString() !== req.user.id) {
        return res.status(403).json({ msg: 'Unauthorized' });
      }
  
      order.orderState = 'completed';
      order.orderRating = rating;
      await order.save();
  
      res.json({ msg: 'Order completed and rated successfully', order });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ msg: 'Server Error' });
    }
  };
  
  async function refundOrder(orderId) {
    const order = await Order.findById(orderId);
    if (!order) throw new Error('Order not found');
    
    if (!order.stripePaymentIntentId) throw new Error('No payment intent found for this order');
    
    await stripe.refunds.create({
      payment_intent: order.stripePaymentIntentId,
    });
  
    order.paymentStatus = 'refunded';
    await order.save();
  
    return order;
  }