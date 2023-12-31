import { User } from "../../models/userModel.mjs";
import { ResetToken } from "../../models/resetPasswordTokenModel.mjs";
import { isTokenValid } from "../../utils/tokenValidation.mjs";
import { createTransport } from "nodemailer";
import { genSalt, hash } from "bcrypt";
import { randomBytes } from "crypto";
import jwt from "jsonwebtoken";

export async function requestReset(req, res) {
  const { email } = req.body;

  try {
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ msg: "Email not found" });
    }

    const token = randomBytes(20).toString("hex");

    let resetToken = await ResetToken.findOne({ email });

    if (!resetToken) {
      resetToken = new ResetToken({ email, token });
    } else /* istanbul ignore next */ {
      resetToken.token = token;
    }

    await resetToken.save();

    // Configure the nodemailer transporter
    let transporter = createTransport({
      service: "gmail",
      auth: {
        user: process.env.GOOGLE_MAIL_LEONART,
        pass: process.env.GOOGLE_MAIL_LEONART_PASSWORD,
      },
      // This is important to bypass server identity checks:
      tls: {
        rejectUnauthorized: false,
      },
    });

    let mailOptions = {
      from: "leonart.projet@gmail.com",
      to: email,
      subject: "Password Reset",
      text: `You requested a password reset. Click here to reset your password: ${process.env.BASE_WEB_URL}/reset_password/${token}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) /* istanbul ignore next */ {
        console.log(error);
        return res.status(500).json({ msg: "Error sending the email" });
      }
      res.json({ msg: "Reset email sent" });
    });
  } catch (err) /* istanbul ignore next */ {
    console.error(err.message);
    res.status(500).json({ msg: "Server Error" });
  }
}

export async function validateResetToken(req, res) {
  const { token } = req.body;

  try {
    const resetToken = await ResetToken.findOne({ token });
    if (!resetToken) {
      return res.status(404).json({ msg: "Invalid or expired token" });
    }

    res.json({ msg: "Valid token" });
  } catch (err) /* istanbul ignore next */ {
    console.error(err.message);
    res.status(500).json({ msg: "Server Error" });
  }
}

export async function resetPassword(req, res) {
  const { token, newPassword } = req.body;

  try {
    const resetToken = await ResetToken.findOne({ token });
    if (!resetToken) {
      return res.status(404).json({ msg: "Invalid or expired token" });
    }

    let user = await User.findOne({ email: resetToken.email });
    if (!user) /* istanbul ignore next */ {
      return res.status(404).json({ msg: "Email not found" });
    }

    const salt = await genSalt(10);
    user.password = await hash(newPassword, salt);
    await user.save();

    // delete the used token
    await ResetToken.deleteOne({ token });

    // Generate and return JWT token after password reset
    const payload = {
      user: { id: user.id },
    };
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: Number(process.env.JWT_EXPIRATION) || 3600 },
      (err, token) => {
        if (err) /* istanbul ignore next */ {
          console.error(err.message);
          return res.status(500).json({ msg: "Error generating token" });
        }
        res.json({ token, msg: "Password reset successfully" });
      }
    );
  } catch (err) /* istanbul ignore next */ {
    console.error(err.message);
    res.status(500).json({ msg: "Server Error" });
  }
}
