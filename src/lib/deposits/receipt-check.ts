/**
 * Reading engine for Pix receipts (2026-11-26, no AI): fixed rules over the text of the receipt
 * (OCR of the screenshot). Everything must match for the deposit to be confirmed by itself; any
 * doubt goes to the owner with the reasons. A forged receipt that matches every rule is not
 * detected: the owner can still mark "Não recebi".
 */

export interface ReceiptExpectation {
  /** Exact deposit amount. */
  amountCents: number;
  /** When the appointment was created: the Pix cannot be older than that. */
  createdAt: Date;
  now: Date;
  /** The owner's Pix key, as saved in the settings. */
  pixKey: string | null;
  /**
   * Names the receiver may show: the bank prints the account holder (often the owner's own name),
   * which can differ from the name in the Pix code or the business name.
   */
  receiverNames: (string | null)[];
  /** Our identifier in the Pix code (txid): some banks print it on the receipt. */
  txid: string | null;
}

export interface ReceiptCheck {
  autoConfirm: boolean;
  /** Pix end-to-end id (32 characters), normalized; unique across all receipts. */
  e2eId: string | null;
  checks: { amount: boolean; recipient: boolean; when: boolean; reference: boolean };
  /** Why it was not confirmed by itself, for the owner (empty when confirmed). */
  reasons: string[];
}

/** Uppercase, no accents, single spaces. */
function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[ \t]+/g, " ");
}

/** Every money value in the text ("R$ 1.234,56", "15,00"), in cents. */
export function amountsIn(text: string): number[] {
  const values: number[] = [];
  for (const match of text.matchAll(/(\d{1,3}(?:\.\d{3})+|\d+),(\d{2})(?!\d)/g)) {
    values.push(Number(match[1]!.replace(/\./g, "")) * 100 + Number(match[2]));
  }
  return values;
}

/**
 * Pix end-to-end id: "E" + ISPB (8 digits) + yyyyMMddHHmm (UTC) + 11 letters/digits. OCR may
 * split it or read "O" for "0" in the digits. Null when absent or with an impossible date.
 */
export function findE2e(text: string): { id: string; at: Date } | null {
  const compact = normalize(text).replace(/\s+/g, "");
  for (const match of compact.matchAll(/E([0-9O]{8})([0-9O]{12})([A-Z0-9]{11})/g)) {
    const ispb = match[1]!.replace(/O/g, "0");
    const stamp = match[2]!.replace(/O/g, "0");
    const year = Number(stamp.slice(0, 4));
    const month = Number(stamp.slice(4, 6));
    const day = Number(stamp.slice(6, 8));
    const hour = Number(stamp.slice(8, 10));
    const minute = Number(stamp.slice(10, 12));
    if (year < 2020 || month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59)
      continue;
    return {
      id: `E${ispb}${stamp}${match[3]}`,
      at: new Date(Date.UTC(year, month - 1, day, hour, minute)),
    };
  }
  return null;
}

const NAME_STOPWORDS = new Set(["DE", "DA", "DO", "DAS", "DOS", "E", "LTDA", "ME", "EIRELI"]);

/** The receiver name: its first word plus another one (or the only word) appear in the text. */
function nameMatches(text: string, name: string | null): boolean {
  if (!name) return false;
  const words = normalize(name)
    .split(/[^A-Z0-9]+/)
    .filter((w) => w.length >= 3 && !NAME_STOPWORDS.has(w));
  if (!words.length) return false;
  const has = (w: string) => new RegExp(`(^|[^A-Z0-9])${w}([^A-Z0-9]|$)`).test(text);
  if (!has(words[0]!)) return false;
  return words.length === 1 || words.slice(1).some(has);
}

/** The Pix key appears (masked CPFs show only the middle digits; phones may lack +55). */
function keyMatches(text: string, key: string | null): boolean {
  if (!key) return false;
  const raw = key.trim();
  if (raw.includes("@")) return text.replace(/\s+/g, "").includes(normalize(raw));
  const uuid = raw.replace(/-/g, "").toUpperCase();
  if (/^[0-9A-F]{32}$/.test(uuid) && /[A-F]/.test(uuid))
    return text.replace(/[\s-]+/g, "").includes(uuid);
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 8) return false;
  const lines = text.split("\n").map((line) => ({
    digits: line.replace(/\D/g, ""),
    masked: line.includes("*"),
  }));
  // CPF key printed as ***.456.789-**: the 6 middle digits on a masked line.
  if (digits.length === 11 && lines.some((l) => l.masked && l.digits.includes(digits.slice(3, 9))))
    return true;
  const tail = digits.slice(-8);
  return lines.some((l) => l.digits.includes(digits) || l.digits.endsWith(tail));
}

/** Tolerance for clocks (phone, bank, server). */
const CLOCK_SLACK_MS = 10 * 60_000;

export function checkReceiptText(rawText: string, expected: ReceiptExpectation): ReceiptCheck {
  const text = normalize(rawText);
  const reasons: string[] = [];

  const amount = amountsIn(text).includes(expected.amountCents);
  if (!amount) reasons.push("O valor do sinal não aparece no comprovante.");

  const recipient =
    keyMatches(text, expected.pixKey) ||
    expected.receiverNames.some((name) => nameMatches(text, name));
  if (!recipient) reasons.push("Seu nome ou sua chave Pix não aparecem como recebedor.");

  const e2e = findE2e(rawText);
  const when =
    e2e !== null &&
    e2e.at.getTime() >= expected.createdAt.getTime() - CLOCK_SLACK_MS &&
    e2e.at.getTime() <= expected.now.getTime() + CLOCK_SLACK_MS;
  if (!e2e) reasons.push("O ID da transação Pix não foi encontrado.");
  else if (!when) reasons.push("A data do Pix não combina com a do agendamento.");

  const txid = expected.txid?.replace(/[^A-Za-z0-9]/g, "").toUpperCase() ?? "";
  const reference = txid.length >= 10 && text.replace(/\s+/g, "").includes(txid);

  return {
    autoConfirm: amount && recipient && when,
    e2eId: e2e?.id ?? null,
    checks: { amount, recipient, when, reference },
    reasons: amount && recipient && when ? [] : reasons,
  };
}
