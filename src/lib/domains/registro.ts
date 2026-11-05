import "server-only";

import { isDemoMode } from "@/lib/demo/mode";

/** A .br domain sold with "Site + Agenda" ("studiobela.com.br"): lowercase, no www, no path. */
export function normalizeBrDomain(input: string): string | null {
  const host = input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split(/[/?#]/)[0]!;
  return /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9-]+)*\.br$/.test(host) && host.includes(".")
    ? host
    : null;
}

export type DomainAvailability = "available" | "taken" | "unknown";

/**
 * Whether a .br domain is free, from Registro.br's public RDAP service (404 = not registered).
 * "unknown" when the service does not answer (the seller checks at registro.br).
 */
export async function brDomainAvailability(domain: string): Promise<DomainAvailability> {
  if (isDemoMode()) return domain.startsWith("ocupado") ? "taken" : "available";
  try {
    const response = await fetch(`https://rdap.registro.br/domain/${encodeURIComponent(domain)}`, {
      headers: { Accept: "application/rdap+json" },
      cache: "no-store",
      signal: AbortSignal.timeout(6000),
    });
    if (response.status === 404) return "available";
    if (response.ok) return "taken";
    return "unknown";
  } catch {
    return "unknown";
  }
}

/** Where to register it (Registro.br search with the domain filled in). */
export function registroBrUrl(domain: string): string {
  return `https://registro.br/busca-dominio/?fqdn=${encodeURIComponent(domain)}`;
}
