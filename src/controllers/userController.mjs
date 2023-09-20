import { User } from '../models/User.mjs';

export const checkUsernameAvailability = async (req, res) => {
    const username = req.params.username;

    try {
        // Sanitize and Validate username input
        if (!username || username.length < 3 || username.length > 20 || !/^\w+$/.test(username)) {
            return res.status(400).json({ msg: 'Invalid username format' });
        }

        // Check username against the database
        const user = await User.findOne({ username });
        if (user) {
            return res.status(409).json({ msg: 'Username is already in use' });
        }

        return res.json({ msg: 'Username is available' });

    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ msg: 'Server Error' });
    }
};

export const checkEmailAvailability = async (req, res) => {
    const email = req.params.email;

    try {
        // Validate email format
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!email || !emailRegex.test(email)) {
            return res.status(400).json({ msg: 'Invalid email format' });
        }

        // Check email against the database
        const user = await User.findOne({ email });
        if (user) {
            return res.status(409).json({ msg: 'Email is already in use' });
        }

        return res.json({ msg: 'Email is available' });

    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ msg: 'Server Error' });
    }
};
