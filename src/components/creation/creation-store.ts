/**
 * Open/closed state of the creation conversation, kept in the URL: `?criar=1` (or `?nome=` /
 * `?ramo=` from prospecting links) opens it, and the browser's back button closes it.
 */
const EVENT = "lv:creation";
/** sessionStorage key of the conversation in progress. */
export const CREATION_STORAGE_KEY = "lv_creation_v1";

const PARAMS = ["criar", "nome", "ramo"] as const;

export function subscribeCreation(onChange: () => void): () => void {
  window.addEventListener("popstate", onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

export function isCreationOpen(): boolean {
  const params = new URLSearchParams(window.location.search);
  return PARAMS.some((p) => params.has(p));
}

/**
 * Opens the conversation over the site (a history entry, so "back" closes it). `niche`: the niche
 * page's route, so the conversation skips the "o que você faz?" question.
 */
export function openCreation(niche?: string): void {
  if (isCreationOpen()) return;
  const url = new URL(window.location.href);
  url.searchParams.set("criar", "1");
  if (niche) url.searchParams.set("ramo", niche);
  window.history.pushState({ lvCreation: true }, "", url);
  window.dispatchEvent(new Event(EVENT));
}

/** Closes it: back when we opened it, else the opening params leave the URL. */
export function closeCreation(): void {
  if ((window.history.state as { lvCreation?: boolean } | null)?.lvCreation) {
    window.history.back();
    return;
  }
  const url = new URL(window.location.href);
  for (const p of PARAMS) url.searchParams.delete(p);
  window.history.replaceState(null, "", url);
  window.dispatchEvent(new Event(EVENT));
}

/** ?nome= / ?ramo= of a prospecting link, read once when the conversation starts. */
export function creationParams(): { name: string | null; niche: string | null } {
  const params = new URLSearchParams(window.location.search);
  return { name: params.get("nome")?.trim().slice(0, 120) || null, niche: params.get("ramo") };
}
