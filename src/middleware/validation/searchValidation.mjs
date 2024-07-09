import { query, validationResult } from 'express-validator';
import logger from '../../admin/logger.mjs';  // Assurez-vous d'importer votre logger correctement

export const validateSearch = [
  query('searchTerm').optional().isString().withMessage('Invalid search term'),
  query('artType').optional().custom((value) => {
    return Array.isArray(value.split(',')) && value.split(',').every(v => typeof v === 'string');
  }).withMessage('Invalid art type'),
  query('priceRange').optional().matches(/^\d+-\d+$/).withMessage('Invalid price range'),
  query('isForSale').optional().isBoolean().withMessage('Invalid sale status'),
  query('sort').optional().isIn(['popularity', 'recent']).withMessage('Invalid sort option'),
  query('page').optional().isNumeric().withMessage('Invalid page number'),
  query('limit').optional().isNumeric().withMessage('Invalid limit number'),

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
