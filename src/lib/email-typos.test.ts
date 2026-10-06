import { describe, expect, it } from "vitest";

import { suggestEmailFix } from "@/lib/email-typos";

describe("suggestEmailFix", () => {
  it.each([
    ["ana@gmial.com", "ana@gmail.com"],
    ["ana@gmai.com", "ana@gmail.com"],
    ["ana@hotmal.com", "ana@hotmail.com"],
    ["ana@outlok.com", "ana@outlook.com"],
    ["Ana@Gmail.con", "ana@gmail.com"],
    ["ana@yaho.com.br", "ana@yahoo.com.br"],
  ])("%s -> %s", (typed, fixed) => {
    expect(suggestEmailFix(typed)).toBe(fixed);
  });

  it.each([
    "ana@gmail.com",
    "ana@hotmail.com",
    "ana@meusalao.com.br",
    "ana@empresa.io",
    "semarroba",
  ])("%s: no suggestion", (typed) => {
    expect(suggestEmailFix(typed)).toBeNull();
  });
});
