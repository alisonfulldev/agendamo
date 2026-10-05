/**
 * The link a visitor picked on the sales page ("agendamo.com/seu-nome") before signing up. Kept in
 * a cookie for a day, so the business wizard (server) opens with it filled in. Best effort: if the
 * e-mail is confirmed on another device, the wizard simply starts empty.
 */
export const DESIRED_SLUG_COOKIE = "lv_desired_slug";

export function saveDesiredSlug(slug: string): void {
  document.cookie = `${DESIRED_SLUG_COOKIE}=${encodeURIComponent(slug)}; path=/; max-age=86400; samesite=lax`;
}

export function clearDesiredSlug(): void {
  document.cookie = `${DESIRED_SLUG_COOKIE}=; path=/; max-age=0; samesite=lax`;
}
