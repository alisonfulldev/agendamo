import { describe, expect, it } from "vitest";

import { depositReadyText, depositSetup, type DepositSetupService } from "./setup";

const service = (over: Partial<DepositSetupService> = {}): DepositSetupService => ({
  name: "Corte",
  active: true,
  price_cents: 5000,
  deposit_type: "none",
  ...over,
});

describe("depositSetup", () => {
  it("nothing set up: not ready and no notice", () => {
    const s = depositSetup(null, [service()]);
    expect(s).toMatchObject({ ready: false, started: false, pixKey: false, withDeposit: 0 });
    expect(s.missing).toEqual([
      "Cadastre sua chave Pix.",
      "Escolha pelo menos um serviço que pede sinal.",
    ]);
  });

  it("Pix key without any service asking for a deposit: started, not ready", () => {
    const s = depositSetup("pix@exemplo.com", [service()]);
    expect(s).toMatchObject({ ready: false, started: true, pixKey: true });
    expect(s.missing).toEqual(["Escolha pelo menos um serviço que pede sinal."]);
  });

  it("a service asking for a deposit without a Pix key: started, not ready", () => {
    const s = depositSetup("", [service({ deposit_type: "fixed" })]);
    expect(s).toMatchObject({ ready: false, started: true, withDeposit: 1 });
    expect(s.missing).toEqual(["Cadastre sua chave Pix."]);
  });

  it("services at R$ 0: percent and full need the price, a fixed value works", () => {
    const s = depositSetup("pix@exemplo.com", [
      service({ name: "Limpeza", price_cents: 0, deposit_type: "percent" }),
    ]);
    expect(s.ready).toBe(false);
    expect(s.zeroPrice).toEqual(["Limpeza"]);
    expect(s.missing[1]).toMatch(/“Limpeza” está sem preço: porcentagem e pagamento total/);
    const fixed = depositSetup("pix@exemplo.com", [
      service({ name: "Limpeza", price_cents: 0, deposit_type: "fixed" }),
    ]);
    expect(fixed).toMatchObject({ ready: true, withDeposit: 1, zeroPrice: [] });
  });

  it("ready with a key and priced services asking for it; inactive ones are ignored", () => {
    const s = depositSetup("pix@exemplo.com", [
      service({ deposit_type: "fixed" }),
      service({ name: "Barba", deposit_type: "full" }),
      service({ name: "Antigo", active: false, deposit_type: "fixed" }),
    ]);
    expect(s).toMatchObject({ ready: true, withDeposit: 2, missing: [] });
    expect(depositReadyText(s)).toBe("Pronto: o chat pede o comprovante em 2 serviços.");
  });
});
