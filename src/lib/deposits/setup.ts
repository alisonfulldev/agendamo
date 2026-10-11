import type { DepositType } from "@/lib/db/types";

export interface DepositSetupService {
  name: string;
  active: boolean;
  price_cents: number;
  deposit_type: DepositType;
}

export interface DepositSetup {
  pixKey: boolean;
  /** Active services whose deposit comes out above zero. */
  withDeposit: number;
  /** Active services asking for a percent or the full price while priced R$ 0 (it would be zero). */
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
 * active service whose deposit is above zero (a fixed value, or a percent / the full price of a
 * priced service).
 */
export function depositSetup(pixKey: string | null, services: DepositSetupService[]): DepositSetup {
  const active = services.filter((s) => s.active && s.deposit_type !== "none");
  const needsPrice = (s: DepositSetupService) => s.deposit_type !== "fixed" && s.price_cents <= 0;
  const withDeposit = active.filter((s) => !needsPrice(s)).length;
  const zeroPrice = active.filter(needsPrice).map((s) => s.name);
  const hasKey = Boolean(pixKey?.trim());
  const missing: string[] = [];
  if (!hasKey) missing.push("Cadastre sua chave Pix.");
  if (withDeposit === 0) missing.push("Escolha pelo menos um serviço que pede sinal.");
  for (const name of zeroPrice) {
    missing.push(
      `“${name}” está sem preço: porcentagem e pagamento total precisam do preço. Use “Valor fixo” ou defina o preço em Meu perfil › Serviços.`,
    );
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
