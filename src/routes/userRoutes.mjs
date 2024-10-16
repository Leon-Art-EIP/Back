import express from "express";
import {
  checkUsernameAvailability,
  checkEmailAvailability,
} from "../controllers/user/userController.mjs";
import rateLimit from "express-rate-limit";
import {
  getProfile,
  updateBiography,
  updateAvailability,
  updateProfilePicture,
  updateBannerPicture,
  updateSocialMediaLinks,
  updateUsername,
  whoIam,
} from "../controllers/user/profile/profileController.mjs";
import {
  uploadProfilePicture,
  uploadBannerPicture,
} from "../middleware/uploadMiddleware.mjs";
import { authenticate } from "../middleware/authenticate.mjs";

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

/**
 * @swagger
 * /api/user/profile/{userId}:
 *   get:
 *     summary: Get a user's profile
 *     description: Fetches a user's profile by user ID.
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to fetch the profile for.
 *     responses:
 *       200:
 *         description: User profile details.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 username:
 *                   type: string
 *                 is_artist:
 *                   type: boolean
 *                 biography:
 *                   type: string
 *                 availability:
 *                   type: string
 *                 subscription:
 *                   type: string
 *                 profilePicture:
 *                   type: string
 *                 bannerPicture:
 *                   type: string
 *                 socialMediaLinks:
 *                   type: object
 *                   properties:
 *                     instagram:
 *                       type: string
 *                     twitter:
 *                       type: string
 *                     facebook:
 *                       type: string
 *                     tiktok:
 *                       type: string
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Server error.
 */
router.get("/user/profile/:userId", authenticate, getProfile);

/**
 * @swagger
 * /api/user/profile/bio:
 *   post:
 *     summary: Update user biography
 *     description: Updates the biography of the authenticated user.
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               biography:
 *                 type: string
 *                 description: New biography text.
 *     responses:
 *       200:
 *         description: Updated user profile.
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Server error.
 */
router.post("/user/profile/bio", authenticate, updateBiography);

/**
 * @swagger
 * /api/user/profile/availability:
 *   post:
 *     summary: Update user availability
 *     description: Updates the availability of the authenticated user.
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               availability:
 *                 type: string
 *                 description: New availability status.
 *     responses:
 *       200:
 *         description: Updated user profile.
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Server error.
 */
router.post("/user/profile/availability", authenticate, updateAvailability);

/**
 * @swagger
 * /api/user/profile/profile-pic:
 *   post:
 *     summary: Upload profile picture
 *     description: Uploads a new profile picture for the authenticated user.
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               profilePicture:
 *                 type: string
 *                 format: binary
 *                 description: Profile picture file (jpeg, jpg, png up to 5MB).
 *     responses:
 *       200:
 *         description: Uploaded successfully and returns the updated user profile.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 username:
 *                   type: string
 *                 is_artist:
 *                   type: boolean
 *                 biography:
 *                   type: string
 *                 availability:
 *                   type: string
 *                 subscription:
 *                   type: string
 *                 profilePicture:
 *                   type: string
 *                 bannerPicture:
 *                   type: string
 *                 socialMediaLinks:
 *                   type: object
 *                   properties:
 *                     instagram:
 *                       type: string
 *                     twitter:
 *                       type: string
 *                     facebook:
 *                       type: string
 *                     tiktok:
 *                       type: string
 *       400:
 *         description: Invalid image format.
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Server error.
 */
router.post("/user/profile/profile-pic", authenticate, uploadProfilePicture, updateProfilePicture);

/**
 * @swagger
 * /api/user/profile/banner-pic:
 *   post:
 *     summary: Upload banner picture
 *     description: Uploads a new banner picture for the authenticated user.
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               bannerPicture:
 *                 type: string
 *                 format: binary
 *                 description: Banner picture file (jpeg, jpg, png up to 5MB).
 *     responses:
 *       200:
 *         description: Uploaded successfully and returns the updated user profile.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 username:
 *                   type: string
 *                 is_artist:
 *                   type: boolean
 *                 biography:
 *                   type: string
 *                 availability:
 *                   type: string
 *                 subscription:
 *                   type: string
 *                 profilePicture:
 *                   type: string
 *                 bannerPicture:
 *                   type: string
 *                 socialMediaLinks:
 *                   type: object
 *                   properties:
 *                     instagram:
 *                       type: string
 *                     twitter:
 *                       type: string
 *                     facebook:
 *                       type: string
 *                     tiktok:
 *                       type: string
 *       400:
 *         description: Invalid image format.
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Server error.
 */
router.post("/user/profile/banner-pic", authenticate, uploadBannerPicture, updateBannerPicture);

/**
 * @swagger
 * /api/user/profile/social-links:
 *   post:
 *     summary: Update user social media links
 *     description: Updates the social media links of the authenticated user.
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               instagram:
 *                 type: string
 *                 description: Instagram profile link.
 *               twitter:
 *                 type: string
 *                 description: Twitter profile link.
 *               facebook:
 *                 type: string
 *                 description: Facebook profile link.
 *               tiktok:
 *                 type: string
 *                 description: TikTok profile link.
 *     responses:
 *       200:
 *         description: Updated user profile.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 username:
 *                   type: string
 *                 is_artist:
 *                   type: boolean
 *                 biography:
 *                   type: string
 *                 availability:
 *                   type: string
 *                 subscription:
 *                   type: string
 *                 profilePicture:
 *                   type: string
 *                 bannerPicture:
 *                   type: string
 *                 socialMediaLinks:
 *                   type: object
 *                   properties:
 *                     instagram:
 *                       type: string
 *                     twitter:
 *                       type: string
 *                     facebook:
 *                       type: string
 *                     tiktok:
 *                       type: string
 *       400:
 *         description: Invalid social media link format.
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Server error.
 */
router.post("/user/profile/social-links", authenticate, updateSocialMediaLinks);

/**
 * @swagger
 * /api/user/profile/username:
 *   post: 
 *     summary: Update user username  
 *     description: Updates the username of the authenticated user.
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true 
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: New username.
 *     responses:
 *       200:
 *         description: Updated user profile.
 *       400:
 *         description: Invalid username format.
 *       401:
 *         description: Unauthorized.
 *       409:
 *         description: Username is already in use.
 *       500:
 *         description: Server error.
 */
//router.post("/user/profile/username", authenticate, updateUsername);

/**
 * @swagger
 * /api/user/profile/who-i-am:
 *   get:
 *     summary: Get user details
 *     description: Fetches the details of the authenticated user.
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User details.
 *         content: 
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 username:
 *                   type: string
 *                 is_artist:
 *                   type: boolean
 *                 biography: 
 *                   type: string
 *                 availability:
 *                   type: string
 *                 subscription:
 *                   type: string
 *                 profilePicture:
 *                   type: string
 *                 bannerPicture:
 *                   type: string
 *                 socialMediaLinks:
 *                   type: object
 *                   properties:
 *                     instagram:
 *                       type: string
 *                     twitter:
 *                       type: string
 *                     facebook:
 *                       type: string
 *                     tiktok:
 *                       type: string
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Server error.
 *       498:
 *         description: Invalid or expired token.
 */
//router.get("/user/profile/who-i-am", whoIam);

export default router;
