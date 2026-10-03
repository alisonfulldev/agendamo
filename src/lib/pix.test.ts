import { describe, expect, it } from "vitest";

import { buildPixBrCode, crc16, normalizePixKey } from "@/lib/pix";

describe("crc16", () => {
  it("matches the CRC-16/CCITT-FALSE check value", () => {
    expect(crc16("123456789")).toBe("29B1");
  });

  it("matches the static example of the Banco Central Pix manual", () => {
    const payload =
      "00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-4266554400005204000053039865802BR" +
      "5913Fulano de Tal6008BRASILIA62070503***6304";
    expect(crc16(payload)).toBe("1D3D");
  });
});

describe("normalizePixKey", () => {
  it.each([
    ["529.982.247-25", { type: "cpf", key: "52998224725" }],
    ["11.222.333/0001-81", { type: "cnpj", key: "11222333000181" }],
    ["Maria@Exemplo.com", { type: "email", key: "maria@exemplo.com" }],
    ["(11) 99999-8888", { type: "phone", key: "+5511999998888" }],
    ["+55 11 99999-8888", { type: "phone", key: "+5511999998888" }],
    [
      "123E4567-E12B-12D1-A456-426655440000",
      { type: "evp", key: "123e4567-e12b-12d1-a456-426655440000" },
    ],
  ])("normalizes %s", (input, expected) => {
    expect(normalizePixKey(input)).toEqual(expected);
  });

  it.each(["111.111.111-11", "123", "", "not a key"])("rejects %s", (input) => {
    expect(normalizePixKey(input)).toBeNull();
  });
});

describe("buildPixBrCode", () => {
  const code = buildPixBrCode({
    key: "+5511999998888",
    receiverName: "Ana Lúcia Souza da Silva Pereira",
    city: "São Paulo",
    amountCents: 3500,
    txid: "AGD-1234",
  });

  it("includes amount, uppercase ASCII name and city, txid and a valid CRC", () => {
    expect(code).toContain("540535.00");
    expect(code).toContain("5925ANA LUCIA SOUZA DA SILVA");
    expect(code).toContain("6009SAO PAULO");
    expect(code).toContain("0507AGD1234");
    expect(code.slice(-4)).toBe(crc16(code.slice(0, -4)));
  });

  it("starts with the payload format indicator and Pix GUI", () => {
    expect(code.startsWith("000201")).toBe(true);
    expect(code).toContain("0014br.gov.bcb.pix0114+5511999998888");
  });
});
