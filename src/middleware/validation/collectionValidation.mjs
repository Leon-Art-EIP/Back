import { check, validationResult } from 'express-validator';
import logger from '../../admin/logger.mjs';  // Assurez-vous d'importer votre logger correctement

export const validateCollection = [
  check('artPublicationId').isLength({ min: 1 }).withMessage('Invalid art publication ID'),
  check('collectionName').notEmpty().withMessage('Collection name is required'),
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

export const validateCollectionName = [
  check('collectionName').notEmpty().isString().withMessage('Collection name is required'),
  (req, res, next) => /* istanbul ignore next */ {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => ({ msg: error.msg }));
      logger.warn(`Validation errors: ${JSON.stringify(errorMessages)}`, { errors: errorMessages });
      return res.status(422).json({ errors: errorMessages });
    }
    next();
  },
];
