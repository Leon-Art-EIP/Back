
import passport from 'passport';
import GoogleStrategy from 'passport-google-oauth20';
import express from 'express';
import dotenv from 'dotenv';
import { User as UserModel } from '../../models/userModel.mjs';
import { randomUUID } from 'crypto';
import jwt from 'jsonwebtoken';

const clientID = '';
const clientSecret = '';
const GOOGLE_SCOPES = ['email', 'profile', 'openid']
const callbackURL = 'http://localhost:5000/login/google/callback';

passport.use(new GoogleStrategy.Strategy({
    clientID,
    clientSecret,
    callbackURL,
    scope: GOOGLE_SCOPES,
    passReqToCallback: true,
},
    async (req, accessToken, refreshToken, profile, done) => {
        try {
            let user = await UserModel.findOne({ where: { email: profile.emails[0].value } });
            if (!user) {
                user = await UserModel.create({
                    email: profile.emails[0].value,
                    password: randomUUID(),
                    username: profile.name.givenName,
                });
            }
            return done(null, user);
        } catch (err) {
            console.log(err)
            return done(err);
        }
    }));

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((id, done) => {
    UserModel.findByPk(id, (err, user) => {
        done(err, user);
    });
});

// Routes

const router = express.Router();

router.get('/login/google', async (req, res, next) => {
    const _url = new URL('https://accounts.google.com/o/oauth2/v2/auth');

    _url.searchParams.append('client_id', clientID);
    _url.searchParams.append('redirect_uri', callbackURL);
    _url.searchParams.append('scope', GOOGLE_SCOPES.join(' '));
    _url.searchParams.append('prompt', 'consent');
    _url.searchParams.append('response_type', 'code');

    return res.json({ url: _url.href });
});

router.get('/login/google/callback', async (req, res, next) => {
    passport.authenticate('google', async (err, user) => {
        if (err || !user) {
            console.log("debug10")
            return res.status(401).json({ message: 'Authentication failed' });
        }
        try {
            const payload = { user: { id: user.id } };
            const secret = process.env.JWT_SECRET;
            const options = { expiresIn: '1d' };
            const token = jwt.sign(payload, secret, options);
            const expiresIn = 24 * 60; // 24h expiration date in minutes for react-auth-kit

            return res.redirect(`http://localhost:3000/login?token=${token}&expiresIn=1440&username=${user.username}&email=${user.email}`);
        } catch (error) {
            console.log(error)
            return res.status(500).json({ message: 'Server error' });
        }
    })(req, res, next);
});

router.post('/mobile/login/google', async (req, res, next) => {

});

router.post('/mobile/redirect', async (req, res, next) => {
    const url = JSON.stringify(req.body.url);
    res.redirect('mychat://' + url);
});


const googleRoutes = router;

export default googleRoutes;