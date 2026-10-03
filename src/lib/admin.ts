import "server-only";

import { notFound } from "next/navigation";

import { getSessionUser, type SessionUser } from "@/lib/auth/session";
import { getServerEnv } from "@/lib/env";

/** Platform admin (ADMIN_EMAILS), checked on the server. Everyone else gets a 404. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await getSessionUser();
  const admins = getServerEnv().ADMIN_EMAILS;
  if (!user || !admins.includes(user.email.toLowerCase())) notFound();
  return user;
}
