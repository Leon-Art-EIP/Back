const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const validate = require('../middleware/validation');

router.post('/signup', validate.validateSignup, authController.signup);
router.post('/login', authController.login);

module.exports = router;
