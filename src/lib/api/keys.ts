import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { createAdminClient } from "@/lib/supabase/admin";

/** API keys of the owner's own AI (MCP / REST). Only the SHA-256 is stored. */
const KEY_PREFIX = "mc_live_";

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export interface ApiKeyInfo {
  prefix: string;
  createdAt: string;
  lastUsedAt: string | null;
}

export async function activeApiKey(businessId: string): Promise<ApiKeyInfo | null> {
  const { data } = await createAdminClient()
    .from("api_keys")
    .select("prefix, created_at, last_used_at")
    .eq("business_id", businessId)
    .is("revoked_at", null)
    .maybeSingle();
  return data
    ? {
        prefix: data.prefix as string,
        createdAt: data.created_at as string,
        lastUsedAt: (data.last_used_at as string | null) ?? null,
      }
    : null;
}

export async function revokeApiKeys(businessId: string): Promise<void> {
  const { error } = await createAdminClient()
    .from("api_keys")
    .update({ revoked_at: new Date().toISOString() })
    .eq("business_id", businessId)
    .is("revoked_at", null);
  if (error) throw new Error(`revoke api key failed: ${error.message}`);
}

/** Revokes the current key and returns a new one (shown once). */
export async function createApiKey(businessId: string, userId: string): Promise<string> {
  await revokeApiKeys(businessId);
  const key = `${KEY_PREFIX}${randomBytes(32).toString("base64url")}`;
  const { error } = await createAdminClient()
    .from("api_keys")
    .insert({
      business_id: businessId,
      key_hash: hashApiKey(key),
      prefix: key.slice(0, KEY_PREFIX.length + 4),
      created_by: userId,
    });
  if (error) throw new Error(`create api key failed: ${error.message}`);
  return key;
}

/** Business of a Bearer key, or null. Records the last use (at most once a minute). */
export async function authenticateApiKey(
  request: Request,
): Promise<{ keyId: string; businessId: string } | null> {
  const header = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(\S+)$/i.exec(header.trim());
  const key = match?.[1] ?? request.headers.get("x-api-key")?.trim();
  if (!key || !key.startsWith(KEY_PREFIX) || key.length > 200) return null;
  const admin = createAdminClient();
  const { data } = await admin
    .from("api_keys")
    .select("id, business_id, last_used_at")
    .eq("key_hash", hashApiKey(key))
    .is("revoked_at", null)
    .maybeSingle();
  if (!data) return null;
  const last = data.last_used_at ? new Date(data.last_used_at as string).getTime() : 0;
  if (Date.now() - last > 60_000) {
    await admin
      .from("api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", data.id);
  }
  return { keyId: data.id as string, businessId: data.business_id as string };
}
