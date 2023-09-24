import { check, validationResult } from 'express-validator';

export const validateComment = [
  check('text').notEmpty().withMessage('Comment text is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    next();
  },
];