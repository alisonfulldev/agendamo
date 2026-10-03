const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** 4500 -> "R$ 45,00" */
export function formatBRL(cents: number): string {
  return BRL.format(cents / 100).replace(/ /g, " ");
}

/** 4500 -> "45,00" (for chat texts like "R$ {price}"). */
export function formatAmount(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** "R$ 45", "45,5", "1.234,56" -> cents, or null when not a valid amount. */
export function parseBRL(input: string | null | undefined): number | null {
  if (input == null) return null;
  const cleaned = input.replace(/R\$\s?/i, "").replace(/\s/g, "");
  if (!cleaned) return null;
  const normalized = cleaned.includes(",") ? cleaned.replace(/\./g, "").replace(",", ".") : cleaned;
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  return Math.round(Number(normalized) * 100);
}

/** Duration in minutes -> "45 min" / "1h" / "1h30". */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h${String(rest).padStart(2, "0")}` : `${hours}h`;
}
