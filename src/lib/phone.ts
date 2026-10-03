/**
 * Brazilian phone helpers. Stored format: digits with country code, e.g. "5511999998888"
 * (matches the database check ^[0-9]{10,15}$).
 */

/** Normalizes user input to 55 + DDD + number, or null when it is not a valid Brazilian phone. */
export function normalizeBrPhone(input: string | null | undefined): string | null {
  if (!input) return null;
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 10 || digits.length === 11) digits = `55${digits}`;
  if (!/^55[1-9][0-9](9[0-9]{8}|[2-8][0-9]{7})$/.test(digits)) return null;
  return digits;
}

/** "5511999998888" -> "(11) 99999-8888". Falls back to the input. */
export function formatBrPhone(stored: string | null | undefined): string {
  if (!stored) return "";
  const digits = stored.replace(/\D/g, "");
  const local = digits.startsWith("55") ? digits.slice(2) : digits;
  if (local.length === 11) return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  if (local.length === 10) return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
  return stored;
}

/** Progressive input mask: "11999998888" -> "(11) 99999-8888". */
export function maskBrPhone(input: string): string {
  const d = input
    .replace(/\D/g, "")
    .replace(/^55(?=\d{10,11}$)/, "")
    .slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** wa.me link with an optional pre-filled message (opened manually by the person; no API). */
export function whatsappLink(stored: string, message?: string): string {
  const url = new URL(`https://wa.me/${stored.replace(/\D/g, "")}`);
  if (message) url.searchParams.set("text", message);
  return url.toString();
}
