"use server";

import { rmSync } from "node:fs";
import path from "node:path";

import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";

import { getRequestOrigin } from "@/brands/server";
import { invalidatePublicPage } from "@/lib/cache";
import { resetDemoDb, getDemoDb } from "@/lib/demo/db";
import { clearDemoEmails } from "@/lib/demo/mailbox";
import { CRON_JOBS } from "@/lib/demo/cron-jobs";
import { DEMO_DATA_DIR, DEMO_SESSION_COOKIE, isDemoMode } from "@/lib/demo/mode";
import { DEMO_PERSONAS } from "@/lib/demo/seed";
import { encodeDemoSession } from "@/lib/demo/session";
import { getServerEnv } from "@/lib/env";

function guard() {
  if (!isDemoMode()) notFound();
}

/** Signs in as a demo persona without a password and opens their panel in their brand. */
export async function demoSignInAction(formData: FormData): Promise<void> {
  guard();
  const email = z.email().parse(formData.get("email"));
  const db = await getDemoDb();
  const user = (
    await db.query<{ id: string; email: string }>(
      "select id, email from auth.users where lower(email) = lower($1)",
      [email],
    )
  ).rows[0];
  if (!user) redirect("/demo?erro=usuario");
  const store = await cookies();
  store.set(DEMO_SESSION_COOKIE, encodeDemoSession({ sub: user.id, email: user.email }), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  const persona = DEMO_PERSONAS.find((p) => p.email === email);
  if (email === "admin@demo.com") redirect("/admin");
  redirect(persona?.brandKey ? `/painel?brand=${persona.brandKey}` : "/painel");
}

export async function demoSignOutAction(): Promise<void> {
  guard();
  (await cookies()).delete(DEMO_SESSION_COOKIE);
  redirect("/demo");
}

/** Signs out and opens the sign-up form of a brand, to test the whole flow from zero. */
export async function demoStartSignUpAction(formData: FormData): Promise<void> {
  guard();
  const brand = z
    .string()
    .regex(/^[a-z_]+$/)
    .parse(formData.get("brand"));
  (await cookies()).delete(DEMO_SESSION_COOKIE);
  redirect(`/cadastro?brand=${brand}`);
}

const planSchema = z.object({
  businessId: z.uuid(),
  plan: z.enum(["trial", "subscribed", "expired"]),
});

/** Switches a business between trial, subscribed and expired directly (no billing). */
export async function demoSetPlanAction(formData: FormData): Promise<void> {
  guard();
  const { businessId, plan } = planSchema.parse(Object.fromEntries(formData));
  const db = await getDemoDb();
  const row = (
    await db.query<{ slug: string }>(
      `update public.businesses set
         plan = case when $2 = 'subscribed' then 'pro' else 'free' end,
         trial_started_at = case when $2 = 'trial' then now() else now() - interval '35 days' end,
         trial_ends_at = case when $2 = 'trial' then now() + interval '30 days' else now() - interval '5 days' end
       where id = $1 returning slug`,
      [businessId, plan],
    )
  ).rows[0];
  if (row) invalidatePublicPage(row.slug);
  redirect("/demo?ok=plano#planos");
}

/** Runs a scheduled job now, exactly as pg_cron would call it. */
export async function demoRunCronAction(formData: FormData): Promise<void> {
  guard();
  const job = z.enum(CRON_JOBS).parse(formData.get("job"));
  const origin = await getRequestOrigin();
  const response = await fetch(`${origin}/api/cron/${job}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getServerEnv().CRON_SECRET ?? ""}` },
    cache: "no-store",
  });
  const body = await response.text();
  redirect(`/demo?cron=${job}&resultado=${encodeURIComponent(body.slice(0, 300))}#tarefas`);
}

export async function demoClearEmailsAction(): Promise<void> {
  guard();
  clearDemoEmails();
  redirect("/demo#emails");
}

/** Erases everything (database, e-mails, uploaded files); the next request recreates the demo data. */
export async function demoResetAction(): Promise<void> {
  guard();
  await resetDemoDb();
  clearDemoEmails();
  rmSync(path.join(process.cwd(), DEMO_DATA_DIR, "files"), { recursive: true, force: true });
  (await cookies()).delete(DEMO_SESSION_COOKIE);
  redirect("/demo?ok=reset");
}
