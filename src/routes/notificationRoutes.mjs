import { Router } from "express";
import {
  getNotifications,
  markNotificationRead,
  getUnreadNotificationCount,
  updateFcmToken,
} from "../controllers/notification/notificationController.mjs";
import { authenticate } from "../middleware/authenticate.mjs";

const router = Router();

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Retrieve notifications for the authenticated user
 *     description: |
 *       Fetch the list of notifications for the authenticated user. This endpoint supports pagination.
 *     tags: [Notification]
 *     security:
 *       - bearerAuth: []  # Indicates this endpoint requires a Bearer token.
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         required: false
 *         description: Limit the number of notifications returned.
 *         example: 20
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         required: false
 *         description: The page number to fetch.
 *         example: 1
 *     responses:
 *       200:
 *         description: List of notifications for the authenticated user.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 notifications:
 *                   type: array
 *                 total:
 *                   type: integer
 *                   description: Total number of notifications for the user.
 *       401:
 *         description: Unauthorized (e.g. invalid token, expired token).
 *       500:
 *         description: Server Error.
 */
router.get("/", authenticate, getNotifications);

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   put:
 *     summary: Mark a notification as read
 *     description: Marks a specific notification as read for the authenticated user. This action updates the notification's read status to true.
 *     tags: [Notification]
 *     security:
 *       - bearerAuth: []  # Indicates this endpoint requires a Bearer token authentication.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the notification to mark as read.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification marked as read successfully. Returns the updated notification information.
 *         content:
 *           application/json:
 *             example: 
 *               msg: 'Notification marked as read'
 *               notification:
 *                 _id: '60af924c8b549648489f1e2e'
 *                 recipient: '60af91ea8b549648489f1e2d'
 *                 type: 'like'
 *                 content: 'User XYZ liked your post.'
 *                 referenceId: '60af91ea8b549648489f1e2c'
 *                 read: true
 *                 createdAt: '2021-05-26T09:20:12.123Z'
 *       401:
 *         description: Unauthorized due to invalid or missing Bearer token.
 *       404:
 *         description: Notification not found.
 *       500:
 *         description: Server Error.
 */
router.put("/:id/read", authenticate, markNotificationRead);

/**
 * @swagger
 * /api/notifications/update-fcm-token:
 *   put:
 *     summary: Update the FCM token for the authenticated user
 *     description: |
 *       Update the Firebase Cloud Messaging (FCM) token for the authenticated user
 *       to enable push notifications.
 *     tags: [Notification]
 *     security:
 *       - bearerAuth: []  # Indicates this endpoint requires a Bearer token.
 *     requestBody:
 *       description: The FCM token data
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fcmToken:
 *                 type: string
 *                 description: The Firebase Cloud Messaging token for the user.
 *                 example: "YOUR_FCM_TOKEN_HERE"
 *     responses:
 *       200:
 *         description: Successfully updated the FCM token.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message.
 *                   example: FCM token updated successfully.
 *       400:
 *         description: Bad Request (e.g. missing FCM token in request body).
 *       401:
 *         description: Unauthorized (e.g. invalid or missing Bearer token).
 *       500:
 *         description: Server Error.
 *
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */
router.put("/update-fcm-token", authenticate, updateFcmToken);

/**
 * @swagger
 * /api/notifications/count:
 *   get:
 *     summary: Get the count of unread notifications
 *     description: Retrieves the total count of unread notifications for the authenticated user.
 *     tags: [Notification]
 *     security:
 *       - bearerAuth: []  # Indicates this endpoint requires a Bearer token.
 *     responses:
 *       200:
 *         description: The count of unread notifications.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 unreadCount:
 *                   type: integer
 *                   description: The total number of unread notifications.
 *                   example: 5
 *       401:
 *         description: Unauthorized (e.g., invalid or missing Bearer token).
 *       500:
 *         description: Server Error.
 */
router.get("/count", authenticate, getUnreadNotificationCount);

export default router;
