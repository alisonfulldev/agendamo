import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import {
  BRAND_COOKIE,
  BRAND_HEADER,
  BRAND_QUERY_PARAM,
  getBrandByHost,
  isBrandSelectableHost,
  normalizeHost,
} from "@/brands/resolve";
import { getBrand, getBrandByDomain } from "@/brands";
import { DEMO_SESSION_COOKIE, isDemoMode } from "@/lib/demo/mode";
import { decodeDemoSession } from "@/lib/demo/session";
import { resolveCustomDomain } from "@/lib/domains/resolve";
import { PATH_HEADER } from "@/lib/request-headers";
import { securityHeaders } from "@/lib/security-headers";

const ONE_MONTH_SECONDS = 60 * 60 * 24 * 30;

/** Routes that need a signed-in user. */
const PROTECTED_PREFIXES = ["/painel", "/admin"];
/** Auth screens: signed-in users go straight to the panel. */
const AUTH_PAGES = ["/entrar", "/cadastro"];
/** Routes where the Supabase session is refreshed. Public pages skip it to stay fast. */
const SESSION_PREFIXES = [
  ...PROTECTED_PREFIXES,
  ...AUTH_PAGES,
  "/recuperar-senha",
  "/redefinir-senha",
  "/auth",
  "/api/uploads",
  "/api/push",
  "/api/events",
  "/api/google",
];

const matches = (path: string, prefixes: string[]) =>
  prefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));

/**
 * Resolves the brand from the Host header and forwards it as the internal x-brand header,
 * refreshes the Supabase session where needed and protects /painel and /admin.
 */
export async function proxy(request: NextRequest) {
  const host = request.headers.get("host");
  const path = request.nextUrl.pathname;
  const brandParam = request.nextUrl.searchParams.get(BRAND_QUERY_PARAM);
  const brandCookie = request.cookies.get(BRAND_COOKIE)?.value;
  let brand = getBrandByHost(host, { brandParam, brandCookie });

  // Prompt 38: a verified custom domain shows its business (root = the business page) in its brand.
  let rewriteTo: string | null = null;
  const normalized = normalizeHost(host);
  if (!getBrandByDomain(normalized) && !isBrandSelectableHost(normalized)) {
    const target = await resolveCustomDomain((host ?? "").toLowerCase().split(":")[0] ?? "");
    if (target) {
      brand = getBrand(target.brandKey) ?? brand;
      if (path === "/") rewriteTo = `/${target.slug}`;
    }
  }

  // Overwrites any x-brand / x-pathname sent by the client.
  const forwardedHeaders = () => {
    const headers = new Headers(request.headers);
    headers.set(BRAND_HEADER, brand.key);
    headers.set(PATH_HEADER, path);
    return headers;
  };

  const pass = () =>
    rewriteTo
      ? NextResponse.rewrite(new URL(rewriteTo, request.url), {
          request: { headers: forwardedHeaders() },
        })
      : NextResponse.next({ request: { headers: forwardedHeaders() } });

  let response = pass();
  let userId: string | null = null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (isDemoMode()) {
    userId = decodeDemoSession(request.cookies.get(DEMO_SESSION_COOKIE)?.value)?.sub ?? null;
  } else if (supabaseUrl && supabaseKey && matches(path, SESSION_PREFIXES)) {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet, cacheHeaders) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = pass();
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          Object.entries(cacheHeaders ?? {}).forEach(([key, value]) =>
            response.headers.set(key, value),
          );
        },
      },
    });
    const { data } = await supabase.auth.getClaims();
    userId = data?.claims.sub ?? null;
  }

  const redirectTo = (target: URL) => {
    const redirect = NextResponse.redirect(target);
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  };

  if (!userId && matches(path, PROTECTED_PREFIXES)) {
    const target = new URL("/entrar", request.url);
    target.searchParams.set("next", `${path}${request.nextUrl.search}`);
    response = redirectTo(target);
  }
  // Signed-in users on /entrar or /cadastro see a notice (account in use, sign out) instead of
  // a silent redirect: on localhost and previews every brand shares the same session.

  // On localhost / previews, remember the brand picked with ?brand=.
  if (
    isBrandSelectableHost(normalizeHost(host)) &&
    brandParam === brand.key &&
    brandCookie !== brand.key
  ) {
    response.cookies.set(BRAND_COOKIE, brand.key, {
      httpOnly: true,
      sameSite: "lax",
      secure: request.nextUrl.protocol === "https:",
      path: "/",
      maxAge: ONE_MONTH_SECONDS,
    });
  }

  // Prompt 40: CSP/HSTS/framing rules on every page (only /<slug>/agendar may be framed).
  for (const [key, value] of Object.entries(securityHeaders(path)))
    response.headers.set(key, value);
  return response;
}

export const config = {
  matcher: [
    // Everything except Next.js static assets and image/font files.
    "/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff|woff2)$).*)",
  ],
};
