import { v4 as uuidv4 } from 'uuid';
import { Notification } from '../../models/notificationModel.mjs';
import adminNotificationApp from '../../config/adminNotification.mjs';
import db from '../../config/db.mjs';
import logger from '../../admin/logger.mjs';
import nodemailer from 'nodemailer';
import { createTransport } from "nodemailer";

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

const generateNotificationLink = (type, referenceId) => {
  const baseUrl = process.env.BASE_WEB_URL;

  if (type === "like" || type === "comment") {
    return `${baseUrl}/single/${referenceId}`;
  } else if (type === "follow") {
    return `${baseUrl}/profile/${referenceId}`;
  } else if (
    type === "payment_success" || 
    type === "order_cancelled_seller" || 
    type === "order_completed"
  ) {
    return `${baseUrl}/order?type=sell&orderId=${referenceId}`;
  } else if (
    type === "order_processing" || 
    type === "order_cancelled_buyer" || 
    type === "order_shipping"
  ) {
    return `${baseUrl}/order?type=buy&orderId=${referenceId}`;
  } else {
    // Fallback to the base URL if the type is not recognized
    return baseUrl;
  }
};

const sendEmailNotification = async (email, username, type, description, referenceId) => {
  const transporter = createTransport({
    service: "gmail",
    auth: {
      user: process.env.GOOGLE_MAIL_LEONART,
      pass: process.env.GOOGLE_MAIL_LEONART_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  // Generate the dynamic notification link based on the type and referenceId
  const notificationLink = generateNotificationLink(type, referenceId);
  console.log("notificationLink : ", notificationLink, "   type is : ", type, "   referenceId is : ", referenceId);
  // Prepare the HTML email content using the professional template
  const emailContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Notification</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f4f4f7;
        color: #333333;
        margin: 0;
        padding: 0;
      }
      .container {
        width: 100%;
        padding: 20px;
        background-color: #f4f4f7;
      }
      .email-body {
        max-width: 600px;
        margin: 0 auto;
        background-color: #ffffff;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }
      .header {
        text-align: center;
        padding-bottom: 20px;
      }
      .header img {
        max-width: 150px;
      }
      .content {
        font-size: 16px;
        line-height: 1.5;
        color: #333333;
      }
      .content h2 {
        color: #333333;
        font-size: 24px;
      }
      .content p {
        margin: 0 0 20px;
      }
      .btn {
        display: inline-block;
        background-color: #0056b3;
        color: #ffffff;
        text-decoration: none;
        padding: 10px 20px;
        border-radius: 5px;
        font-weight: bold;
      }
      .btn:hover {
        background-color: #0041a3;
      }
      .footer {
        text-align: center;
        font-size: 12px;
        color: #888888;
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid #eaeaea;
      }
      .footer a {
        color: #888888;
        text-decoration: none;
      }
    </style>
  </head>
  <body>

    <div class="container">
      <div class="email-body">
        
        <!-- Header with logo -->
        <div class="header">
          <img src="https://res.cloudinary.com/dvhqjoxv6/image/upload/v1725836569/jfbn3z6gvx9zsswijez4.png" alt="LeonArts Logo">
        </div>

        <!-- Main content -->
        <div class="content">
          <h2>You Have a New Notification!</h2>
          <p>Dear ${username},</p>
          <p>You have received a new notification: <strong>${type}</strong>.</p>
          <p>${description}</p>
          <p>To view the notification and take further action, please click the button below:</p>

          <!-- Action Button -->
          <p style="text-align: center;">
            <a href="${notificationLink}" class="btn">View Notification</a>
          </p>

          <p>Thank you for being part of our community!</p>
          <p>Best regards,<br>LeonArts Team</p>
        </div>

        <!-- Footer -->
        <div class="footer">
          <p>If you no longer wish to receive these emails, you can <a href="${process.env.BASE_WEB_URL}/settings">update your preferences</a>.</p>
          <p>&copy; 2024 LeonArts. All rights reserved.</p>
        </div>

      </div>
    </div>

  </body>
  </html>
  `;

  const mailOptions = {
    from: "leonart.noreply@gmail.com",
    to: email,
    subject: `New ${type} Notification`,
    html: emailContent,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
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

  console.log("Created notification:", notificationData);

  // Send Push Notification
  if (sendPush) {
    const recipientDoc = await db.collection('Users').doc(recipientId).get();
    if (recipientDoc.exists && recipientDoc.data().fcmToken) {
      await sendPushNotification(recipientDoc.data().fcmToken, "New Notification", description);
    }
  }

  // Send Email Notification
  const recipientDoc = await db.collection('Users').doc(recipientId).get();
  const recipient = recipientDoc.data();
  if (recipient.emailNotificationEnabled) {
    // Correctly pass the type, description, and referenceId to the sendEmailNotification function
    await sendEmailNotification(recipient.email, recipient.username, type, description, referenceId);
  }
};


export const updateEmailNotificationSetting = async (req, res) => {
  const userId = req.user.id;
  const { emailNotificationEnabled } = req.body;

  try {
    const userRef = db.collection('Users').doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return res.status(404).json({ msg: "User not found" });
    }

    await userRef.update({ emailNotificationEnabled });

    res.json({ msg: "Email notification setting updated successfully" });
  } catch (err) {
    console.error('Error updating email notification setting:', err);
    res.status(500).json({ msg: "Server Error" });
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
