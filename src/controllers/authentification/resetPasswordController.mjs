import { createTransport } from "nodemailer";
import { genSalt, hash } from "bcrypt";
import { randomBytes } from "crypto";
import jwt from "jsonwebtoken";
import db from "../../config/db.mjs";
import logger from "../../admin/logger.mjs"; // Assurez-vous que le chemin est correct

export async function requestReset(req, res) {
  const { email } = req.body;

  try {
    const userSnapshot = await db.collection('Users').where('email', '==', email).limit(1).get();
    if (userSnapshot.empty) {
      logger.warn("Email not found", { email });
      return res.status(404).json({ msg: "Email not found" });
    }
    const user = userSnapshot.docs[0].data();

    const token = randomBytes(20).toString("hex");

    const resetToken = { email, token, expire_at: new Date(Date.now() + 3600000) }; // 1-hour expiry
    const resetTokenRef = db.collection('ResetTokens').doc(email);
    await resetTokenRef.set(resetToken);

    let transporter = createTransport({
      service: "gmail",
      auth: {
        user: process.env.GOOGLE_MAIL_LEONART,
        pass: process.env.GOOGLE_MAIL_LEONART_PASSWORD,
      },
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
      if (error) {
        logger.error("Error sending the email", { error });
        return res.status(500).json({ msg: "Error sending the email" });
      }
      logger.info("Reset email sent", { email });
      res.json({ msg: "Reset email sent" });
    });
  } catch (err) {
    logger.error("Server Error", { error: err.message, stack: err.stack});
    res.status(500).json({ msg: "Server Error" });
  }
}

export async function validateResetToken(req, res) {
  const { token } = req.body;

  try {
    const resetTokenSnapshot = await db.collection('ResetTokens').where('token', '==', token).limit(1).get();
    if (resetTokenSnapshot.empty) {
      logger.warn("Invalid or expired token", { token });
      return res.status(404).json({ msg: "Invalid or expired token" });
    }

    res.json({ msg: "Valid token" });
  } catch (err) {
    logger.error("Server Error", { error: err.message, stack: err.stack});
    res.status(500).json({ msg: "Server Error" });
  }
}

export async function resetPassword(req, res) {
  const { token, newPassword } = req.body;

  try {
    const resetTokenSnapshot = await db.collection('ResetTokens').where('token', '==', token).limit(1).get();
    if (resetTokenSnapshot.empty) {
      logger.warn("Invalid or expired token", { token });
      return res.status(404).json({ msg: "Invalid or expired token" });
    }
    const resetToken = resetTokenSnapshot.docs[0].data();

    const userSnapshot = await db.collection('Users').where('email', '==', resetToken.email).limit(1).get();
    if (userSnapshot.empty) {
      logger.warn("Email not found", { email: resetToken.email });
      return res.status(404).json({ msg: "Email not found" });
    }
    const userDoc = userSnapshot.docs[0];
    const user = userDoc.data();

    const salt = await genSalt(10);
    const hashedPassword = await hash(newPassword, salt);
    await db.collection('Users').doc(userDoc.id).update({ password: hashedPassword });

    await db.collection('ResetTokens').doc(resetToken.email).delete();

    const payload = { user: { id: userDoc.id } };
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: Number(process.env.JWT_EXPIRATION) || 3600 },
      (err, token) => {
        if (err) {
          logger.error("Error generating token", { error: err.message, stack: err.stack});
          return res.status(500).json({ msg: "Error generating token" });
        }
        res.json({ token, msg: "Password reset successfully" });
        logger.info("Password reset successfully", { userId: userDoc.id });
      }
    );
  } catch (err) {
    logger.error("Server Error", { error: err.message, stack: err.stack});
    res.status(500).json({ msg: "Server Error" });
  }
}
