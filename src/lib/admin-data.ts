import "server-only";

import { isDemoMode } from "@/lib/demo/mode";
import { createAdminClient } from "@/lib/supabase/admin";

/** E-mail of each business's owner (platform admin only). */
export async function ownerEmails(): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  // The demo database is local: read auth.users directly (no Auth admin API there).
  if (isDemoMode()) {
    const { getDemoDb } = await import("@/lib/demo/db");
    const db = await getDemoDb();
    const { rows } = await db.query<{ business_id: string; email: string }>(
      `select m.business_id, u.email from public.members m
       join auth.users u on u.id = m.user_id where m.role = 'owner'`,
    );
    for (const row of rows) result.set(row.business_id, row.email);
    return result;
  }

  const db = createAdminClient();
  const { data: members } = await db
    .from("members")
    .select("business_id, user_id")
    .eq("role", "owner")
    .limit(10000);
  const emailOf = new Map<string, string>();
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) break;
    for (const user of data.users) if (user.email) emailOf.set(user.id, user.email);
    if (data.users.length < 1000) break;
  }
  for (const m of members ?? []) {
    const email = emailOf.get(m.user_id as string);
    if (email) result.set(m.business_id as string, email);
  }
  return result;
}
