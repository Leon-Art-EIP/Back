import { check, validationResult } from 'express-validator';

export const validateUserId = [
    check('userId').isMongoId().withMessage('Invalid User ID'),
  
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) /* istanbul ignore next */ {
        return res.status(422).json({ errors: errors.array().map(error => ({ msg: error.msg })) });
      }
      next();
    },
  ];
  