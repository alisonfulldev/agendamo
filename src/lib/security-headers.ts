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
  ].filter(Boolean);
  const images = ["'self'", "data:", "blob:", r2Public].filter(Boolean);
  return [
    "default-src 'self'",
    // Next.js inline bootstrap scripts need 'unsafe-inline' without a nonce setup.
    `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src ${images.join(" ")}`,
    "font-src 'self'",
    `connect-src ${connect.join(" ")}`,
    "worker-src 'self'",
    "manifest-src 'self'",
    "frame-src 'self'",
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
