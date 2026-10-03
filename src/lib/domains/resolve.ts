import { createClient } from "@supabase/supabase-js";

/** Business behind a verified custom domain, as needed by the proxy. */
export interface CustomDomainTarget {
  slug: string;
  brandKey: string;
}

const TTL_MS = 60_000;
const cache = new Map<string, { value: CustomDomainTarget | null; expires: number }>();

/**
 * Looks up a custom domain with the anon key (public RPC, verified domains only), cached in
 * memory for a minute per server instance so the proxy stays fast.
 */
export async function resolveCustomDomain(host: string): Promise<CustomDomainTarget | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // Demo mode: custom domains need real DNS, so they are never resolved locally.
  if (!url || !key || !host || process.env.DEMO_MODE === "1") return null;
  const hit = cache.get(host);
  if (hit && hit.expires > Date.now()) return hit.value;

  let value: CustomDomainTarget | null = null;
  try {
    const client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data } = await client.rpc("get_custom_domain", { p_domain: host });
    const row = (data as { slug: string; brand_key: string }[] | null)?.[0];
    value = row ? { slug: row.slug, brandKey: row.brand_key } : null;
  } catch {
    value = null;
  }
  cache.set(host, { value, expires: Date.now() + TTL_MS });
  return value;
}

/** "https://WWW.Meu-Salao.com.br/x" -> "www.meu-salao.com.br" (keeps www: the owner's exact host). */
export function normalizeCustomDomain(input: string): string | null {
  const value =
    input
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .split(/[/?#:]/)[0] ?? "";
  if (!/^([a-z0-9-]+\.)+[a-z]{2,}$/.test(value) || value.length > 253) return null;
  return value;
}
