import crypto from "crypto";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export function generateIdentityTriggerWord(): string {
  const len = 8;
  const bytes = crypto.randomBytes(len);
  let token = "";
  for (let i = 0; i < len; i++) {
    token += ALPHABET[bytes[i] % ALPHABET.length];
  }
  const out = `ID_${token}`;
  return out.slice(0, 16);
}

export function isSafeTriggerWord(token: string): boolean {
  return /^[A-Z0-9_]{3,16}$/.test(token);
}
