import { Router } from "express";
const router = Router();
import {
  followUser,
  getUsersFollowing,
  getUserFollowers,
  getFollowedUsersOfSpecificUser,
  getFollowersOfSpecificUser
} from "../controllers/user/followsController.mjs";
import { authenticate } from "../middleware/authenticate.mjs";

/**
 * @swagger
 * /api/follow/{targetUserId}:
 *   post:
 *     summary: Follow or unfollow a user
 *     description: |
 *       Follow or unfollow a user based on the given target user ID.
 *       If the user is already following the target user, this endpoint will unfollow the user,
 *       and vice versa. The user must be authenticated to access this endpoint.
 *     tags: [Follow]
 *     security:
 *       - bearerAuth: []  # Indicates this endpoint requires a Bearer token.
 *     parameters:
 *       - in: path
 *         name: targetUserId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the user to be followed or unfollowed.
 *     responses:
 *       200:
 *         description: Successfully followed or unfollowed the user.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message.
 *                   example: Successfully followed user.
 *       400:
 *         description: Bad Request (e.g. invalid user ID, following oneself, etc.)
 *       404:
 *         description: User to follow not found.
 *       500:
 *         description: Server Error.
 */
router.post("/:targetUserId", authenticate, followUser);

/**
 * @swagger
 * /api/follow/following:
 *   get:
 *     summary: Get all users the authenticated user is following
 *     description: |
 *       Retrieves a list of users that the authenticated user is currently following.
 *     tags: [Follow]
 *     security:
 *       - bearerAuth: []  # Indicates this endpoint requires a Bearer token.
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of users to retrieve.
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number.
 *     responses:
 *       200:
 *         description: Successfully retrieved the list of followed users.
 *       500:
 *         description: Server Error.
 */
router.get("/following", authenticate, getUsersFollowing);


/**
 * @swagger
 * /api/follow/followers:
 *   get:
 *     summary: Get all users following the authenticated user
 *     description: |
 *       Retrieves a list of users that are currently following the authenticated user.
 *     tags: [Follow]
 *     security:
 *       - bearerAuth: []  # Indicates this endpoint requires a Bearer token.
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of users to retrieve.
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number.
 *     responses:
 *       200:
 *         description: Successfully retrieved the list of followers.
 *       500:
 *         description: Server Error.
 */
router.get("/followers", authenticate, getUserFollowers);

/**
 * @swagger
 * /api/follow/{targetUserId}/followers:
 *   get:
 *     summary: Get all followers of a specific user
 *     description: |
 *       Retrieves a list of users that are currently following the user identified by the targetUserId.
 *     tags: [Follow]
 *     security:
 *       - bearerAuth: []  # Indicates this endpoint requires a Bearer token.
 *     parameters:
 *       - in: path
 *         name: targetUserId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the user whose followers need to be retrieved.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of users to retrieve.
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number.
 *     responses:
 *       200:
 *         description: Successfully retrieved the list of followers of the specified user.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Server Error.
 */
router.get("/:targetUserId/followers", authenticate, getFollowersOfSpecificUser);

/**
 * @swagger
 * /api/follow/{targetUserId}/following:
 *   get:
 *     summary: Get all users a specific user is following
 *     description: |
 *       Retrieves a list of users that the user identified by the targetUserId is currently following.
 *     tags: [Follow]
 *     security:
 *       - bearerAuth: []  # Indicates this endpoint requires a Bearer token.
 *     parameters:
 *       - in: path
 *         name: targetUserId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the user whose subscriptions need to be retrieved.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of users to retrieve.
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number.
 *     responses:
 *       200:
 *         description: Successfully retrieved the list of users the specified user is following.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Server Error.
 */
router.get("/:targetUserId/following", authenticate, getFollowedUsersOfSpecificUser);


export default router;
