import { check, validationResult } from "express-validator";

export const validateLogin = [
  check("email").isEmail().withMessage("Must be a valid email address"),

  check("password").not().isEmpty().withMessage("Password is required"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(422)
        .json({ errors: errors.array().map((error) => ({ msg: error.msg })) });
    }
    next();
  },
];
