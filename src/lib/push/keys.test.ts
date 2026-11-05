import { describe, expect, it } from "vitest";
import webpush from "web-push";

import { pushKeysStatus } from "./keys";

describe("push keys shape", () => {
  const keys = webpush.generateVAPIDKeys();
  const subject = "mailto:contato@brandcodesolutions.com.br";

  it("accepts real keys", () => {
    expect(
      pushKeysStatus({ publicKey: keys.publicKey, privateKey: keys.privateKey, subject }),
    ).toBe("ok");
  });

  it("catches labels, spaces and swapped keys", () => {
    expect(
      pushKeysStatus({
        publicKey: `Public Key: ${keys.publicKey}`,
        privateKey: keys.privateKey,
        subject,
      }),
    ).toBe("invalid_public");
    expect(
      pushKeysStatus({ publicKey: `${keys.publicKey} `, privateKey: keys.privateKey, subject }),
    ).toBe("invalid_public");
    expect(
      pushKeysStatus({ publicKey: keys.privateKey, privateKey: keys.publicKey, subject }),
    ).toBe("invalid_public");
    expect(
      pushKeysStatus({
        publicKey: keys.publicKey,
        privateKey: keys.privateKey,
        subject: "contato@x.com",
      }),
    ).toBe("invalid_subject");
    expect(pushKeysStatus({})).toBe("missing");
  });
});
