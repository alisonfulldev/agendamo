import { describe, expect, it } from "vitest";

import { signupOrigin } from "./signup-origin";

describe("signupOrigin", () => {
  it("names AI assistants from the UTM tag or the referring site", () => {
    expect(signupOrigin({ utm_source: "chatgpt.com", landing: "/" })).toEqual({
      label: "ChatGPT",
      detail: "entrou por /",
    });
    expect(signupOrigin({ referrer: "www.perplexity.ai" }).label).toBe("Perplexity");
  });

  it("tells ads apart from organic visits", () => {
    expect(signupOrigin({ click: "google", landing: "/barbearia" }).label).toBe("Anúncio Google");
    expect(signupOrigin({ click: "meta", utm_source: "meta", utm_medium: "pago" }).label).toBe(
      "Anúncio Meta",
    );
    expect(signupOrigin({ click: "meta" }).label).toBe("Facebook / Instagram");
    expect(
      signupOrigin({ utm_source: "meta", utm_medium: "pago", utm_campaign: "cadastro" }),
    ).toEqual({ label: "Anúncio Meta", detail: "cadastro" });
  });

  it("names search engines and social sites from the referrer", () => {
    expect(signupOrigin({ referrer: "www.google.com.br", landing: "/nutricao" })).toEqual({
      label: "Google (busca)",
      detail: "entrou por /nutricao",
    });
    expect(signupOrigin({ referrer: "l.instagram.com" }).label).toBe("Instagram");
    expect(signupOrigin({ referrer: "outro-site.com.br" }).label).toBe("outro-site.com.br");
  });

  it("falls back to direct, and to a dash without any data", () => {
    expect(signupOrigin({ via: "direct", landing: "/" }).label).toBe("Direto ou não identificado");
    expect(signupOrigin({ via: "nome" }).label).toBe("Link de prospecção");
    expect(signupOrigin(null)).toEqual({ label: "—", detail: null });
  });
});
