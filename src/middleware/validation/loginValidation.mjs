import { check, validationResult } from "express-validator";
import logger from "../../../config/logger.js";  // Assurez-vous d'importer votre logger correctement

export const validateLogin = [
  check("email").isEmail().withMessage("Must be a valid email address"),
  check("password").not().isEmpty().withMessage("Password is required"),

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
