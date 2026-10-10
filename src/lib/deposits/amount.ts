import type { DepositType } from "@/lib/db/types";

/**
 * Deposit of a booking before the unique cents: the services' rules (fixed, percent or the full
 * price), at least the business minimum, never more than the total.
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
  return Math.min(Math.max(sum, minimumCents), totalAfterDiscount);
}

/**
 * Unique cents: the amount the customer pays, different from every pending payment of the same
 * professional, so it can be found in the bank statement. 1 to 99 cents are taken off (the
 * customer never pays more); only when that would go below the minimum (or zero) they are added.
 * Returns null when every candidate is taken (the caller asks for another time).
 */
export function uniqueDepositAmount(
  baseCents: number,
  minimumCents: number,
  taken: ReadonlySet<number>,
  random: () => number = Math.random,
): number | null {
  if (baseCents <= 0) return null;
  const floor = Math.max(minimumCents, 1);
  const below = range(1, 99)
    .map((cents) => baseCents - cents)
    .filter((amount) => amount >= floor && !taken.has(amount));
  const pool = below.length
    ? below
    : range(1, 99)
        .map((cents) => baseCents + cents)
        .filter((amount) => !taken.has(amount));
  if (!pool.length) return null;
  return pool[Math.floor(random() * pool.length)]!;
}

function range(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, i) => from + i);
}
