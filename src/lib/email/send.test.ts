import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { senderFor } = await import("./send");
const brand = { emailFrom: { name: "Lively Beauty", address: "contato@beauty.example.com" } };

describe("senderFor", () => {
  it("uses the brand sender by default", () => {
    expect(senderFor(brand)).toBe("Lively Beauty <contato@beauty.example.com>");
  });
  it("a bare RESEND_FROM address keeps the brand name", () => {
    expect(senderFor(brand, "nao-responda@topsitebr.com.br")).toBe(
      "Lively Beauty <nao-responda@topsitebr.com.br>",
    );
  });
  it("a full RESEND_FROM replaces everything", () => {
    expect(senderFor(brand, "Agendamo <oi@x.com>")).toBe("Agendamo <oi@x.com>");
  });
});
