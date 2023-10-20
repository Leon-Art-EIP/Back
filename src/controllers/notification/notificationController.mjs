import { Notification } from '../../models/notificationModel.mjs';

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
