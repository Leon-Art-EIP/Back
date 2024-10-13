import { Router } from "express";
const router = Router();
import { login } from "../controllers/authentification/loginController.mjs";
import { validateLogin } from "../middleware/validation/loginValidation.mjs";
import { signup } from "../controllers/authentification/signupController.mjs";
import { validateSignup } from "../middleware/validation/signupValidation.mjs";
import {
  requestReset,
  validateResetToken,
  resetPassword,
} from "../controllers/authentification/resetPasswordController.mjs";
import { validateResetPassword } from "../middleware/validation/resetPasswordValidation.mjs";
import { changePassword } from "../controllers/authentification/changePasswordController.mjs";
import { validateChangePassword } from "../middleware/validation/changePasswordValidation.mjs";
import { authenticate } from "../middleware/authenticate.mjs";


/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Register a new user
 *     description: |
 *       Register a new user in the system by providing a username, email, and password in JSON format.
 *       Returns a JWT token if successful. The token is valid for 1 hour.
 *       
 *       **Username Requirements:**
 *       - Must be between 3 and 20 characters.
 *       - Must contain only letters, numbers, and underscores.
 *       
 *       **Password Requirements:**
 *       - Must be at least 8 characters long.
 *       - Must contain at least one uppercase letter.
 *       - Must contain at least one number.
 *       
 *       **Optional Fields:**
 *       - `is_artist`: Indicates if the user is an artist.
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
 *                 example: userBasic
 *               email:
 *                 type: string
 *                 format: email
 *                 description: The user's email address.
 *                 example: userBasic@example.com
 *               password:
 *                 type: string
 *                 description: |
 *                   The user's password:
 *                   - At least 8 characters long.
 *                   - Contains at least one uppercase letter.
 *                   - Contains at least one number.
 *                 example: Password123
 *               is_artist:
 *                 type: boolean
 *                 description: Indicates if the user is an artist or not.
 *                 example: true
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
 *         description: Validation error (e.g., invalid username, email format, or password not meeting criteria).
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
 *       Returns a JWT token and user details if successful. The token is valid for 1 hour.
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
 *                 example: userBasic@example.com
 *               password:
 *                 type: string
 *                 description: The user's password.
 *                 example: StrongPassword123*
 *     responses:
 *       200:
 *         description: The user was successfully logged in with user details.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT token for the logged-in user. Valid for 1 hour.
 *                 user:
 *                   type: object
 *                   description: The logged-in user's details.
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: Unique identifier for the user.
 *                     username:
 *                       type: string
 *                       description: Username of the user.
 *                     email:
 *                       type: string
 *                       format: email
 *                       description: Email address of the user.
 *                     is_artist:
 *                       type: boolean
 *                       description: Indicates if the user is an artist.
 *                     availability:
 *                       type: string
 *                       description: Availability status of the user.
 *                     subscription:
 *                       type: string
 *                       description: Subscription status of the user.
 *                     collections:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: Collection of items associated with the user.
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
 * /api/auth/validate-reset-token:
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
router.post("/validate-reset-token", validateResetToken);

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

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: Change a user's password
 *     description: Allows a logged-in user to change their password.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []  # Requires a valid JWT token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: The user's current password.
 *                 example: CurrentPassword123*
 *               newPassword:
 *                 type: string
 *                 description: The user's new password (min. 8 characters, strong).
 *                 example: NewPassword123*!
 *     responses:
 *       200:
 *         description: Password changed successfully.
 *       400:
 *         description: Incorrect current password.
 *       422:
 *         description: Validation error (e.g., weak new password).
 *       500:
 *         description: Server Error.
 */
router.post("/change-password", authenticate, validateChangePassword, changePassword);


export default router;
