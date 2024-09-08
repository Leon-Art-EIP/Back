import { createAndSendNotification } from "../notification/notificationController.mjs";
import { FieldValue } from 'firebase-admin/firestore';
import db from '../../config/db.mjs';
import logger from '../../admin/logger.mjs';

export const followUser = async (req, res) => {
  const userId = req.user.id;
  const targetUserId = req.params.targetUserId;

  if (!targetUserId) {
    logger.warn(`Invalid user id: ${targetUserId}`);
    return res.status(400).json({ msg: "Invalid user id." });
  }

  try {
    const userRef = db.collection('Users').doc(userId);
    const targetUserRef = db.collection('Users').doc(targetUserId);

    const userDoc = await userRef.get();
    const targetUserDoc = await targetUserRef.get();

    if (!targetUserDoc.exists) {
      logger.warn(`User to follow not found: ${targetUserId}`);
      return res.status(404).json({ msg: "User to follow not found." });
    }
    if (userId === targetUserId) {
      logger.warn(`User tried to follow themselves: ${userId}`);
      return res.status(400).json({ msg: "You cannot follow yourself." });
    }

    const userData = userDoc.data();
    const targetUserData = targetUserDoc.data();

    const isAlreadyFollowing = userData.subscriptions.includes(targetUserId);

    if (isAlreadyFollowing) {
      await userRef.update({
        subscriptions: FieldValue.arrayRemove(targetUserId)
      });
      await targetUserRef.update({
        subscribers: FieldValue.arrayRemove(userId),
        subscribersCount: Math.max(0, targetUserData.subscribersCount - 1)
      });
      logger.info(`User ${userId} unfollowed ${targetUserId}`);
      return res.status(200).json({ msg: "Successfully unfollowed user." });
    } else {
      await userRef.update({
        subscriptions: FieldValue.arrayUnion(targetUserId)
      });
      await targetUserRef.update({
        subscribers: FieldValue.arrayUnion(userId),
        subscribersCount: targetUserData.subscribersCount + 1
      });

      // Notification for following
      createAndSendNotification({
        recipientId: targetUserId,
        type: "follow",
        content: `${userData.username}`,
        description: `Someone just followed your profile`,
        referenceId: userId,  // Send the userId of the person who followed as referenceId
        sendPush: true,
      });

      logger.info(`User ${userId} followed ${targetUserId}`);
      return res.status(200).json({ msg: "Successfully followed user." });
    }
  } catch (error) {
    logger.error(`Error in followUser: ${error.message}`, { error });
    return res.status(500).json({ msg: "Server error." });
  }
};

export const getUsersFollowing = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = Number(req.query.limit) || parseInt(process.env.DEFAULT_PAGE_LIMIT);
    const page = Number(req.query.page) || 1;

    const userDoc = await db.collection('Users').doc(userId).get();
    if (!userDoc.exists) {
      logger.warn(`User not found: ${userId}`);
      return res.status(404).json({ msg: "User not found." });
    }

    const userData = userDoc.data();
    const subscriptions = [];
    for (let i = (page - 1) * limit; i < Math.min(userData.subscriptions.length, page * limit); i++) {
      const subscriptionId = userData.subscriptions[i];
      const subscriptionDoc = await db.collection('Users').doc(subscriptionId).get();
      if (subscriptionDoc.exists) {
        const subscriptionData = subscriptionDoc.data();
        subscriptions.push({ id: subscriptionId, username: subscriptionData.username });
      }
    }

    res.json({ subscriptions, total: userData.subscriptions.length });
  } catch (error) {
    logger.error(`Error in getUsersFollowing: ${error.message}`, { error });
    return res.status(500).json({ msg: "Server error." });
  }
};

export const getUserFollowers = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = Number(req.query.limit) || parseInt(process.env.DEFAULT_PAGE_LIMIT);
    const page = Number(req.query.page) || 1;

    const userDoc = await db.collection('Users').doc(userId).get();
    if (!userDoc.exists) {
      logger.warn(`User not found: ${userId}`);
      return res.status(404).json({ msg: "User not found." });
    }

    const userData = userDoc.data();
    const subscribers = [];
    for (let i = (page - 1) * limit; i < Math.min(userData.subscribers.length, page * limit); i++) {
      const subscriberId = userData.subscribers[i];
      const subscriberDoc = await db.collection('Users').doc(subscriberId).get();
      if (subscriberDoc.exists) {
        const subscriberData = subscriberDoc.data();
        subscribers.push({ id: subscriberId, username: subscriberData.username });
      }
    }

    res.json({ subscribers, total: userData.subscribersCount });
  } catch (error) {
    logger.error(`Error in getUserFollowers: ${error.message}`, { error });
    return res.status(500).json({ msg: "Server error." });
  }
};

export const getFollowersOfSpecificUser = async (req, res) => {
  try {
    const targetUserId = req.params.targetUserId;
    const limit = Number(req.query.limit) || parseInt(process.env.DEFAULT_PAGE_LIMIT);
    const page = Number(req.query.page) || 1;

    const userDoc = await db.collection('Users').doc(targetUserId).get();
    if (!userDoc.exists) {
      logger.warn(`User not found: ${targetUserId}`);
      return res.status(404).json({ msg: "User not found." });
    }

    const userData = userDoc.data();
    const subscribers = [];
    for (let i = (page - 1) * limit; i < Math.min(userData.subscribers.length, page * limit); i++) {
      const subscriberId = userData.subscribers[i];
      const subscriberDoc = await db.collection('Users').doc(subscriberId).get();
      if (subscriberDoc.exists) {
        const subscriberData = subscriberDoc.data();
        subscribers.push({ id: subscriberId, username: subscriberData.username });
      }
    }

    res.json({ subscribers, total: userData.subscribersCount });
  } catch (error) {
    logger.error(`Error in getFollowersOfSpecificUser: ${error.message}`, { error });
    return res.status(500).json({ msg: "Server error." });
  }
};

export const getFollowedUsersOfSpecificUser = async (req, res) => {
  try {
    const targetUserId = req.params.targetUserId;
    const limit = Number(req.query.limit) || parseInt(process.env.DEFAULT_PAGE_LIMIT);
    const page = Number(req.query.page) || 1;

    const userDoc = await db.collection('Users').doc(targetUserId).get();
    if (!userDoc.exists) {
      logger.warn(`User not found: ${targetUserId}`);
      return res.status(404).json({ msg: "User not found." });
    }

    const userData = userDoc.data();
    const subscriptions = [];
    for (let i = (page - 1) * limit; i < Math.min(userData.subscriptions.length, page * limit); i++) {
      const subscriptionId = userData.subscriptions[i];
      const subscriptionDoc = await db.collection('Users').doc(subscriptionId).get();
      if (subscriptionDoc.exists) {
        const subscriptionData = subscriptionDoc.data();
        subscriptions.push({ id: subscriptionId, username: subscriptionData.username });
      }
    }

    res.json({ subscriptions, total: userData.subscriptions.length });
  } catch (error) {
    logger.error(`Error in getFollowedUsersOfSpecificUser: ${error.message}`, { error });
    return res.status(500).json({ msg: "Server error." });
  }
};
