const { check, validationResult } = require('express-validator');
const zxcvbn = require('zxcvbn');

exports.validateSignup = [
    check('username')
        .not()
        .isEmpty()
        .withMessage('Username is required'),
    check('email')
        .isEmail()
        .withMessage('Must be a valid email address'),
    check('password')
        .custom((value) => {
            const result = zxcvbn(value);
            if (result.score < 3) { // or whatever score you choose
                throw new Error('Password is too weak');
            } else {
                return true;
            }
        }),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }
        next();
    },
];
