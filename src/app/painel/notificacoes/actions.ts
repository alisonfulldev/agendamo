"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/lib/auth/session";
import { OWNER_NOTIFICATION_TYPES } from "@/lib/notifications/owner";
import { createClient } from "@/lib/supabase/server";

const types = Object.keys(OWNER_NOTIFICATION_TYPES) as [string, ...string[]];
const schema = z
  .array(z.object({ type: z.enum(types), email: z.boolean(), push: z.boolean() }))
  .max(types.length);

export async function savePreferencesAction(input: unknown): Promise<{ ok: boolean }> {
  const user = await requireUser();
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false };
  const supabase = await createClient();
  const { error } = await supabase
    .from("notification_preferences")
    .upsert(parsed.data.map((p) => ({ user_id: user.id, ...p })));
  revalidatePath("/painel/notificacoes");
  return { ok: !error };
}
