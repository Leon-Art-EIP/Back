import { check, validationResult } from 'express-validator';
import logger from '../../admin/logger.mjs'; // Assurez-vous d'importer votre logger correctement

export const validateUserId = [
  //check userId length = 20
  check('userId').isLength({ min: 20, max: 30 }).withMessage('User ID must be between 20 and 30 characters long'),

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
