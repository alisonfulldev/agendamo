/**
 * Serializes structured data for a <script type="application/ld+json">. Escapes "<" so text typed
 * by owners (bio, service names) can never close the script tag.
 */
export function jsonLdHtml(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
