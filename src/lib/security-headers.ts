/**
 * Security headers (Prompt 40). Every page refuses to be framed except the chat page used by the
 * external-site modal (/<slug>/agendar), which any site may embed, and the business page
 * (/<slug>), which only the same origin may frame (the phone preview in the panel).
 */

const EMBEDDABLE = /^\/([a-z0-9][a-z0-9-]{1,38}[a-z0-9])\/agendar\/?$/;
const INTERNAL = new Set(["painel", "admin", "api", "auth", "conta"]);

export function isEmbeddable(path: string): boolean {
  const match = path.match(EMBEDDABLE);
  return Boolean(match && !INTERNAL.has(match[1]!));
}

const SINGLE_SEGMENT = /^\/([a-z0-9][a-z0-9-]{1,38}[a-z0-9])\/?$/;

/** Business page: framable by the same origin only (panel preview). */
export function isSelfFramable(path: string): boolean {
  const match = path.match(SINGLE_SEGMENT);
  return Boolean(match && !INTERNAL.has(match[1]!));
}

function frameAncestors(path: string): string {
  if (isEmbeddable(path)) return "frame-ancestors *";
  return isSelfFramable(path) ? "frame-ancestors 'self'" : "frame-ancestors 'none'";
}

function origin(url: string | undefined): string | null {
  try {
    return url ? new URL(url).origin : null;
  } catch {
    return null;
  }
}

/** Where the Google Ads conversion ("Cadastro MeetChat") is sent from the sales site. */
const GOOGLE_ADS_HOSTS = [
  "https://www.googleadservices.com",
  "https://googleads.g.doubleclick.net",
  "https://*.doubleclick.net",
  "https://www.google.com",
  "https://www.google.com.br",
];

export function contentSecurityPolicy(path: string): string {
  const supabase = origin(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const r2Public = origin(process.env.R2_PUBLIC_URL);
  const sentry = origin(process.env.NEXT_PUBLIC_SENTRY_DSN);
  const dev = process.env.NODE_ENV !== "production";
  const connect = [
    "'self'",
    dev && "ws:",
    supabase,
    "https://*.r2.cloudflarestorage.com",
    sentry && "https://*.sentry.io",
    sentry,
    // Google tag on the sales site (src/components/google-tag.tsx).
    "https://*.google-analytics.com",
    "https://*.analytics.google.com",
    "https://*.googletagmanager.com",
    ...GOOGLE_ADS_HOSTS,
  ].filter(Boolean);
  const images = [
    "'self'",
    "data:",
    "blob:",
    r2Public,
    "https://*.google-analytics.com",
    "https://*.googletagmanager.com",
    ...GOOGLE_ADS_HOSTS,
  ].filter(Boolean);
  return [
    "default-src 'self'",
    // Next.js inline bootstrap scripts need 'unsafe-inline' without a nonce setup.
    `script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.googleadservices.com https://googleads.g.doubleclick.net${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src ${images.join(" ")}`,
    "font-src 'self'",
    `connect-src ${connect.join(" ")}`,
    // blob: for the HEIC decoder's worker (heic-to, loaded only for HEIC photos).
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    // Google Ads conversion measurement (sales site only).
    "frame-src 'self' https://td.doubleclick.net",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    frameAncestors(path),
  ].join("; ");
}

export function securityHeaders(path: string): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Security-Policy": contentSecurityPolicy(path),
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  };
  if (!isEmbeddable(path))
    headers["X-Frame-Options"] = isSelfFramable(path) ? "SAMEORIGIN" : "DENY";
  return headers;
}
