import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { withoutBrandParam } = await import("./load");

describe("withoutBrandParam", () => {
  it("is null when the link has no ?brand=", () => {
    expect(withoutBrandParam("/ana", { ref: "AB12" })).toBeNull();
  });

  it("drops ?brand= and keeps the link's own parameters", () => {
    expect(withoutBrandParam("/fulano-de-tal", { brand: "aesthetics" })).toBe("/fulano-de-tal");
    expect(
      withoutBrandParam("/ana", {
        brand: "beauty",
        agendar: "1",
        servico: "x",
        data: "2026-10-24",
      }),
    ).toBe("/ana?agendar=1&servico=x&data=2026-10-24");
  });
});
