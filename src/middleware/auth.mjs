import { verify } from "jsonwebtoken";
import logger from "../../admin/logger.mjs"; // Assurez-vous d'importer correctement votre logger

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
    logger.error("Invalid token", { error: err.message, stack: err.stack});
    res.status(401).json({ msg: "Invalid token" });
  }
};
