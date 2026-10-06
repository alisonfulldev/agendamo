/** Simple e-mail format check (same rule as the rest of the app). */
export const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Most used providers in Brazil: a domain one or two letters away is probably a typo. */
const DOMAINS = [
  "gmail.com",
  "hotmail.com",
  "outlook.com",
  "yahoo.com",
  "yahoo.com.br",
  "icloud.com",
  "live.com",
  "bol.com.br",
  "uol.com.br",
  "terra.com.br",
];

function distance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let previous = row[0]!;
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const current = row[j]!;
      row[j] = Math.min(row[j]! + 1, row[j - 1]! + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1));
      previous = current;
    }
  }
  return row[b.length]!;
}

/**
 * "ana@gmial.com" -> "ana@gmail.com". Null when the domain is a known one or nothing is close
 * enough (custom domains are left alone).
 */
export function suggestEmailFix(email: string): string | null {
  const [user, domain] = email.trim().toLowerCase().split("@");
  if (!user || !domain || DOMAINS.includes(domain)) return null;
  let best: { domain: string; score: number } | null = null;
  for (const candidate of DOMAINS) {
    const score = distance(domain, candidate);
    if (score <= 2 && (!best || score < best.score)) best = { domain: candidate, score };
  }
  return best ? `${user}@${best.domain}` : null;
}
