import { check, validationResult } from 'express-validator';

export const validateCollection = [
  check('artPublicationId').isMongoId().withMessage('Invalid art publication ID'),
  check('collectionName').notEmpty().withMessage('Collection name is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) /* istanbul ignore next */ {
      return res.status(422).json({ errors: errors.array() });
    }
    next();
  },
];