import { describe, expect, it } from "vitest";

import { amountsIn, checkReceiptText, findE2e, type ReceiptExpectation } from "./receipt-check";

const expected: ReceiptExpectation = {
  amountCents: 1500,
  createdAt: new Date("2026-11-25T12:00:00Z"),
  now: new Date("2026-11-25T12:20:00Z"),
  pixKey: "+5571983453378",
  receiverNames: ["Bless Kids Studio", "LAIANNE NERES"],
  txid: "MC1a2b3c4d5e6f7a8b9c0d",
};

// What the OCR returns for a typical bank screenshot.
const receipt = `Comprovante de transferência
Valor
R$ 15,00
Data: 25/11/2026 - 09:14:32
Destino
LAIANNE NERES DOS SANTOS
Chave Pix: (71) 98345-3378
Origem
ANA CRISTINA SOUZA
ID da transação
E18236120202611251214abcdEFGH123
Identificador: MC1a2b3c4d5e6f7a8b9c0d`;

describe("amountsIn", () => {
  it("reads values with and without thousands", () => {
    expect(amountsIn("R$ 15,00 e R$ 1.234,56 e 9,90")).toEqual([1500, 123456, 990]);
  });
});

describe("findE2e", () => {
  it("finds the id even split by the OCR, with O read for 0", () => {
    const found = findE2e("ID: E1823612O2026112512\n14abcdEFGH123");
    expect(found?.id).toBe("E18236120202611251214ABCDEFGH123");
    expect(found?.at.toISOString()).toBe("2026-11-25T12:14:00.000Z");
  });
  it("ignores impossible dates", () => {
    expect(findE2e("E18236120202613251214ABCDEFGH123")).toBeNull();
  });
});

describe("checkReceiptText", () => {
  it("confirms a receipt where everything matches", () => {
    const result = checkReceiptText(receipt, expected);
    expect(result.autoConfirm).toBe(true);
    expect(result.checks.reference).toBe(true);
    expect(result.reasons).toEqual([]);
    expect(result.e2eId).toBe("E18236120202611251214ABCDEFGH123");
  });

  it("sends a different amount to the owner", () => {
    const result = checkReceiptText(receipt.replace("15,00", "10,00"), expected);
    expect(result.autoConfirm).toBe(false);
    expect(result.reasons).toContain("O valor do sinal não aparece no comprovante.");
  });

  it("sends another receiver to the owner", () => {
    const other = receipt
      .replace("LAIANNE NERES DOS SANTOS", "JOSE PEREIRA")
      .replace("(71) 98345-3378", "jose@email.com");
    const result = checkReceiptText(other, expected);
    expect(result.autoConfirm).toBe(false);
    expect(result.checks.recipient).toBe(false);
  });

  it("matches the receiver by the key when the name is missing", () => {
    const result = checkReceiptText(receipt.replace("LAIANNE NERES DOS SANTOS", ""), expected);
    expect(result.checks.recipient).toBe(true);
  });

  it("matches a masked CPF key", () => {
    const cpf = { ...expected, pixKey: "123.456.789-09", receiverNames: [] };
    const text = receipt.replace("(71) 98345-3378", "***.456.789-**");
    expect(checkReceiptText(text, cpf).checks.recipient).toBe(true);
  });

  it("refuses a Pix older than the appointment (an old receipt)", () => {
    const old = receipt.replace("E18236120202611251214", "E18236120202611201214");
    const result = checkReceiptText(old, expected);
    expect(result.autoConfirm).toBe(false);
    expect(result.reasons).toContain("A data do Pix não combina com a do agendamento.");
  });

  it("needs the transaction id", () => {
    const result = checkReceiptText(receipt.replace(/E1823.*\n/, ""), expected);
    expect(result.autoConfirm).toBe(false);
    expect(result.reasons).toContain("O ID da transação Pix não foi encontrado.");
  });
});
