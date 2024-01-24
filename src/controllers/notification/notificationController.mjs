import { Notification } from '../../models/notificationModel.mjs';
import { User } from "../../models/userModel.mjs";

export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = Number(req.query.limit) || process.env.DEFAULT_PAGE_LIMIT;
    const page = Number(req.query.page) || 1;
    const notifications = await Notification.find({ recipient: userId })
      .sort('-createdAt')
      .limit(limit)
      .skip((page - 1) * limit);
    res.json(notifications);
  } catch (err) /* istanbul ignore next */ {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    const notificationId = req.params.id;
    const notification = await Notification.findById(notificationId);
    if (!notification) return res.status(404).json({ msg: 'Notification not found' });
    notification.read = true;
    await notification.save();
    res.json({ msg: 'Notification marked as read' });
  } catch (err) /* istanbul ignore next */ {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

export const updateFcmToken = async (req, res) => {
    const userId = req.user.id;
    const { fcmToken } = req.body;
  
    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ msg: "User not found" });
      }

      if (!fcmToken) {
        return res.status(400).json({ msg: "FCM token is required" });
      }
      user.fcmToken = fcmToken;

      await user.save();
  
      res.json({ msg: "FCM token updated successfully" });
    } catch (err) /* istanbul ignore next */ {
      console.error(err.message);
      res.status(500).json({ msg: "Server Error" });
    }
  };
  