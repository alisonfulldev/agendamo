/**
 * Where a new account came from, in words for the admin panel ("Google (busca)", "ChatGPT",
 * "Anúncio Meta"…). Built from the `source` saved with the sign-up (audit_log business.created):
 * the ad click ids, the UTM tags, the referring site and the first page of the visit.
 * Nothing personal: only domains, tags and paths.
 */
export interface SignupSource {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  via?: string;
  referrer?: string;
  landing?: string;
  page?: string;
  /** Ad click id seen in the address ("google" for gclid, "meta" for fbclid). */
  click?: string;
}

export interface SignupOrigin {
  /** Short label for the list ("Google (busca)"). */
  label: string;
  /** Extra detail: the first page of the visit and the campaign, when known. */
  detail: string | null;
}

const REFERRERS: [RegExp, string][] = [
  [/(^|\.)chatgpt\.com$|(^|\.)openai\.com$/, "ChatGPT"],
  [/(^|\.)perplexity\.ai$/, "Perplexity"],
  [/(^|\.)gemini\.google\.com$/, "Gemini"],
  [/(^|\.)copilot\.microsoft\.com$/, "Copilot"],
  [/(^|\.)claude\.ai$/, "Claude"],
  [/(^|\.)google\.[a-z.]+$/, "Google (busca)"],
  [/(^|\.)bing\.com$/, "Bing"],
  [/(^|\.)duckduckgo\.com$/, "DuckDuckGo"],
  [/(^|\.)yahoo\.com$/, "Yahoo"],
  [/(^|\.)instagram\.com$/, "Instagram"],
  [/(^|\.)facebook\.com$|(^|\.)fb\.com$/, "Facebook"],
  [/(^|\.)whatsapp\.com$|^wa\.me$/, "WhatsApp"],
  [/(^|\.)youtube\.com$/, "YouTube"],
  [/(^|\.)tiktok\.com$/, "TikTok"],
  [/(^|\.)linkedin\.com$|^lnkd\.in$/, "LinkedIn"],
];

const UTM_SOURCES: [RegExp, string][] = [
  [/chatgpt|openai/, "ChatGPT"],
  [/perplexity/, "Perplexity"],
  [/gemini/, "Gemini"],
  [/copilot/, "Copilot"],
  [/claude/, "Claude"],
  [/^(meta|facebook|fb|instagram|ig)$/, "Meta"],
  [/^google$/, "Google"],
  [/whatsapp/, "WhatsApp"],
  [/tiktok/, "TikTok"],
  [/youtube/, "YouTube"],
];

const PAID = /^(pago|paid|cpc|ppc|ads?|anuncio|anúncio)$/i;

function fromList(value: string, list: [RegExp, string][]): string | null {
  const v = value.toLowerCase();
  return list.find(([pattern]) => pattern.test(v))?.[1] ?? null;
}

export function signupOrigin(source: SignupSource | null | undefined): SignupOrigin {
  if (!source) return { label: "—", detail: null };
  const landing = source.landing ?? source.page ?? null;
  const detail =
    [landing ? `entrou por ${landing}` : null, source.utm_campaign ?? null]
      .filter(Boolean)
      .join(" · ") || null;

  if (source.click === "google") return { label: "Anúncio Google", detail };
  if (source.click === "meta") {
    const paid = source.utm_medium && PAID.test(source.utm_medium);
    return { label: paid ? "Anúncio Meta" : "Facebook / Instagram", detail };
  }
  if (source.utm_source) {
    const name = fromList(source.utm_source, UTM_SOURCES) ?? source.utm_source;
    const paid = source.utm_medium && PAID.test(source.utm_medium);
    return { label: paid ? `Anúncio ${name}` : name, detail };
  }
  if (source.via === "nome") return { label: "Link de prospecção", detail };
  if (source.referrer) {
    const host = source.referrer.replace(/^www\./, "");
    return { label: fromList(host, REFERRERS) ?? host, detail };
  }
  return { label: "Direto ou não identificado", detail };
}
