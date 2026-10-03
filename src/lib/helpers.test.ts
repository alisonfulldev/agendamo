import { describe, expect, it } from "vitest";

import { formatBrPhone, maskBrPhone, normalizeBrPhone, whatsappLink } from "@/lib/phone";
import { isValidSlugFormat, slugify } from "@/lib/slug";
import { instagramHandle, normalizeInstagram } from "@/lib/social";

describe("slugify", () => {
  it.each([
    ["Studio Bela", "studio-bela"],
    ["Barbearia do Zé & Cia", "barbearia-do-ze-cia"],
    ["  Côrte  Ñandú  ", "corte-nandu"],
    ["A".repeat(60), "a".repeat(40)],
  ])("%s -> %s", (input, expected) => {
    expect(slugify(input)).toBe(expected);
  });

  it("validates the same format as the database", () => {
    expect(isValidSlugFormat("studio-bela")).toBe(true);
    expect(isValidSlugFormat("ab")).toBe(false);
    expect(isValidSlugFormat("a--b")).toBe(false);
    expect(isValidSlugFormat("-abc")).toBe(false);
    expect(isValidSlugFormat("Abc")).toBe(false);
  });
});

describe("Brazilian phones", () => {
  it.each([
    ["(11) 99999-8888", "5511999998888"],
    ["11 3333-4444", "551133334444"],
    ["+55 21 98888-7777", "5521988887777"],
    ["5511999998888", "5511999998888"],
  ])("normalizes %s", (input, expected) => {
    expect(normalizeBrPhone(input)).toBe(expected);
  });

  it.each(["123", "(00) 99999-8888", "11 1234-5678", ""])("rejects %s", (input) => {
    expect(normalizeBrPhone(input)).toBeNull();
  });

  it("formats and masks", () => {
    expect(formatBrPhone("5511999998888")).toBe("(11) 99999-8888");
    expect(formatBrPhone("551133334444")).toBe("(11) 3333-4444");
    expect(maskBrPhone("1199999")).toBe("(11) 9999-9");
    expect(maskBrPhone("11999998888")).toBe("(11) 99999-8888");
  });

  it("builds wa.me links with an encoded message", () => {
    expect(whatsappLink("5511999998888", "Oi! Tudo bem?")).toBe(
      "https://wa.me/5511999998888?text=Oi%21+Tudo+bem%3F",
    );
  });
});

describe("Instagram", () => {
  it.each([
    ["@studio.bela", "https://instagram.com/studio.bela"],
    ["instagram.com/studio.bela", "https://instagram.com/studio.bela"],
    ["https://www.instagram.com/studio.bela/?hl=pt", "https://instagram.com/studio.bela"],
  ])("normalizes %s", (input, expected) => {
    expect(normalizeInstagram(input)).toBe(expected);
  });

  it("rejects invalid handles and reads the handle back", () => {
    expect(normalizeInstagram("not a handle!")).toBeNull();
    expect(instagramHandle("https://instagram.com/studio.bela")).toBe("@studio.bela");
  });
});
