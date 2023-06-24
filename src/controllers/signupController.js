const { User } = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.signup = async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(409).json({ msg: 'Email already in use' });
        }

        // Create new user
        user = new User({ username, email, password });

        // Hash password and save user to database
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();

        // Generate and return jwt token
        const payload = {
            user: { id: user.id },
        };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 3600 }, (err, token) => {
            /* istanbul ignore next */
            if (err) {
                console.error(err.message);
                return res.status(500).json({ msg: 'Error generating token' });
            }
            res.json({ token });
        });
    } catch (err) /* istanbul ignore next */ {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};