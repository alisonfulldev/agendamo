import { describe, expect, it } from "vitest";

import { baseDeposit } from "@/lib/deposits/amount";
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

  it("services without a price: a fixed deposit still applies; percent and full give nothing", () => {
    const free = (depositType: "fixed" | "percent" | "full", depositValue = 0) => ({
      depositType,
      depositValue,
      chargedCents: 0,
    });
    expect(baseDeposit([free("fixed", 100)], 0, 100)).toBe(100);
    expect(baseDeposit([free("fixed", 3000)], 0, 0)).toBe(3000);
    expect(baseDeposit([free("percent", 30)], 0, 0)).toBe(0);
    expect(baseDeposit([free("full")], 0, 0)).toBe(0);
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
