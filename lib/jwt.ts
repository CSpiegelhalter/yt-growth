import jwt from "jsonwebtoken";
import type { StringValue } from "ms";

const EMAIL_TOKEN_SECRET = process.env.EMAIL_TOKEN_SECRET!; // set in .env

export function verifyEmailToken(token: string) {
  return jwt.verify(token, EMAIL_TOKEN_SECRET) as { id: number; email: string; iat: number; exp: number };
}

/**
 * Issue a password reset token (expires in 1 hour)
 */
export function issuePasswordResetToken(payload: { id: number; email: string }, ttl: StringValue = "1h") {
  return jwt.sign({ ...payload, purpose: "password_reset" }, EMAIL_TOKEN_SECRET, { expiresIn: ttl });
}

/**
 * Verify a password reset token
 */
export function verifyPasswordResetToken(token: string) {
  const decoded = jwt.verify(token, EMAIL_TOKEN_SECRET) as {
    id: number;
    email: string;
    purpose?: string;
    iat: number;
    exp: number;
  };
  
  // Ensure this is a password reset token, not a general email token
  if (decoded.purpose !== "password_reset") {
    throw new Error("Invalid token type");
  }
  
  return decoded;
}
