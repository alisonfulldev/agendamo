import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { normalizeBrDomain } from "./registro";

describe("own .br domain of a sale", () => {
  it("accepts what people type and keeps only the domain", () => {
    expect(normalizeBrDomain("StudioBela.com.br")).toBe("studiobela.com.br");
    expect(normalizeBrDomain("https://www.studiobela.com.br/contato")).toBe("studiobela.com.br");
    expect(normalizeBrDomain(" clinica-pele.med.br ")).toBe("clinica-pele.med.br");
  });

  it("refuses what Registro.br does not sell or is not a domain", () => {
    expect(normalizeBrDomain("studiobela.com")).toBeNull();
    expect(normalizeBrDomain("studio bela.com.br")).toBeNull();
    expect(normalizeBrDomain("-studio.com.br")).toBeNull();
    expect(normalizeBrDomain("")).toBeNull();
  });
});
