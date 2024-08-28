import express from 'express';
import passport from 'passport';
import { googleLogin, googleCallback, mobileLogin } from '../controllers/authentification/google.mjs';
import { handleFileUploadErrors, uploadProfilePicture } from '../middleware/uploadMiddleware.mjs';

const router = express.Router();

/**
 * @swagger
 * /api/auth/google:
 *   get:
 *     summary: Initiate Google authentication
 *     description: Redirects the user to Google for authentication. Once authenticated, the user is redirected back to the application.
 *     tags:
 *       - Authentication
 *     responses:
 *       302:
 *         description: Redirects to Google for authentication.
 *         headers:
 *           Location:
 *             description: URL to Google authentication page.
 *             schema:
 *               type: string
 */
router.get('/auth/google', googleLogin);

/**
 * @swagger
 * /api//auth/google/callback:
 *   get:
 *     summary: Google authentication callback
 *     description: Handles the callback after Google has authenticated the user. Generates a JWT token for the authenticated user.
 *     tags:
 *       - Authentication
 *     responses:
 *       200:
 *         description: User authenticated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT token for the authenticated user.
 *                 user:
 *                   type: object
 *                   description: Authenticated user's information.
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: User ID.
 *                     username:
 *                       type: string
 *                       description: Username of the user.
 *                     email:
 *                       type: string
 *                       description: Email address of the user.
 *       401:
 *         description: Authentication failed.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message.
 */
router.get('/auth/google/callback', uploadProfilePicture, handleFileUploadErrors, googleCallback);

/**
 * @swagger
 * /api/mobile/google:
 *   post:
 *     summary: Google authentication for mobile
 *     description: Authenticates a mobile user with Google, creates a new user if necessary, and returns a JWT token. Optionally, the user can upload a profile picture.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       description: User information for authentication, including an optional profile picture.
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: The username of the user.
 *               email:
 *                 type: string
 *                 description: The email address of the user.
 *               profilePicture:
 *                 type: string
 *                 format: binary
 *                 description: The profile picture of the user.
 *     responses:
 *       200:
 *         description: Authentication successful, returns JWT and user information.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT token for the authenticated user.
 *                 user:
 *                   type: object
 *                   description: Authenticated user's information.
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: User ID.
 *                     username:
 *                       type: string
 *                       description: Username of the user.
 *                     email:
 *                       type: string
 *                       description: Email address of the user.
 *                     profilePicture:
 *                       type: string
 *                       description: URL of the user's profile picture.
 *                     is_artist:
 *                       type: boolean
 *                       description: Indicates if the user is an artist.
 *                     fcmToken:
 *                       type: string
 *                       description: Firebase Cloud Messaging token.
 *                     availability:
 *                       type: string
 *                       description: User availability status.
 *                     subscription:
 *                       type: string
 *                       description: User subscription type.
 *                     subscribersCount:
 *                       type: integer
 *                       description: Number of subscribers the user has.
 *       401:
 *         description: Authentication failed.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message.
 *                 error:
 *                   type: string
 *                   description: Detailed error information.
 */

router.post('/api/mobile/google', uploadProfilePicture, handleFileUploadErrors, mobileLogin);


export default router;