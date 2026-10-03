/** "@studio.bela", "instagram.com/studio.bela" or a full URL -> "https://instagram.com/studio.bela". */
export function normalizeInstagram(input: string | null | undefined): string | null {
  if (!input) return null;
  const value = input.trim();
  if (!value) return null;
  const handle = value
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/^instagram\.com\//i, "")
    .replace(/^@/, "")
    .split(/[/?#]/)[0];
  if (!handle || !/^[A-Za-z0-9._]{1,30}$/.test(handle)) return null;
  return `https://instagram.com/${handle}`;
}

export function instagramHandle(url: string | null | undefined): string | null {
  if (!url) return null;
  const match = url.match(/instagram\.com\/([A-Za-z0-9._]+)/i);
  return match ? `@${match[1]}` : null;
}
