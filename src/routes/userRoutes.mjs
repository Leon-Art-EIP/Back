import express from "express";
import {
  checkUsernameAvailability,
  checkEmailAvailability,
} from "../controllers/user/userController.mjs";
import rateLimit from "express-rate-limit";

const router = express.Router();

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 requests per windowMs
});

/**
 * @swagger
 * /api/user/check-username/{username}:
 *   get:
 *     summary: Check if a username is available
 *     description: |
 *       Checks if a username is available in the system.
 *       Username must be between 3 and 20 characters and contain only letters, numbers, and underscores.
 *     tags: [Username]
 *     security: []  # Indicates this endpoint doesn't require any security (tokens).
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *         description: The username to check for availability.
 *     responses:
 *       200:
 *         description: Username availability status.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   description: Message indicating if username is available or not.
 *       400:
 *         description: Invalid username format.
 *       409:
 *         description: Username is already in use.
 *       500:
 *         description: Server Error.
 */
router.get(
  "/user/check-username/:username",
  limiter,
  checkUsernameAvailability
);

/**
 * @swagger
 * /api/user/check-email/{email}:
 *   get:
 *     summary: Check if an email is available
 *     description: |
 *       Checks if an email is available in the system.
 *       Email should be in a valid format.
 *     tags: [User]
 *     security: []  # Indicates this endpoint doesn't require any security (tokens).
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *         description: The email to check for availability.
 *     responses:
 *       200:
 *         description: Email availability status.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   description: Message indicating if email is available or not.
 *       400:
 *         description: Invalid email format.
 *       409:
 *         description: Email is already in use.
 *       500:
 *         description: Server Error.
 */
router.get("/user/check-email/:email", limiter, checkEmailAvailability);

export default router;
