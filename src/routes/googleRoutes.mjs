import express from 'express';
import passport from 'passport';
import { googleLogin } from '../controllers/authentification/google.mjs';

const router = express.Router();

router.get('/auth/google', googleLogin);

router.get('/auth/google/callback', (req, res, next) => {
    passport.authenticate('google', (err, data) => {
        if (err || !data) {
            return res.status(401).json({ message: 'Authentication failed' });
        }
        const { user, token } = data;
        // Rediriger ou envoyer le token au client
        let redirectbaseUrl = process.env.GOOGLE_REDIRECT_URL || 'http://localhost:8081';
        res.redirect(`${redirectbaseUrl}/login?token=${token}&username=${user.username}`);
    })(req, res, next);
});

router.post('/mobile/google', async (req, res, next) => {
    passport.authenticate('google-id-token', async (err, profile, info) => {
        if (err || !profile) {
            return res.status(401).json({ message: 'Authentication failed', error: err || info });
        }

        try {
            const email = profile.emails[0].value;
            const username = profile.displayName.toLowerCase();

            // Recherche de l'utilisateur dans Firestore par email
            const userRef = db.collection('Users').where('email', '==', email).limit(1);
            const userSnapshot = await userRef.get();

            let user;

            if (userSnapshot.empty) {
                // Si l'utilisateur n'existe pas, création d'un nouvel utilisateur
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

                // Enregistrer l'utilisateur dans Firestore
                await newUserRef.set(user.toJSON());
                logger.info('New user created via Google login on mobile', { userId: newUserRef.id, username: user.username });
            } else {
                // Si l'utilisateur existe, récupérer ses données
                const userData = userSnapshot.docs[0].data();
                user = new User(userData);
                logger.info('User logged in via Google on mobile', { userId: user.id, username: user.username });
            }

            // Génération du JWT après l'authentification réussie
            const payload = { user: { id: user.id } };
            const secret = process.env.JWT_SECRET;
            const options = { expiresIn: '1d' };  // Le token expire après 1 jour
            const token = jwt.sign(payload, secret, options);

            // Répondre avec le token et les infos utilisateur
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

router.post('/mobile/redirect', async (req, res, next) => {
    const url = JSON.stringify(req.body.url);
    res.redirect('mychat://' + url);
});

export default router;