import mongoose from "mongoose";
import { User } from "../../models/userModel.mjs";
import { createAndSendNotification } from "../notification/notificationController.mjs";

export const followUser = async (req, res) => {
  const userId = req.user.id;
  const targetUserId = req.params.targetUserId;

  if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
    return res.status(400).json({ msg: "Invalid user id." });
  }

  try {
    const user = await User.findById(userId);
    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      return res.status(404).json({ msg: "User to follow not found." });
    }
    if (user._id.toString() === targetUser._id.toString()) {
      return res.status(400).json({ msg: "You cannot follow yourself." });
    }

    const isAlreadyFollowing = user.subscriptions.includes(
      targetUserId.toString()
    );

    if (isAlreadyFollowing) {
      user.subscriptions.pull(targetUserId);
      targetUser.subscribers.pull(userId);
      targetUser.subscribersCount = Math.max(
        0,
        targetUser.subscribersCount - 1
      );
      await user.save();
      await targetUser.save();
      return res.status(200).json({ msg: "Successfully unfollowed user." });
    } else {
      user.subscriptions.push(targetUserId);
      targetUser.subscribers.push(userId);
      targetUser.subscribersCount += 1;
      await user.save();
      await targetUser.save();

      // Notification for following
      createAndSendNotification({
        recipientId: targetUserId,
        type: "follow",
        content: `${user.username}`,
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
    const limit = Number(req.query.limit) || process.env.DEFAULT_PAGE_LIMIT;
    const page = Number(req.query.page) || 1;

    const user = await User.findById(userId).populate({
      path: "subscriptions",
      select: "username",
      options: { limit, skip: (page - 1) * limit },
    });
    res.json({
      subscriptions: user.subscriptions,
      total: user.subscriptions.length,
    });
  } catch (error) /* istanbul ignore next */ {
    console.error(error);
    return res.status(500).json({ msg: "Server error." });
  }
};

export const getUserFollowers = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = Number(req.query.limit) || process.env.DEFAULT_PAGE_LIMIT;
    const page = Number(req.query.page) || 1;

    const user = await User.findById(userId).populate({
      path: "subscribers",
      select: "username",
      options: { limit, skip: (page - 1) * limit },
    });
    res.json({ subscribers: user.subscribers, total: user.subscribersCount });
  } catch (error) /* istanbul ignore next */ {
    console.error(error);
    return res.status(500).json({ msg: "Server error." });
  }
};

export const getFollowersOfSpecificUser = async (req, res) => {
  try {
    const targetUserId = req.params.targetUserId;
    const limit = Number(req.query.limit) || process.env.DEFAULT_PAGE_LIMIT;
    const page = Number(req.query.page) || 1;

    const user = await User.findById(targetUserId).populate({
      path: "subscribers",
      select: "username",
      options: { limit, skip: (page - 1) * limit },
    });
    if (!user) {
      return res.status(404).json({ msg: "User not found." });
    }
    res.json({ subscribers: user.subscribers, total: user.subscribersCount });
  } catch (error) /* istanbul ignore next */ {
    console.error(error);
    return res.status(500).json({ msg: "Server error." });
  }
};

export const getFollowedUsersOfSpecificUser = async (req, res) => {
  try {
    const targetUserId = req.params.targetUserId;
    const limit = Number(req.query.limit) || process.env.DEFAULT_PAGE_LIMIT;
    const page = Number(req.query.page) || 1;

    const user = await User.findById(targetUserId).populate({
      path: "subscriptions",
      select: "username",
      options: { limit, skip: (page - 1) * limit },
    });
    if (!user) {
      return res.status(404).json({ msg: "User not found." });
    }
    res.json({
      subscriptions: user.subscriptions,
      total: user.subscriptions.length,
    });
  } catch (error) /* istanbul ignore next */ {
    console.error(error);
    return res.status(500).json({ msg: "Server error." });
  }
};
