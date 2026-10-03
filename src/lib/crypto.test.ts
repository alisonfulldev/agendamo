import { randomBytes } from "node:crypto";

import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { decrypt, encrypt } = await import("@/lib/crypto");

describe("AES-256-GCM helpers", () => {
  const key = randomBytes(32);

  it("round-trips and uses a fresh IV each time", () => {
    const a = encrypt("token-secreto", key);
    const b = encrypt("token-secreto", key);
    expect(a).not.toBe(b);
    expect(decrypt(a, key)).toBe("token-secreto");
  });

  it("rejects tampered ciphertext and wrong keys", () => {
    const payload = Buffer.from(encrypt("abc", key), "base64");
    payload[payload.length - 1]! ^= 1;
    expect(() => decrypt(payload.toString("base64"), key)).toThrow();
    expect(() => decrypt(encrypt("abc", key), randomBytes(32))).toThrow();
  });
});
