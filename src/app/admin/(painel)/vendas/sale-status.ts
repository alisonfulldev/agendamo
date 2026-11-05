import type { AssistedSale } from "@/lib/sales/assisted";

const SALE_STATUS = {
  awaiting_payment: "Aguardando Pix",
  paid: "Paga",
  cancelled: "Cancelada",
} as const;

/** Status shown to the seller: an unpaid Pix past its 24 h is "Pix vencido". */
export function saleStatus(
  sale: Pick<AssistedSale, "status" | "pix_expires_at">,
  now = Date.now(),
): string {
  if (
    sale.status === "awaiting_payment" &&
    sale.pix_expires_at &&
    new Date(sale.pix_expires_at).getTime() < now
  ) {
    return "Pix vencido";
  }
  return SALE_STATUS[sale.status];
}
