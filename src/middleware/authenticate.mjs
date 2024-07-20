import { verify } from "jsonwebtoken";
import logger from '../admin/logger.mjs' // Assurez-vous d'importer correctement votre logger

export function authenticate(req, res, next) /* istanbul ignore next */ {
  let token = req.header("Authorization");

  if (token && token.startsWith("Bearer ")) {
    token = token.slice(7, token.length); // extract the token from the "Bearer {token}" format
  }

  // Check if token exists
  if (!token) {
    logger.warn("Authorization denied: No token provided");
    return res.status(401).json({ msg: "No token, authorization denied" });
  }

  // Verify token
  try {
    const decoded = verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    logger.error("Invalid token", { error: err.message });
    res.status(401).json({ msg: "Token is not valid" });
  }
}
