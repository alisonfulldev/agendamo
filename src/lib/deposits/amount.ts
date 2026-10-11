import type { DepositType } from "@/lib/db/types";

/**
 * Deposit of a booking (the exact amount the customer pays): the services' rules (fixed, percent or the full
 * price), at least the business minimum, never more than the total. Services without a price
 * (R$ 0, "a combinar") can still ask for a fixed deposit: then there is no total to cap it.
 */
export function baseDeposit(
  services: { depositType: DepositType; depositValue: number; chargedCents: number }[],
  totalAfterDiscount: number,
  minimumCents: number,
): number {
  const sum = services.reduce((acc, s) => {
    if (s.depositType === "fixed") return acc + s.depositValue;
    if (s.depositType === "percent")
      return acc + Math.round((s.chargedCents * s.depositValue) / 100);
    if (s.depositType === "full") return acc + s.chargedCents;
    return acc;
  }, 0);
  if (sum <= 0) return 0;
  const deposit = Math.max(sum, minimumCents);
  const priced = services.some((s) => s.chargedCents > 0);
  return priced ? Math.min(deposit, totalAfterDiscount) : deposit;
}
