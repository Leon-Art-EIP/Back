const { User } = require('../models/User');

exports.submitQuiz = async (req, res) => {
    try {
        const userId = req.user.id; // Get the user ID from the token

        // Update the user's profile with the quiz answers
        await User.findByIdAndUpdate(userId, { $set: req.body });

        return res.json({ msg: 'Quiz submitted successfully!' });
    }
    catch (err) {
        console.error(err.message);
        return res.status(500).json({ msg: 'Server Error' });
    }
};
