import "server-only";

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

import { requireServerEnv } from "@/lib/env";

/** AES-256-GCM with ENCRYPTION_KEY. Output: base64(iv[12] + tag[16] + ciphertext). */
export function encrypt(plain: string, key: Buffer = keyFromEnv()): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString("base64");
}

export function decrypt(payload: string, key: Buffer = keyFromEnv()): string {
  const raw = Buffer.from(payload, "base64");
  const decipher = createDecipheriv("aes-256-gcm", key, raw.subarray(0, 12));
  decipher.setAuthTag(raw.subarray(12, 28));
  return Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString("utf8");
}

function keyFromEnv(): Buffer {
  return Buffer.from(requireServerEnv("ENCRYPTION_KEY").ENCRYPTION_KEY, "base64");
}
