import { describe, expect, it } from "vitest";

import { isEmbeddable, isSelfFramable, securityHeaders } from "@/lib/security-headers";

describe("security headers", () => {
  it("only the chat page can be embedded", () => {
    expect(isEmbeddable("/studio-bela/agendar")).toBe(true);
    expect(isEmbeddable("/studio-bela")).toBe(false);
    expect(isEmbeddable("/painel/agendar")).toBe(false);
    expect(isEmbeddable("/painel/agenda")).toBe(false);
  });

  it("the business page can only be framed by the same origin (panel preview)", () => {
    expect(isSelfFramable("/studio-bela")).toBe(true);
    expect(isSelfFramable("/painel")).toBe(false);
    expect(isSelfFramable("/painel/pagina")).toBe(false);
    const page = securityHeaders("/studio-bela");
    expect(page["X-Frame-Options"]).toBe("SAMEORIGIN");
    expect(page["Content-Security-Policy"]).toContain("frame-ancestors 'self'");
  });

  it("denies framing everywhere else", () => {
    const panel = securityHeaders("/painel/pagina");
    expect(panel["X-Frame-Options"]).toBe("DENY");
    expect(panel["Content-Security-Policy"]).toContain("frame-ancestors 'none'");
    const chat = securityHeaders("/studio-bela/agendar");
    expect(chat["X-Frame-Options"]).toBeUndefined();
    expect(chat["Content-Security-Policy"]).toContain("frame-ancestors *");
    expect(chat["Strict-Transport-Security"]).toContain("max-age=");
  });
});
