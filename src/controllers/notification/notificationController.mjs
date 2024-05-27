import dotenv from "dotenv";
dotenv.config();
import { Notification } from '../../models/notificationModel.mjs';
import { User } from "../../models/userModel.mjs";
import admin from 'firebase-admin';
import fs from 'fs';
import { format } from 'date-fns';

// Initialize the FCM SDK
const serviceAccount = JSON.parse(fs.readFileSync(process.env.SERVICE_ACCOUNT_KEY_PATH, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://leon-art.firebaseio.com",
}, 'notification');

// Utility function to send push notifications
async function sendPushNotification(fcmToken, title, body) /* istanbul ignore next */ {
  const message = {
    notification: {
      title,
      body,
    },
    token: fcmToken,
  };

  try {
    await admin.messaging().send(message).then((response) => { console.log('Push notification sent successfully !'); }).catch((error) => { console.log('Error sending push notif : ' + error); });
  } catch (error) /* istanbul ignore next */ {
    console.error('Error sending push notification:', error);
  }
}

// Function to create and optionally send a push notification
async function createAndSendNotification({ recipientId, type, content, referenceId, description, sendPush = false }) {
  const notification = new Notification({
    recipient: recipientId,
    type,
    content,
    referenceId,
  });

  await notification.save();

  console.log("created notification : " + notification);

  if (sendPush) {
    const recipient = await User.findById(recipientId);
    if (recipient.fcmToken) {
      await sendPushNotification(recipient.fcmToken, "New Notification", description);
    }
  }
}

export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = Number(req.query.limit) || parseInt(process.env.DEFAULT_PAGE_LIMIT, 10);
    const page = Number(req.query.page) || 1;
    const offset = (page - 1) * limit;

    const notifications = await Notification.findWithOrder(
      { recipient: userId },
      'createdAt',
      'desc',
      limit,
      offset
    );

    const formattedNotifications = notifications.map(notification => ({
      ...notification,
      createdAt: format(new Date(notification.createdAt), 'yyyy-MM-dd HH:mm:ss')
    }));

    res.json(formattedNotifications);
  } catch (err) /* istanbul ignore next */ {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    const notificationId = req.params.id;
    const notification = await Notification.updateById(notificationId, { read: true });
    if (!notification) return res.status(404).json({ msg: 'Notification not found' });

    res.json({ msg: 'Notification marked as read', notification });
  } catch (err) /* istanbul ignore next */ {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

export const getUnreadNotificationCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await Notification.countDocuments({ recipient: userId, read: false });
    res.json({ unreadCount: count });
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

export { createAndSendNotification };
