import express from 'express';
import passport from 'passport';
import { googleLogin, googleCallback } from '../controllers/authentification/google.mjs';

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
router.get('/auth/google/callback', googleCallback);

/**
 * @swagger
 * /api/mobile/google:
 *   post:
 *     summary: Google authentication for mobile
 *     description: Authenticates a mobile user with Google, creates a new user if necessary, and returns a JWT token.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       description: Google ID token for authentication
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: The ID token received from Google Sign-In.
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
router.post('/mobile/google', async (req, res, next) => {
    passport.authenticate('google-id-token', async (err, profile, info) => {
        if (err || !profile) {
            return res.status(401).json({ message: 'Authentication failed', error: err || info });
        }

        try {
            const email = profile.emails[0].value;
            const username = profile.displayName.toLowerCase();

            const userRef = db.collection('Users').where('email', '==', email).limit(1);
            const userSnapshot = await userRef.get();

            let user;

            if (userSnapshot.empty) {
                const newUserRef = db.collection('Users').doc();
                const userData = {
                    id: newUserRef.id,
                    username: profile.displayName,
                    username_lowercase: username,
                    email: email,
                    profilePicture: profile.photos[0].value,
                    password: uuidv4().toString(),
                    is_artist: false,
                    fcmToken: '',
                    availability: 'unavailable',
                    subscription: 'standard',
                    collections: [],
                    subscriptions: [],
                    subscribers: [],
                    subscribersCount: 0,
                    likedPublications: [],
                    canPostArticles: true,
                    bannerPicture: 'uploads/static/default-banner-pic.png',
                    stripeAccountId: '',
                };
                user = new User(userData);

                await newUserRef.set(user.toJSON());
                logger.info('New user created via Google login on mobile', { userId: newUserRef.id, username: user.username });
            } else {
                const userData = userSnapshot.docs[0].data();
                user = new User(userData);
                logger.info('User logged in via Google on mobile', { userId: user.id, username: user.username });
            }

            const payload = { user: { id: user.id } };
            const secret = process.env.JWT_SECRET;
            const options = { expiresIn: '1d' };
            const token = jwt.sign(payload, secret, options);

            res.json({
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    profilePicture: user.profilePicture,
                },
            });
        } catch (error) {
            logger.error('Error during mobile Google authentication', { error: error.message, stack: error.stack });
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    })(req, res, next);
});

/**
 * @swagger
 * /api/mobile/redirect:
 *   post:
 *     summary: Redirect to a custom URL on mobile
 *     description: This route redirects the user to a custom URL in the mobile application.
 *     tags:
 *       - Mobile
 *     requestBody:
 *       description: The URL to redirect to
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *                 description: The custom URL to redirect to.
 *     responses:
 *       302:
 *         description: Redirects to the specified URL.
 *         headers:
 *           Location:
 *             description: The custom URL to redirect to.
 *             schema:
 *               type: string
 */
router.post('/mobile/redirect', async (req, res, next) => {
    const url = JSON.stringify(req.body.url);
    res.redirect('mychat://' + url);
});

export default router;
