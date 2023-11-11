import { query, validationResult } from 'express-validator';

export const validateSearch = [
  query('searchTerm').optional().isString().withMessage('Invalid search term'),
  query('artType').optional().isString().withMessage('Invalid art type'),
  query('priceRange').optional().matches(/^\d+-\d+$/).withMessage('Invalid price range'),
  query('isForSale').optional().isBoolean().withMessage('Invalid sale status'),
  query('sort').optional().isIn(['popularity', 'recent']).withMessage('Invalid sort option'),
  query('page').optional().isNumeric().withMessage('Invalid page number'),
  query('limit').optional().isNumeric().withMessage('Invalid limit number'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array().map(error => ({ msg: error.msg })) });
    }
    next();
  },
];
