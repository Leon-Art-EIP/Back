import { check, validationResult } from 'express-validator';

export const validateArtPublication = [
  check('image').notEmpty().withMessage('Image is required'),
  check('artType').notEmpty().withMessage('Art type is required'),
  check('name').notEmpty().withMessage('Name is required'),
  check('description').optional().isString().withMessage('Invalid description'),
  check('dimension').optional().isString().withMessage('Invalid dimension'),
  check('isForSale').optional().isBoolean().withMessage('Invalid for-sale status'),
  check('price').optional().isNumeric().withMessage('Invalid price'),
  check('location').optional().isString().withMessage('Invalid location'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array().map(error => ({ msg: error.msg })) });
    }
    next();
  },
];

export const validateArtPublicationId = [
  check('id').isMongoId().withMessage('Invalid Art Publication ID'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array().map(error => ({ msg: error.msg })) });
    }
    next();
  },
];