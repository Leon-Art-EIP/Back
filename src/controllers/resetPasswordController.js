const { User } = require('../models/User');
const { ResetToken } = require('../models/ResetPasswordToken');
const nodemailer = require('nodemailer');
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
        console.log(                "user: " + process.env.GOOGLE_MAIL_LEONART +
            "pass: " + process.env.GOOGLE_MAIL_LEONART_PASSWORD);
        // Configure the nodemailer transporter
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GOOGLE_MAIL_LEONART,
                pass: process.env.GOOGLE_MAIL_LEONART_PASSWORD
            },
            // This is important to bypass server identity checks:
            tls: {
                rejectUnauthorized: false
            }
        });

        let mailOptions = {
            from: 'leonart.projet@gmail.com',
            to: email,
            subject: 'Password Reset',
            text: `You requested a password reset. Click here to reset your password: ${process.env.BASE_WEB_URL}/reset?token=${token}`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
                return res.status(500).json({ msg: 'Error sending the email' });
            }
            res.json({ msg: 'Reset email sent' });
        });

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