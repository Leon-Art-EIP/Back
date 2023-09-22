import jwt from "jsonwebtoken";

export const isTokenValid = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return !!decoded; // Returns true if the token is decoded successfully
  } catch (err) {
    console.error("Invalid Token: ", err.message);
    return false; // Token is not valid or expired
  }
};
