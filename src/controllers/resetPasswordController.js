const { User } = require('../models/User');
const { ResetToken } = require('../models/ResetPasswordToken');
const crypto = require('crypto');

const nodemailer = require('nodemailer');
const mg = require('nodemailer-mailgun-transport');

const auth = {
    auth: {
        api_key: process.env.MAILGUN_API_KEY, // Mailgun API Key
        domain: process.env.MAILGUN_DOMAIN, // Your Mailgun Domain
    }
}

const transporter = nodemailer.createTransport(mg(auth));


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
        const mailOptions = {
            from: 'no-reply@yourdomain.com', // Replace with your email or domain
            to: email, // User email
            subject: 'Password Reset Request',
            html: `<p>You requested a password reset. Click <a href="${process.env.BASE_WEB_URL}/reset?token=${token}">here</a> to reset your password.</p>`
        };
        
        transporter.sendMail(mailOptions, function(err, info) {
            if (err) {
                console.error("Error sending email", err);
                return res.status(500).json({ msg: 'Error sending reset email' });
            } else {
                console.log("Email sent successfully", info);
                res.json({ msg: 'Reset email sent' });
            }
        });

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