/**
 * IndexNow (indexnow.org): tells Bing, Yandex and other participating engines that URLs changed,
 * so they recrawl sooner. Google does not use it. The key comes from INDEXNOW_KEY and is served
 * at /indexnow-key.txt (keyLocation). Only production submits; failures are logged, never thrown.
 */

export const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
/** Protocol limit of URLs per request. */
export const INDEXNOW_MAX_URLS = 10_000;
export const INDEXNOW_KEY_PATH = "/indexnow-key.txt";

/** The configured key, when it has the format IndexNow accepts (8–128 letters, digits, hyphens). */
export function indexNowKey(): string | null {
  const key = process.env.INDEXNOW_KEY?.trim();
  return key && /^[a-zA-Z0-9-]{8,128}$/.test(key) ? key : null;
}

/** Request bodies for the URLs: one per host (the protocol requires it), split at the limit. */
export function indexNowPayloads(urls: string[], key: string) {
  const byHost = new Map<string, Set<string>>();
  for (const raw of urls) {
    let url: URL;
    try {
      url = new URL(raw);
    } catch {
      continue;
    }
    if (url.protocol !== "https:") continue;
    const list = byHost.get(url.host) ?? new Set<string>();
    list.add(url.toString());
    byHost.set(url.host, list);
  }
  return [...byHost].flatMap(([host, set]) => {
    const list = [...set];
    const payloads = [];
    for (let start = 0; start < list.length; start += INDEXNOW_MAX_URLS) {
      payloads.push({
        host,
        key,
        keyLocation: `https://${host}${INDEXNOW_KEY_PATH}`,
        urlList: list.slice(start, start + INDEXNOW_MAX_URLS),
      });
    }
    return payloads;
  });
}

/** Submits the URLs. Returns how many requests were accepted (0 when off or nothing to send). */
export async function submitIndexNow(urls: string[]): Promise<number> {
  const key = indexNowKey();
  if (!key || process.env.VERCEL_ENV !== "production") return 0;
  let accepted = 0;
  for (const payload of indexNowPayloads(urls, key)) {
    try {
      const response = await fetch(INDEXNOW_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5000),
      });
      if (response.ok) accepted += 1;
      else console.error("IndexNow refused", payload.host, response.status);
    } catch (error) {
      console.error("IndexNow failed", payload.host, error);
    }
  }
  return accepted;
}
