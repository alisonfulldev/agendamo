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

/** Reads an EMV BR Code back into its fields, the way bank apps do. */
function parseEmv(payload: string): Record<string, string> {
  const fields: Record<string, string> = {};
  let i = 0;
  while (i < payload.length) {
    const id = payload.slice(i, i + 2);
    const length = Number(payload.slice(i + 2, i + 4));
    fields[id] = payload.slice(i + 4, i + 4 + length);
    i += 4 + length;
  }
  return fields;
}

describe("deposit BR Code (unique cents)", () => {
  const code = buildPixBrCode({
    key: "contato@studiolumi.com.br",
    receiverName: "Studio Lumi Beleza",
    city: "São Paulo",
    amountCents: 2993,
    txid: "MC1a2b3c4d5e6f7a8b9c0d1e",
    description: "Sinal Studio Lumi",
  });
  const fields = parseEmv(code);

  it("decodes field by field with the key, the exact amount, name, city and booking id", () => {
    expect(fields["00"]).toBe("01");
    const account = parseEmv(fields["26"]!);
    expect(account["00"]).toBe("br.gov.bcb.pix");
    expect(account["01"]).toBe("contato@studiolumi.com.br");
    expect(fields["53"]).toBe("986");
    expect(fields["54"]).toBe("29.93");
    expect(fields["58"]).toBe("BR");
    expect(fields["59"]).toBe("STUDIO LUMI BELEZA");
    expect(fields["60"]).toBe("SAO PAULO");
    expect(parseEmv(fields["62"]!)["05"]).toBe("MC1a2b3c4d5e6f7a8b9c0d1e");
  });

  it("ends with a CRC16 that matches the rest of the code", () => {
    expect(fields["63"]).toHaveLength(4);
    expect(crc16(code.slice(0, -4))).toBe(code.slice(-4));
    // Any change in the amount breaks the CRC (bank apps refuse it).
    const tampered = code.replace("29.93", "29.94");
    expect(crc16(tampered.slice(0, -4))).not.toBe(tampered.slice(-4));
  });
});
