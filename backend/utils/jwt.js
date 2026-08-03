import jwt from "jsonwebtoken";

const EXPIRES_IN = "30d";

export function signToken(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return jwt.sign({ sub: user._id.toString(), email: user.email }, secret, {
    expiresIn: EXPIRES_IN,
  });
}

export function verifyToken(token) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return jwt.verify(token, secret);
}
