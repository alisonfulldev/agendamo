/**
 * Sentry DSN for the browser, without zod: this file runs on every page (instrumentation-client),
 * so it must stay tiny. Empty or invalid means Sentry stays off.
 */
export function browserSentryDsn(): string | undefined {
  const value = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();
  if (!value) return undefined;
  try {
    return new URL(value).protocol.startsWith("http") ? value : undefined;
  } catch {
    return undefined;
  }
}
