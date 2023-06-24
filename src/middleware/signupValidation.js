const { check, validationResult } = require('express-validator');
const zxcvbn = require('zxcvbn');

exports.validateSignup = [
    check('username')
        .not()
        .isEmpty()
        .withMessage('Username is required')
        .isLength({ min: 3, max: 20 })
        .withMessage('Username must be between 3 and 20 characters')
        .matches(/^\w+$/)
        .withMessage('Username must contain only letters, numbers, and underscores'),

    check('email')
        .isEmail()
        .withMessage('Must be a valid email address'),

    check('password')
        .not()
        .isEmpty()
        .withMessage('Password is required')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .custom((value) => {
            const result = zxcvbn(value);
            if (result.score < 3) {
                throw new Error('Password is too weak');
            } else {
                return true;
            }
        }),
        
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array().map(error => ({ msg: error.msg })) });
        }
        next();
    },
];
