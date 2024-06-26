import dotenv from "dotenv";
dotenv.config();
import { Notification } from '../../models/notificationModel.mjs';
import { User } from "../../models/userModel.mjs";
import admin from 'firebase-admin';
import fs from 'fs';
import db from '../../config/db.mjs';

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

    // Transform notifications to replace `id` with `_id`
    const transformedNotifications = notifications.map(notification => ({
      ...notification,
      _id: notification.id,
      id: undefined // Remove the original `id` field
    }));

    res.json(transformedNotifications);
  } catch (err) /* istanbul ignore next */ {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    const notificationId = req.params.id;

    // Récupérer la notification avant de la mettre à jour
    const notification = await Notification.findById(notificationId);
    if (!notification) return res.status(404).json({ msg: 'Notification not found' });

    // Mettre à jour la notification
    await Notification.updateById(notificationId, { read: true });

    // Récupérer la notification mise à jour
    const updatedNotification = await Notification.findById(notificationId);

    res.json({
      msg: 'Notification marked as read',
      notification: {
        _id: updatedNotification.id,
        recipient: updatedNotification.recipient,
        type: updatedNotification.type,
        content: updatedNotification.content,
        referenceId: updatedNotification.referenceId,
        read: updatedNotification.read,
        createdAt: updatedNotification.createdAt,
        updatedAt: updatedNotification.updatedAt,
      },
    });
  } catch (err) /* istanbul ignore next */ {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
};



export const getUnreadNotificationCount = async (req, res) => {
  try {
    const userId = req.user.id;

    // Vérifiez si des notifications non lues existent pour cet utilisateur
    const notificationsRef = db.collection('Notifications')
      .where('recipient', '==', userId)
      .where('read', '==', false);

    const snapshot = await notificationsRef.get();

    if (snapshot.empty) {
      console.log('No matching documents.');
      return res.json({ unreadCount: 0 });
    } else {
      const unreadCount = snapshot.size;
      console.log(`Found ${unreadCount} unread notifications.`);
      return res.json({ unreadCount });
    }
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
