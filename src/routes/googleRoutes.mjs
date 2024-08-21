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
        res.redirect(`http://localhost:8081/login?token=${token}&username=${user.username}`);
    })(req, res, next);
});

export default router;