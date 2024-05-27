import { User } from "../../models/userModel.mjs";
import { createAndSendNotification } from "../notification/notificationController.mjs";
import { FieldValue } from 'firebase-admin/firestore';
import db from '../../config/db.mjs';

export const followUser = async (req, res) => {
  const userId = req.user.id;
  const targetUserId = req.params.targetUserId;

  // Vérification simple de la validité de l'ID
  if (!targetUserId) {
    return res.status(400).json({ msg: "Invalid user id." });
  }

  try {
    const userRef = db.collection('Users').doc(userId);
    const targetUserRef = db.collection('Users').doc(targetUserId);

    const userDoc = await userRef.get();
    const targetUserDoc = await targetUserRef.get();

    if (!targetUserDoc.exists) {
      return res.status(404).json({ msg: "User to follow not found." });
    }
    if (userId === targetUserId) {
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
        referenceId: userId, // Optional: use the follower's ID as reference
        description: `Someone just followed your profile`,
        sendPush: true,
      });

      return res.status(200).json({ msg: "Successfully followed user." });
    }
  } catch (error) /* istanbul ignore next */ {
    console.error(error);
    return res.status(500).json({ msg: "Server error." });
  }
};

export const getUsersFollowing = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = Number(req.query.limit) || parseInt(process.env.DEFAULT_PAGE_LIMIT);
    const page = Number(req.query.page) || 1;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: "User not found." });
    }

    const subscriptions = [];
    for (let i = (page - 1) * limit; i < Math.min(user.subscriptions.length, page * limit); i++) {
      const subscriptionId = user.subscriptions[i];
      const subscriptionDoc = await db.collection('Users').doc(subscriptionId).get();
      if (subscriptionDoc.exists) {
        const subscriptionData = subscriptionDoc.data();
        subscriptions.push({ id: subscriptionId, username: subscriptionData.username });
      }
    }

    res.json({ subscriptions, total: user.subscriptions.length });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Server error." });
  }
};

export const getUserFollowers = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = Number(req.query.limit) || parseInt(process.env.DEFAULT_PAGE_LIMIT);
    const page = Number(req.query.page) || 1;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: "User not found." });
    }

    const subscribers = [];
    for (let i = (page - 1) * limit; i < Math.min(user.subscribers.length, page * limit); i++) {
      const subscriberId = user.subscribers[i];
      const subscriberDoc = await db.collection('Users').doc(subscriberId).get();
      if (subscriberDoc.exists) {
        const subscriberData = subscriberDoc.data();
        subscribers.push({ id: subscriberId, username: subscriberData.username });
      }
    }

    res.json({ subscribers, total: user.subscribersCount });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Server error." });
  }
};

export const getFollowersOfSpecificUser = async (req, res) => {
  try {
    const targetUserId = req.params.targetUserId;
    const limit = Number(req.query.limit) || parseInt(process.env.DEFAULT_PAGE_LIMIT);
    const page = Number(req.query.page) || 1;

    const user = await User.findById(targetUserId);
    if (!user) {
      return res.status(404).json({ msg: "User not found." });
    }

    const subscribers = [];
    for (let i = (page - 1) * limit; i < Math.min(user.subscribers.length, page * limit); i++) {
      const subscriberId = user.subscribers[i];
      const subscriberDoc = await db.collection('Users').doc(subscriberId).get();
      if (subscriberDoc.exists) {
        const subscriberData = subscriberDoc.data();
        subscribers.push({ id: subscriberId, username: subscriberData.username });
      }
    }

    res.json({ subscribers, total: user.subscribersCount });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Server error." });
  }
};

export const getFollowedUsersOfSpecificUser = async (req, res) => {
  try {
    const targetUserId = req.params.targetUserId;
    const limit = Number(req.query.limit) || parseInt(process.env.DEFAULT_PAGE_LIMIT);
    const page = Number(req.query.page) || 1;

    const user = await User.findById(targetUserId);
    if (!user) {
      return res.status(404).json({ msg: "User not found." });
    }

    const subscriptions = [];
    for (let i = (page - 1) * limit; i < Math.min(user.subscriptions.length, page * limit); i++) {
      const subscriptionId = user.subscriptions[i];
      const subscriptionDoc = await db.collection('Users').doc(subscriptionId).get();
      if (subscriptionDoc.exists) {
        const subscriptionData = subscriptionDoc.data();
        subscriptions.push({ id: subscriptionId, username: subscriptionData.username });
      }
    }

    res.json({ subscriptions, total: user.subscriptions.length });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Server error." });
  }
};
