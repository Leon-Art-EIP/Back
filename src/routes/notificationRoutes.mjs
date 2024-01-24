import { Router } from "express";
import { getNotifications, markNotificationRead, updateFcmToken } from "../controllers/notification/notificationController.mjs";
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
 *                   items:
 *                     $ref: '#/components/schemas/Notification'
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
 * /api/notifications/{notificationId}/read:
 *   put:
 *     summary: Mark a specific notification as read
 *     description: |
 *       Mark the specified notification as read for the authenticated user.
 *     tags: [Notification]
 *     security:
 *       - bearerAuth: []  # Indicates this endpoint requires a Bearer token.
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the notification to be marked as read.
 *     responses:
 *       200:
 *         description: Successfully marked the notification as read.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message.
 *                   example: Notification marked as read.
 *       400:
 *         description: Bad Request (e.g. invalid notification ID).
 *       404:
 *         description: Notification not found.
 *       500:
 *         description: Server Error.
 * 
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: The notification ID.
 *         type:
 *           type: string
 *           description: The type of the notification (e.g. "like", "follow", etc.).
 *         content:
 *           type: string
 *           description: The content or description of the notification.
 *         read:
 *           type: boolean
 *           description: Indicates if the notification has been read.
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date and time when the notification was created.
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
router.put('/update-fcm-token', authenticate, updateFcmToken);


export default router;