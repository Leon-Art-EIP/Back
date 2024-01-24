import { check, validationResult } from "express-validator";
import zxcvbn from "zxcvbn";

export const validateChangePassword = [
  check("currentPassword")
    .not()
    .isEmpty()
    .withMessage("Current password is required"),

  check("newPassword")
    .isLength({ min: 8 })
    .withMessage("New password must be at least 8 characters long")
    .custom((value) => {
      const result = zxcvbn(value);
      if (result.score < 3) {
        throw new Error("New password is too weak");
      } else {
        return true;
      }
    }),

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