import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

const KEY_LENGTH = 64;
const SALT_LENGTH = 32;
const SEPARATOR = ":";

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH).toString("hex");
  const derivedKey = scryptSync(password, salt, KEY_LENGTH);
  return salt + SEPARATOR + derivedKey.toString("hex");
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  const [salt, key] = hash.split(SEPARATOR);
  if (!salt || !key) return false;

  const derivedKey = scryptSync(password, salt, KEY_LENGTH);
  const keyBuffer = Buffer.from(key, "hex");
  const derivedBuffer = Buffer.from(derivedKey);

  if (keyBuffer.length !== derivedBuffer.length) return false;

  return timingSafeEqual(keyBuffer, derivedBuffer);
}
