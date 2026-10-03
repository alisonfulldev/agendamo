/**
 * Pix helpers: key validation and the static BR Code ("Pix copia e cola") from the Banco Central
 * specification (EMV QR Code, merchant account GUI br.gov.bcb.pix, CRC16-CCITT).
 * The deposit is paid straight to the professional's key (rule 11).
 */

export type PixKeyType = "cpf" | "cnpj" | "email" | "phone" | "evp";

export function validCpf(digits: string): boolean {
  if (!/^\d{11}$/.test(digits) || /^(\d)\1{10}$/.test(digits)) return false;
  const calc = (length: number) => {
    let sum = 0;
    for (let i = 0; i < length; i++) sum += Number(digits[i]) * (length + 1 - i);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  return calc(9) === Number(digits[9]) && calc(10) === Number(digits[10]);
}

export function validCnpj(digits: string): boolean {
  if (!/^\d{14}$/.test(digits) || /^(\d)\1{13}$/.test(digits)) return false;
  const calc = (length: number) => {
    const weights =
      length === 12
        ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const sum = weights.reduce((total, weight, i) => total + Number(digits[i]) * weight, 0);
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };
  return calc(12) === Number(digits[12]) && calc(13) === Number(digits[13]);
}

/** Normalizes a Pix key as the bank expects it, or null when invalid. */
export function normalizePixKey(input: string): { type: PixKeyType; key: string } | null {
  const value = input.trim();
  if (!value) return null;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
    return { type: "evp", key: value.toLowerCase() };
  }
  if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value) && value.length <= 77) {
    return { type: "email", key: value.toLowerCase() };
  }
  const digits = value.replace(/\D/g, "");
  if (value.startsWith("+") || /^\(?\d{2}\)?\s?9?\d{4}-?\d{4}$/.test(value)) {
    const national = digits.startsWith("55") && digits.length >= 12 ? digits.slice(2) : digits;
    if (/^[1-9]\d(9\d{8}|[2-8]\d{7})$/.test(national))
      return { type: "phone", key: `+55${national}` };
  }
  if (validCpf(digits)) return { type: "cpf", key: digits };
  if (validCnpj(digits)) return { type: "cnpj", key: digits };
  return null;
}

/** Uppercase ASCII, as required for merchant name/city in the BR Code. */
export function pixText(value: string, max: number): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9 ]/g, "")
    .toUpperCase()
    .trim()
    .slice(0, max);
}

function field(id: string, value: string): string {
  return `${id}${String(value.length).padStart(2, "0")}${value}`;
}

/** CRC16-CCITT (poly 0x1021, init 0xFFFF), as specified for the BR Code. */
export function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export interface BrCodeInput {
  key: string;
  receiverName: string;
  city: string;
  amountCents: number;
  /** Transaction id (txid): up to 25 alphanumeric characters. */
  txid: string;
  description?: string;
}

/** Static Pix BR Code with a fixed amount, ready for "copia e cola" and the QR code. */
export function buildPixBrCode(input: BrCodeInput): string {
  const account =
    field("00", "br.gov.bcb.pix") +
    field("01", input.key) +
    (input.description ? field("02", pixText(input.description, 40)) : "");
  const txid = input.txid.replace(/[^A-Za-z0-9]/g, "").slice(0, 25) || "***";
  const payload =
    field("00", "01") +
    field("26", account) +
    field("52", "0000") +
    field("53", "986") +
    field("54", (input.amountCents / 100).toFixed(2)) +
    field("58", "BR") +
    field("59", pixText(input.receiverName, 25) || "RECEBEDOR") +
    field("60", pixText(input.city, 15) || "BRASIL") +
    field("62", field("05", txid)) +
    "6304";
  return payload + crc16(payload);
}
