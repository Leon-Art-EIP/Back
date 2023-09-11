// /middleware/quizValidation.js

const { check, validationResult } = require('express-validator');

exports.validateQuiz = [
    // Validate the purpose: 'artist', 'discover', 'both'
    check('purpose')
        .optional()
        .isIn(['artist', 'discover', 'both'])
        .withMessage('Invalid purpose selection.'),

    // Validate art types (make sure they're one of the predefined choices)
    check('artType.*')
        .optional()
        .isIn(['paint', 'photography', 'drawings', 'sculpture', 'other'])
        .withMessage('Invalid art type.'),

    // Validate customCommands, only accepting boolean values
    check('customCommands')
        .optional()
        .isBoolean()
        .withMessage('Invalid input for custom commands preference.'),

    // Validate budget range
    check('budget')
        .optional()
        .isIn(['0-100', '100-500', '500-1000', '1000-10000', 'above 10000', 'not buying'])
        .withMessage('Invalid budget range.'),

    // Validate location (since it's a string, you might want to limit its length or pattern in the future)
    check('location')
        .optional()
        .isString()
        .withMessage('Invalid location input.'),

    // Validate the discovery source
    check('discoverSource')
        .optional()
        .isIn(['social networks', 'randomly', 'word of mouth', 'other'])
        .withMessage('Invalid discovery source.'),

    // Final middleware function to return validation results
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array().map(error => ({ msg: error.msg })) });
        }
        next();
    },
];
