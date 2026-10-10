import { describe, expect, it } from "vitest";

import { baseDeposit, uniqueDepositAmount } from "@/lib/deposits/amount";
import { sniffReceiptType } from "@/lib/deposits/receipt-file";

describe("baseDeposit", () => {
  const service = (depositType: "none" | "fixed" | "percent" | "full", depositValue = 0) => ({
    depositType,
    depositValue,
    chargedCents: 10000,
  });

  it("fixed, percent and full price", () => {
    expect(baseDeposit([service("fixed", 3000)], 10000, 0)).toBe(3000);
    expect(baseDeposit([service("percent", 30)], 10000, 0)).toBe(3000);
    expect(baseDeposit([service("full")], 10000, 0)).toBe(10000);
    expect(baseDeposit([service("none")], 10000, 0)).toBe(0);
  });

  it("at least the minimum, never above the total", () => {
    expect(baseDeposit([service("percent", 10)], 10000, 2500)).toBe(2500);
    expect(baseDeposit([service("full")], 8000, 0)).toBe(8000);
  });
});

describe("uniqueDepositAmount (unique cents)", () => {
  it("takes 1 to 99 cents off, so the customer never pays more", () => {
    for (let i = 0; i < 200; i++) {
      const amount = uniqueDepositAmount(3000, 0, new Set())!;
      expect(amount).toBeGreaterThanOrEqual(2901);
      expect(amount).toBeLessThanOrEqual(2999);
    }
  });

  it("never repeats a pending amount of the same professional", () => {
    const taken = new Set<number>();
    for (let i = 0; i < 99; i++) {
      const amount = uniqueDepositAmount(3000, 0, taken)!;
      expect(taken.has(amount)).toBe(false);
      taken.add(amount);
    }
    // All 99 below are taken: the cents are added instead (still unique).
    const next = uniqueDepositAmount(3000, 0, taken)!;
    expect(next).toBeGreaterThan(3000);
    expect(taken.has(next)).toBe(false);
  });

  it("adds the cents when taking them off would go below the minimum", () => {
    const amount = uniqueDepositAmount(3000, 3000, new Set())!;
    expect(amount).toBeGreaterThan(3000);
    expect(amount).toBeLessThanOrEqual(3099);
  });

  it("very small deposits never become zero", () => {
    expect(uniqueDepositAmount(50, 0, new Set())).toBeGreaterThanOrEqual(1);
  });

  it("returns null when every candidate is taken", () => {
    const taken = new Set([...Array(99)].flatMap((_, i) => [3000 - (i + 1), 3000 + (i + 1)]));
    expect(uniqueDepositAmount(3000, 0, taken)).toBeNull();
  });
});

describe("sniffReceiptType", () => {
  const bytes = (...head: number[]) => {
    const out = new Uint8Array(64);
    out.set(head);
    return out;
  };

  it("recognizes JPG, PNG, WebP and complete PDFs by their bytes", () => {
    expect(sniffReceiptType(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe("image/jpeg");
    expect(sniffReceiptType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))).toBe(
      "image/png",
    );
    expect(
      sniffReceiptType(bytes(0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50)),
    ).toBe("image/webp");
    const pdf = new TextEncoder().encode("%PDF-1.4\n1 0 obj\n<<>>\nendobj\n%%EOF\n");
    expect(sniffReceiptType(pdf)).toBe("application/pdf");
  });

  it("refuses empty, truncated or other files", () => {
    expect(sniffReceiptType(new Uint8Array())).toBeNull();
    expect(sniffReceiptType(new TextEncoder().encode("%PDF-1.4\n1 0 obj (truncated"))).toBeNull();
    expect(sniffReceiptType(new TextEncoder().encode("MZ executable file renamed.jpg"))).toBeNull();
    expect(sniffReceiptType(new TextEncoder().encode("<html>not an image</html>"))).toBeNull();
  });
});
