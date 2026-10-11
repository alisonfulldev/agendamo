import type { DepositType } from "@/lib/db/types";

export interface DepositSetupService {
  name: string;
  active: boolean;
  price_cents: number;
  deposit_type: DepositType;
}

export interface DepositSetup {
  pixKey: boolean;
  /** Active services that ask for a deposit (and have a price, so the deposit is above zero). */
  withDeposit: number;
  /** Active services that ask for a deposit but cost R$ 0: the deposit would come out as zero. */
  zeroPrice: string[];
  /** The chat asks for the receipt in at least one service. */
  ready: boolean;
  /** Something was set up but the chat still asks for nothing (worth a notice). */
  started: boolean;
  /** What is missing, in the order to fix it. */
  missing: string[];
}

/**
 * Where the deposit by Pix stands: the chat only asks for it with a Pix key and at least one
 * active, priced service that asks for a deposit (a deposit never goes above the price).
 */
export function depositSetup(pixKey: string | null, services: DepositSetupService[]): DepositSetup {
  const active = services.filter((s) => s.active && s.deposit_type !== "none");
  const withDeposit = active.filter((s) => s.price_cents > 0).length;
  const zeroPrice = active.filter((s) => s.price_cents <= 0).map((s) => s.name);
  const hasKey = Boolean(pixKey?.trim());
  const missing: string[] = [];
  if (!hasKey) missing.push("Cadastre sua chave Pix.");
  if (withDeposit === 0) missing.push("Escolha pelo menos um serviço que pede sinal.");
  for (const name of zeroPrice) {
    missing.push(`“${name}” está sem preço: o sinal sairia R$ 0. Defina o preço do serviço.`);
  }
  return {
    pixKey: hasKey,
    withDeposit,
    zeroPrice,
    ready: hasKey && withDeposit > 0,
    started: hasKey || active.length > 0,
    missing,
  };
}

/** "Pronto: o chat pede o comprovante em 3 serviços." */
export function depositReadyText(setup: DepositSetup): string {
  const n = setup.withDeposit;
  return `Pronto: o chat pede o comprovante em ${n} ${n === 1 ? "serviço" : "serviços"}.`;
}
