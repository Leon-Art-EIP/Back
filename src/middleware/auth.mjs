import { verify } from "jsonwebtoken";
import logger from "../../config/logger.js"; // Assurez-vous d'importer correctement votre logger

export default (req, res, next) => /* istanbul ignore next */ {
  const token = req.header("Authorization");

  if (!token) {
    logger.warn("Authorization denied: No token provided");
    return res.status(401).json({ msg: "No token, authorization denied" });
  }

  try {
    const decoded = verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    logger.error("Invalid token", { error: err.message });
    res.status(401).json({ msg: "Invalid token" });
  }
};
