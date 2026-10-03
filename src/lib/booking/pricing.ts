import type { DepositType } from "@/lib/db/types";

export interface PricedService {
  /** List price for this professional (price override applied). */
  priceCents: number;
  depositType: DepositType;
  depositValue: number;
}

/**
 * Charged price per service. With a combo, its price is split proportionally across the services
 * (rounding goes to the last one) so the stored lines add up to the combo price.
 */
export function chargedPrices(services: PricedService[], comboPriceCents: number | null): number[] {
  if (comboPriceCents === null) return services.map((s) => s.priceCents);
  const list = services.reduce((sum, s) => sum + s.priceCents, 0);
  if (list === 0) {
    const even = Math.floor(comboPriceCents / services.length);
    return services.map((_, i) =>
      i === services.length - 1 ? comboPriceCents - even * (services.length - 1) : even,
    );
  }
  const shares = services.map((s) => Math.floor((s.priceCents * comboPriceCents) / list));
  shares[shares.length - 1]! += comboPriceCents - shares.reduce((a, b) => a + b, 0);
  return shares;
}

/** Deposit for the booking: fixed values add up; percents apply to each service's charged price. */
export function depositFor(
  services: PricedService[],
  charged: number[],
  totalAfterDiscount: number,
): number {
  const deposit = services.reduce((sum, service, i) => {
    if (service.depositType === "fixed") return sum + service.depositValue;
    if (service.depositType === "percent")
      return sum + Math.round((charged[i]! * service.depositValue) / 100);
    return sum;
  }, 0);
  return Math.min(deposit, totalAfterDiscount);
}
