import jwt from "jsonwebtoken";
import type { StringValue } from "ms";

const EMAIL_TOKEN_SECRET = process.env.EMAIL_TOKEN_SECRET!; // set in .env

export function issueEmailToken(payload: { id: number; email: string }, ttl: StringValue = "30Min") {
  return jwt.sign(payload, EMAIL_TOKEN_SECRET, { expiresIn: ttl });
}
export function verifyEmailToken(token: string) {
  return jwt.verify(token, EMAIL_TOKEN_SECRET) as { id: number; email: string; iat: number; exp: number };
}
