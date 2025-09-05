import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

export function verifyToken(token) {
  try {
    if (token) {
      return jwt.verify(token, JWT_SECRET)
    }
  } catch (error) {
    return null;
  }
}
