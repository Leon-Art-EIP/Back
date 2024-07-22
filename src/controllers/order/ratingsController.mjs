import db from '../../config/db.mjs';
import logger from '../../admin/logger.mjs';
import { v4 as uuidv4 } from 'uuid';
import { Order } from '../../models/orderModel.mjs';
import { User } from '../../models/userModel.mjs';

const calculateAverageRating = async (userId) => {
  const ordersSnapshot = await db.collection('Orders')
    .where('sellerId', '==', userId)
    .where('orderState', '==', 'completed')
    .get();

  if (ordersSnapshot.empty) {
    await db.collection('Users').doc(userId).update({ averageRating: null });
    return null;
  }

  const totalRatings = ordersSnapshot.docs.reduce((total, doc) => total + (doc.data().orderRating || 0), 0);
  const averageRating = totalRatings / ordersSnapshot.docs.length;

  await db.collection('Users').doc(userId).update({ averageRating });
  return averageRating;
};

export const confirmDeliveryAndRateOrder = async (req, res) => {
  try {
    const { orderId, rating, comment } = req.body;
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
      ratingComment: comment,
      completedAt: new Date().toISOString(),
    });

    const averageRating = await calculateAverageRating(order.sellerId);

    res.json({ msg: "Order completed and rated successfully", order: { ...order, orderState: "completed", orderRating: rating, ratingComment: comment }, averageRating });
  } catch (err) {
    logger.error('Error confirming delivery and rating order:', { error: err.message, stack: err.stack});
    res.status(500).json({ msg: "Server Error" });
  }
};

export const getUserRatings = async (req, res) => {
  try {
    const userId = req.params.id;
    const limit = Number(req.query.limit) || parseInt(process.env.DEFAULT_PAGE_LIMIT, 10);
    const page = Number(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const ratingsSnapshot = await db.collection('Orders')
      .where('sellerId', '==', userId)
      .where('orderState', '==', 'completed')
      .orderBy('completedAt', 'desc')
      .limit(limit)
      .offset(skip)
      .get();

    if (ratingsSnapshot.empty) {
      return res.json([]);
    }

    const ratings = [];
    const buyerIds = new Set();

    ratingsSnapshot.docs.forEach(doc => {
      const order = doc.data();
      ratings.push({
        orderId: order.id,
        rating: order.orderRating,
        comment: order.ratingComment,
        completedAt: order.completedAt,
        buyerId: order.buyerId,
      });
      buyerIds.add(order.buyerId);
    });

    const buyerDataPromises = Array.from(buyerIds).map(async (buyerId) => {
      const userDoc = await db.collection('Users').doc(buyerId).get();
      if (userDoc.exists) {
        const user = userDoc.data();
        return {
          id: user.id,
          username: user.username,
          profilePicture: user.profilePicture,
        };
      }
      return null;
    });

    const buyerData = await Promise.all(buyerDataPromises);
    const buyerDataMap = new Map(buyerData.filter(user => user !== null).map(user => [user.id, user]));

    const ratingsWithUserData = ratings.map(rating => ({
      ...rating,
      buyerUsername: buyerDataMap.get(rating.buyerId)?.username || 'Unknown',
      buyerProfilePicture: buyerDataMap.get(rating.buyerId)?.profilePicture || 'uploads/static/default-profile-pic.png',
    }));

    res.json(ratingsWithUserData);
  } catch (err) {
    logger.error('Error fetching user ratings:', { error: err.message, stack: err.stack });
    res.status(500).json({ msg: "Server Error" });
  }
};


export const getUserAverageRating = async (req, res) => {
  try {
    const userId = req.params.id;
    const userDoc = await db.collection('Users').doc(userId).get();

    if (!userDoc.exists) {
      return res.status(404).json({ msg: "User not found" });
    }

    const user = userDoc.data();
    res.json({ averageRating: user.averageRating });
  } catch (err) {
    logger.error('Error fetching user average rating:', { error: err.message, stack: err.stack});
    res.status(500).json({ msg: "Server Error" });
  }
};
