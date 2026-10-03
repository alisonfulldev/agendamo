import "server-only";

import { decrypt, encrypt } from "@/lib/crypto";
import { getServerEnv, requireServerEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

// Google OAuth 2.0 + Calendar API v3 (REST, no extra library).
export const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.freebusy",
];
const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const REVOKE_URL = "https://oauth2.googleapis.com/revoke";
export const CALENDAR_API = "https://www.googleapis.com/calendar/v3";

export function isGoogleConfigured(): boolean {
  const env = getServerEnv();
  return Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.ENCRYPTION_KEY);
}

/** Redirect back to the brand domain the owner is on (each domain is registered in Google Cloud). */
export function redirectUri(origin: string): string {
  return `${origin}/api/google/callback`;
}

export function authorizationUrl(origin: string, state: string): string {
  const env = requireServerEnv("GOOGLE_CLIENT_ID");
  const url = new URL(AUTH_URL);
  url.searchParams.set("client_id", env.GOOGLE_CLIENT_ID);
  url.searchParams.set("redirect_uri", redirectUri(origin));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", GOOGLE_SCOPES.join(" "));
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("include_granted_scopes", "true");
  url.searchParams.set("state", state);
  return url.toString();
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

async function tokenRequest(body: Record<string, string>): Promise<TokenResponse> {
  const env = requireServerEnv("GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET");
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      ...body,
    }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Google token request failed (${response.status})`);
  return (await response.json()) as TokenResponse;
}

export function exchangeCode(code: string, origin: string) {
  return tokenRequest({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri(origin),
  });
}

export interface Connection {
  id: string;
  business_id: string;
  professional_id: string;
  access_token_encrypted: string;
  refresh_token_encrypted: string;
  token_expires_at: string | null;
  calendar_id: string;
}

export async function getConnection(professionalId: string): Promise<Connection | null> {
  if (!isGoogleConfigured()) return null;
  const { data } = await createAdminClient()
    .from("calendar_connections")
    .select("*")
    .eq("professional_id", professionalId)
    .eq("provider", "google")
    .maybeSingle();
  return (data as Connection | null) ?? null;
}

/** Valid access token, refreshed (and stored encrypted) when it is about to expire. */
export async function accessToken(connection: Connection): Promise<string> {
  const expires = connection.token_expires_at ? new Date(connection.token_expires_at).getTime() : 0;
  if (expires - Date.now() > 60_000) return decrypt(connection.access_token_encrypted);
  const refreshed = await tokenRequest({
    grant_type: "refresh_token",
    refresh_token: decrypt(connection.refresh_token_encrypted),
  });
  await createAdminClient()
    .from("calendar_connections")
    .update({
      access_token_encrypted: encrypt(refreshed.access_token),
      token_expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
    })
    .eq("id", connection.id);
  return refreshed.access_token;
}

export async function saveConnection(input: {
  businessId: string;
  professionalId: string;
  tokens: TokenResponse;
}): Promise<void> {
  if (!input.tokens.refresh_token) throw new Error("Google did not return a refresh token");
  const { error } = await createAdminClient()
    .from("calendar_connections")
    .upsert(
      {
        business_id: input.businessId,
        professional_id: input.professionalId,
        provider: "google",
        access_token_encrypted: encrypt(input.tokens.access_token),
        refresh_token_encrypted: encrypt(input.tokens.refresh_token),
        token_expires_at: new Date(Date.now() + input.tokens.expires_in * 1000).toISOString(),
        calendar_id: "primary",
      },
      { onConflict: "professional_id,provider" },
    );
  if (error) throw new Error(`save connection failed: ${error.message}`);
}

/** Revokes the grant at Google (best effort) and deletes the stored tokens. */
export async function disconnect(professionalId: string): Promise<void> {
  const connection = await getConnection(professionalId);
  if (!connection) return;
  await fetch(
    `${REVOKE_URL}?token=${encodeURIComponent(decrypt(connection.refresh_token_encrypted))}`,
    { method: "POST" },
  ).catch(() => undefined);
  await createAdminClient().from("calendar_connections").delete().eq("id", connection.id);
}

export async function calendarFetch(
  connection: Connection,
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const token = await accessToken(connection);
  return fetch(`${CALENDAR_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
}
