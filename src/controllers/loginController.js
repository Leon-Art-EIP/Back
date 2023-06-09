const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if user exists
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ msg: 'Email not registered' });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ msg: 'Incorrect password' });
        }

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
    }
    catch (err) /* istanbul ignore next */ {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};
