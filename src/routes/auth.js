const express = require('express');
const router = express.Router();
const signupController = require('../controllers/signupController');
const loginController = require('../controllers/loginController');
const validate = require('../middleware/validation');

router.post('/signup', validate.validateSignup, signupController.signup);
router.post('/login', loginController.login);

module.exports = router;
