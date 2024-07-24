import { v4 as uuidv4 } from 'uuid';
import { Notification } from '../../models/notificationModel.mjs';
import adminNotificationApp from '../../config/adminNotification.mjs';
import db from '../../config/db.mjs';
import logger from '../../admin/logger.mjs';

const adminFirestore = adminNotificationApp.firestore();

const sendPushNotification = async (fcmToken, title, body) => {
  const message = {
    notification: {
      title,
      body,
    },
    token: fcmToken,
  };

  try {
    await adminNotificationApp.messaging().send(message);
    logger.info('Push notification sent successfully!');
  } catch (error) {
    logger.error('Error sending push notification:', error);
  }
};

export const createAndSendNotification = async ({ recipientId, type, content, referenceId, description, sendPush = false }) => {
  const notificationData = {
    recipient: recipientId,
    type,
    content,
    referenceId,
    read: false,
    createdAt: new Date().toISOString(),
    id: uuidv4(),
  };

  const notificationRef = adminFirestore.collection('Notifications').doc(notificationData.id);
  await notificationRef.set(notificationData);

  logger.info("Created notification:", notificationData);

  if (sendPush) {
    const recipientDoc = await db.collection('Users').doc(recipientId).get();
    if (recipientDoc.exists && recipientDoc.data().fcmToken) {
      await sendPushNotification(recipientDoc.data().fcmToken, "New Notification", description);
    }
  }
};

export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = Number(req.query.limit) || parseInt(process.env.DEFAULT_PAGE_LIMIT, 10);
    const page = Number(req.query.page) || 1;
    const offset = (page - 1) * limit;

    const querySnapshot = await adminFirestore.collection('Notifications')
      .where('recipient', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .offset(offset)
      .get();

    const notifications = querySnapshot.docs.map(doc => new Notification({ ...doc.data(), id: doc.id }).toJSON());

    res.json(notifications);
  } catch (err) {
    logger.error('Error getting notifications:', { error: err.message, stack: err.stack});
    res.status(500).json({ msg: 'Server Error' });
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    const notificationId = req.params.id;
    const notificationRef = adminFirestore.collection('Notifications').doc(notificationId);

    const notificationDoc = await notificationRef.get();
    if (!notificationDoc.exists) {
      return res.status(404).json({ msg: 'Notification not found' });
    }

    await notificationRef.update({ read: true });

    const updatedNotification = new Notification({ ...notificationDoc.data(), id: notificationDoc.id, read: true });

    res.json({
      msg: 'Notification marked as read',
      notification: updatedNotification.toJSON(),
    });
  } catch (err) {
    logger.error('Error marking notification as read:', { error: err.message, stack: err.stack});
    res.status(500).json({ msg: 'Server Error' });
  }
};

export const getUnreadNotificationCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const querySnapshot = await adminFirestore.collection('Notifications')
      .where('recipient', '==', userId)
      .where('read', '==', false)
      .get();

    const unreadCount = querySnapshot.size;
    res.json({ unreadCount });
  } catch (err) {
    logger.error('Error getting unread notification count:', { error: err.message, stack: err.stack});
    res.status(500).json({ msg: 'Server Error' });
  }
};

export const updateFcmToken = async (req, res) => {
  const userId = req.user.id;
  const { fcmToken } = req.body;

  try {
    const userRef = db.collection('Users').doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return res.status(404).json({ msg: "User not found" });
    }

    if (!fcmToken) {
      return res.status(400).json({ msg: "FCM token is required" });
    }

    await userRef.update({ fcmToken });

    res.json({ msg: "FCM token updated successfully" });
  } catch (err) {
    logger.error('Error updating FCM token:', { error: err.message, stack: err.stack});
    res.status(500).json({ msg: "Server Error" });
  }
};
