import { Router } from "express";
const router = Router();
import { login } from "../controllers/loginController.mjs";
import { validateLogin } from "../middleware/loginValidation.mjs";
import { signup } from "../controllers/signupController.mjs";
import { validateSignup } from "../middleware/signupValidation.mjs";
import {
  requestReset,
  validateResetToken,
  resetPassword,
} from "../controllers/resetPasswordController.mjs";
import { validateResetPassword } from "../middleware/resetPasswordValidation.mjs";

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Register a new user
 *     description: |
 *       Register a new user in the system by providing a username, email, and password in JSON format.
 *       Returns a JWT token if successful. The token is valid for 1 hour.
 *       Username must be between 3 and 20 characters and contain only letters, numbers, and underscores.
 *       Password must be at least 8 characters long and should not be too weak.
 *     tags: [Auth]
 *     security: []  # Indicates this endpoint doesn't require any security (tokens).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: The user's username (3-20 characters, letters, numbers, underscores).
 *                 example: user1
 *               email:
 *                 type: string
 *                 format: email
 *                 description: The user's email address.
 *                 example: user1@example.com
 *               password:
 *                 type: string
 *                 description: The user's password (min. 8 characters).
 *                 example: StrongPassword123*[
 *     responses:
 *       200:
 *         description: The user was successfully registered.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT token for the registered user. Valid for 1 hour.
 *       409:
 *         description: The email is already in use.
 *       422:
 *         description: Validation error (e.g. invalid username, email format, or weak password).
 *       500:
 *         description: Server Error.
 */
router.post("/signup", validateSignup, signup);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login a user
 *     description: |
 *       Login a user into the system by providing a valid email and password in JSON format.
 *       Returns a JWT token if successful. The token is valid for 1 hour.
 *     tags: [Auth]
 *     security: []  # Indicates this endpoint doesn't require any security (tokens).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: The user's email address.
 *                 example: user1@example.com
 *               password:
 *                 type: string
 *                 description: The user's password.
 *                 example: user1Password
 *     responses:
 *       200:
 *         description: The user was successfully logged in.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT token for the logged in user. Valid for 1 hour.
 *       401:
 *         description: Incorrect password or email not registered.
 *       422:
 *         description: Validation error (e.g. invalid email format or empty password).
 *       500:
 *         description: Server Error.
 */
router.post("/login", validateLogin, login);
/**
 * @swagger
 * /api/auth/request-reset:
 *   post:
 *     summary: Request a password reset
 *     description: |
 *       Allows a user to request a password reset. If the email is found in the database,
 *       a reset token will be generated and an email will be sent to the user with a link to reset their password.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: The user's email for which the password needs to be reset.
 *                 example: example@example.com
 *     responses:
 *       200:
 *         description: Reset email sent successfully.
 *       404:
 *         description: Email not found.
 *       500:
 *         description: Server Error.
 */
router.post("/request-reset", requestReset);

/**
 * @swagger
 * /api/auth/validate-token:
 *   post:
 *     summary: Validate reset token
 *     description: |
 *       Validate the token provided by the user to ensure it's a valid and non-expired token.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 description: The reset token received in the email.
 *                 example: abcd1234efgh5678
 *     responses:
 *       200:
 *         description: Valid token.
 *       404:
 *         description: Invalid or expired token.
 *       500:
 *         description: Server Error.
 */
router.post("/validate-token", validateResetToken);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password using token
 *     description: |
 *       Allows a user to reset their password using a valid token they received in their email.
 *       The new password must be at least 8 characters long and should not be weak (score of at least 3 using zxcvbn).
 *       Returns a JWT token upon successful reset.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 description: The reset token received in the email.
 *                 example: abcd1234efgh5678
 *               newPassword:
 *                 type: string
 *                 description: The new password the user wants to set. It should be at least 8 characters and should have a zxcvbn score of at least 3.
 *                 example: NewPassword123!
 *     responses:
 *       200:
 *         description: Password reset successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT token for the user.
 *                 msg:
 *                   type: string
 *                   description: Success message.
 *       404:
 *         description: Invalid token or email not found.
 *       422:
 *         description: Password validation error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       msg:
 *                         type: string
 *                   description: List of validation error messages.
 *       500:
 *         description: Server Error.
 */
router.post("/reset-password", validateResetPassword, resetPassword);

export default router;
