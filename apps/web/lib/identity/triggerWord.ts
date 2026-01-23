import crypto from "crypto";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export function generateIdentityTriggerWord(): string {
  // "ID_" + 6-8 chars, max 16 total (fits DB constraint)
  const len = 8;
  const bytes = crypto.randomBytes(len);
  let token = "";
  for (let i = 0; i < len; i++) {
    token += ALPHABET[bytes[i] % ALPHABET.length];
  }
  const out = `ID_${token}`;
  // Safety clamp (policy + DB)
  return out.slice(0, 16);
}

export function isSafeTriggerWord(token: string): boolean {
  return /^[A-Z0-9_]{3,16}$/.test(token);
}

