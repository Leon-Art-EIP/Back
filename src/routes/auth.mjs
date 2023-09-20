import express from 'express';
import { signup } from '../controllers/signupController.mjs';
import { login } from '../controllers/loginController.mjs';
import { validateSignup } from '../middleware/signupValidation.mjs';
import { validateLogin } from '../middleware/loginValidation.mjs';

const router = express.Router();

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
 *                 example: StrongPassword123
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
router.post('/signup', validateSignup, signup);

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
router.post('/login', validateLogin, login);

export default router;
