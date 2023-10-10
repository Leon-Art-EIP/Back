import { check, validationResult } from 'express-validator';

export const validateArticle = [
  check('title').notEmpty().withMessage('Title is required'),
  check('mainImage').notEmpty().withMessage('Main image is required'),
  check('content').notEmpty().withMessage('Content is required'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array().map(error => ({ msg: error.msg })) });
    }
    next();
  },
];
