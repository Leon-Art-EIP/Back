import { check, validationResult } from 'express-validator';

export const validateQuizz = [
  check('objective')
    .notEmpty().withMessage('Objective is required')
    .isIn(['sell', 'discover', 'both']).withMessage('Invalid objective'),
  
  check('artInterestType')
    .optional({ checkFalsy: true })
    .isArray().withMessage('Art interest types should be an array'),
  
  check('artSellingType')
    .optional({ checkFalsy: true })
    .isArray().withMessage('Art selling types should be an array'),

  check('location')
    .optional({ checkFalsy: true })
    .isString().withMessage('Location should be a string'),
  
  check('customCommands')
    .optional({ checkFalsy: true })
    .isString().withMessage('Custom commands should be a string')
    .isIn(['Yes', 'No', 'Maybe']).withMessage('Custom commands can only be "Yes", "No", or "Maybe"'),
  
  check('budget')
    .optional({ checkFalsy: true })
    .isString().withMessage('Budget should be a string'),

  check('discoveryMethod')
    .optional({ checkFalsy: true })
    .isString().withMessage('Discovery method should be a string'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) /* istanbul ignore next */ {
      return res.status(422).json({ errors: errors.array() });
    }
    next();
  }
];
