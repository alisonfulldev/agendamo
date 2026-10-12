import "server-only";

import { notFound } from "next/navigation";

import { getSessionUser, type SessionUser } from "@/lib/auth/session";
import { getServerEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Platform admin: listed in the platform_admins table (or in ADMIN_EMAILS, kept for the demo mode
 * and as a fallback). Checked on the server.
 */
export async function isPlatformAdmin(user: Pick<SessionUser, "id" | "email">): Promise<boolean> {
  if (getServerEnv().ADMIN_EMAILS.includes(user.email.toLowerCase())) return true;
  const { data, error } = await createAdminClient()
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) {
    console.error("platform_admins lookup failed", error.message);
    return false;
  }
  return Boolean(data);
}

/** Admin pages and actions. Everyone else gets a 404 (the panel's existence is not revealed). */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user || !(await isPlatformAdmin(user))) notFound();
  return user;
}
