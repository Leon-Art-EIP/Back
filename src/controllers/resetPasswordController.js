const { User } = require('../models/User');
const { ResetToken } = require('../models/ResetToken');
const crypto = require('crypto');

exports.requestReset = async (req, res) => {
    const { email } = req.body;

    try {
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ msg: 'Email not found' });
        }

        const token = crypto.randomBytes(20).toString('hex');

        const resetToken = new ResetToken({ email, token });
        await resetToken.save();

        // TODO: Send email with link containing the token
        // Example: https://frontend/reset?token=token_value

        res.json({ msg: 'Reset email sent' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};

exports.validateToken = async (req, res) => {
    const { token } = req.body;

    try {
        const resetToken = await ResetToken.findOne({ token });
        if (!resetToken) {
            return res.status(404).json({ msg: 'Invalid or expired token' });
        }

        res.json({ msg: 'Valid token' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};

exports.resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;

    try {
        const resetToken = await ResetToken.findOne({ token });
        if (!resetToken) {
            return res.status(404).json({ msg: 'Invalid or expired token' });
        }

        let user = await User.findOne({ email: resetToken.email });
        if (!user) {
            return res.status(404).json({ msg: 'Email not found' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        // Optionally, delete the used token
        await ResetToken.deleteOne({ token });

        res.json({ msg: 'Password reset successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};