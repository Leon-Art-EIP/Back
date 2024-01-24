import { verify } from "jsonwebtoken";

export function authenticate(req, res, next) {
  let token = req.header("Authorization");

  if (token && token.startsWith("Bearer ")) {
    token = token.slice(7, token.length); // extract the token from the "Bearer {token}" format
  }

  // Check if token exists
  if (!token) {
    return res.status(401).json({ msg: "No token, authorization denied" });
  }

  // Verify token
  try {
    const decoded = verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    console.error(err.message);
    res.status(401).json({ msg: "Token is not valid" });
  }
}