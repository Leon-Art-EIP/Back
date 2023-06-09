const express = require('express');
const router = express.Router();
const signupController = require('../controllers/signupController');
const loginController = require('../controllers/loginController');
const validate = require('../middleware/validation');


/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Register a new user
 *     description: Register a new user in the system by username, email, and password. Returns a JWT token if successful.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: The user's username.
 *               email:
 *                 type: string
 *                 description: The user's email.
 *               password:
 *                 type: string
 *                 description: The user's password.
 *             example:
 *               username: user1
 *               email: user1@example.com
 *               password: user1Password
 *     responses:
 *       200:
 *         description: The user was successfully created.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT token for the registered user.
 *       409:
 *         description: The email is already in use.
 *       422:
 *         description: The input is invalid.
 *       500:
 *         description: Server Error.
 */
router.post('/signup', validate.validateSignup, signupController.signup);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login a user
 *     description: Login a user into the system by email and password. Returns a JWT token if successful.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: The user's email.
 *               password:
 *                 type: string
 *                 description: The user's password.
 *             example:
 *               email: user1@example.com
 *               password: user1Password
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
 *                   description: JWT token for the logged in user.
 *       401:
 *         description: Incorrect password or email not registered.
 *       500:
 *         description: Server Error.
 */
router.post('/login', loginController.login);

module.exports = router;
