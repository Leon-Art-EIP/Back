import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import db from '../../config/db.mjs';
import logger from '../../admin/logger.mjs';
import jwt from 'jsonwebtoken';
import { User } from '../../models/userModel.mjs';
import { v4 as uuidv4 } from 'uuid';

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL,
            passReqToCallback: true,
        },
        async (request, accessToken, refreshToken, profile, done) => {
            try {
                if (!profile.emails || !profile.emails[0].value) {
                    throw new Error('Email not provided by Google');
                }

                const email = profile.emails[0].value;
                const username = profile.displayName;

                const userRef = db.collection('Users').where('email', '==', email).limit(1);
                const userSnapshot = await userRef.get();

                logger.info('Google login attempt', { username, email, profiles: profile });

                let user;

                if (userSnapshot.empty) {
                    const newUserRef = db.collection('Users').doc();
                    const userData = {
                        id: newUserRef.id,
                        username: profile.displayName,
                        username_lowercase: username.toLowerCase(),
                        email: profile.emails[0].value,
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
                    logger.info('New user created via Google login', { userId: newUserRef.id, username: user.username });
                } else {
                    const userData = userSnapshot.docs[0].data();
                    user = new User(userData);
                    logger.info('User logged in via Google', { userId: user.id, username: user.username });
                }

                const payload = { user: { id: user.id } };
                const secret = process.env.JWT_SECRET;
                const options = { expiresIn: '1d' };
                const token = jwt.sign(payload, secret, options);

                done(null, { user, token });
            } catch (err) {
                logger.error('Error during Google authentication', { error: err.message, stack: err.stack });
                done(err, null);
            }
        }
    )
);

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const userDoc = await db.collection('Users').doc(id).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            const user = new User(userData);
            done(null, user);
        } else {
            done(new Error('User not found'), null);
        }
    } catch (err) {
        done(err, null);
    }
});

export const googleLogin = passport.authenticate('google', { scope: ['profile', 'email'] });

export const googleCallback = (req, res, next) => {
    passport.authenticate('google', (err, data) => {
        if (err || !data) {
            console.error('Google authentication failed:', err);
            return res.status(401).json({ message: 'Authentication failed' });
        }
        const { user, token } = data;
        const redirectUrl = process.env.GOOGLE_REDIRECT_URL || 'http://localhost:3000';
        res.redirect(`${redirectUrl}/login?token=${token}&username=${user.username}`);
    })(req, res, next);
};
