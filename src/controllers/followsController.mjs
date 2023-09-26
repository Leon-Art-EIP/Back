import mongoose from 'mongoose';
import { User } from '../models/UserModel.mjs';

export const followUser = async (req, res) => {
  const userId = req.user._id;
  const targetUserId = req.params.targetUserId;

  if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
    return res.status(400).send({ message: 'Invalid user id.' });
  }

  try {
    const user = await User.findById(userId);
    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      return res.status(404).send({ message: 'User to follow not found.' });
    }
    if (user._id.equals(targetUser._id)) {
      return res.status(400).send({ message: 'You cannot follow yourself.' });
    }

    const isAlreadyFollowing = user.subscriptions.includes(targetUserId.toString());

    if (isAlreadyFollowing) {
      user.subscriptions.pull(targetUserId);
      targetUser.subscribersCount = Math.max(0, targetUser.subscribersCount - 1);
      await user.save();
      await targetUser.save();
      return res.status(200).send({ message: 'Successfully unfollowed user.' });
    } else {
      user.subscriptions.push(targetUserId);
      targetUser.subscribersCount += 1;
      await user.save();
      await targetUser.save();
      return res.status(200).send({ message: 'Successfully followed user.' });
    }

  } catch (error) {
    console.error(error);
    return res.status(500).send({ message: 'Server error.' });
  }
};
