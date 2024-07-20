import { check, validationResult } from 'express-validator';
import logger from '../../admin/logger.mjs';

export const validateArtPublication = [
  (req, res, next) => {
    if (!req.file) {
      const errorMsg = 'Image is required';
      logger.warn(`Validation error: ${errorMsg}`);
      return res.status(422).json({ errors: [{ msg: errorMsg }] });
    }
    next();
  },
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
      const errorMessages = errors.array().map(error => ({ msg: error.msg }));
      logger.warn(`Validation errors: ${JSON.stringify(errorMessages)}`, { errors: errorMessages });
      return res.status(422).json({ errors: errorMessages });
    }
    next();
  },
];

export const validateArtPublicationId = [
  check('id').isLength({ min: 20, max: 20 }).withMessage('Invalid Art Publication ID'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) /* istanbul ignore next */ {
      const errorMessages = errors.array().map(error => ({ msg: error.msg }));
      logger.warn(`Validation errors: ${JSON.stringify(errorMessages)}`, { errors: errorMessages });
      return res.status(422).json({ errors: errorMessages });
    }
    next();
  },
];
