import { check, validationResult } from "express-validator";
import zxcvbn from "zxcvbn";
import logger from "../../../config/logger.js";  // Assurez-vous d'importer votre logger correctement

export const validateResetPassword = [
  check("newPassword")
    .not()
    .isEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .custom((value) => {
      const result = zxcvbn(value);
      if (result.score < 3) {
        throw new Error("Password is too weak");
      } else {
        return true;
      }
    }),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map((error) => ({ msg: error.msg }));
      logger.warn(`Validation errors: ${JSON.stringify(errorMessages)}`, { errors: errorMessages });
      return res
        .status(422)
        .json({ errors: errorMessages });
    }
    next();
  },
];
