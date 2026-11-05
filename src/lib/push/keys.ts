/**
 * Shape check of the VAPID keys (never their values): the public key is a P-256 point (65 bytes,
 * 0x04 first), the private key 32 bytes, both base64url. Catches keys pasted with labels, spaces
 * or swapped.
 */
export type PushKeysStatus =
  "ok" | "missing" | "invalid_public" | "invalid_private" | "invalid_subject";

function decodedLength(value: string): number | null {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) return null;
  return Buffer.from(value, "base64url").length;
}

export function pushKeysStatus(env: {
  publicKey?: string;
  privateKey?: string;
  subject?: string;
}): PushKeysStatus {
  if (!env.publicKey || !env.privateKey) return "missing";
  if (decodedLength(env.publicKey) !== 65 || Buffer.from(env.publicKey, "base64url")[0] !== 4)
    return "invalid_public";
  if (decodedLength(env.privateKey) !== 32) return "invalid_private";
  if (!env.subject?.startsWith("mailto:") && !env.subject?.startsWith("https://"))
    return "invalid_subject";
  return "ok";
}
