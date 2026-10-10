"use server";

import { rmSync } from "node:fs";
import path from "node:path";

import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";

import { getRequestOrigin } from "@/brands/server";
import { confirmDemoPayment } from "@/lib/billing/asaas";
import { handleAsaasEvent } from "@/lib/billing/service";
import { invalidatePublicPage } from "@/lib/cache";
import { resetDemoDb, getDemoDb } from "@/lib/demo/db";
import { clearDemoEmails } from "@/lib/demo/mailbox";
import { CRON_JOBS } from "@/lib/demo/cron-jobs";
import { FREE_BOOKINGS_PER_CYCLE } from "@/lib/plans";
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
  plan: z.enum(["free", "trial_agenda", "trial_pro", "agenda", "pro", "ended"]),
});

/**
 * Switches a business between Grátis (never tested), a 7-day trial of Agenda or Pro, Agenda,
 * Pro and "trial ended" (Grátis after a trial) directly (no billing).
 */
export async function demoSetPlanAction(formData: FormData): Promise<void> {
  guard();
  const { businessId, plan } = planSchema.parse(Object.fromEntries(formData));
  const db = await getDemoDb();
  const row = (
    await db.query<{ slug: string }>(
      `update public.businesses set
         plan = case when $2 in ('agenda', 'pro') then $2 else 'free' end,
         trial_plan = case
           when $2 = 'trial_agenda' then 'agenda'
           when $2 in ('trial_pro', 'ended') then 'pro'
           else null end,
         trial_started_at = case
           when $2 like 'trial_%' then now()
           when $2 = 'ended' then now() - interval '12 days'
           else null end,
         trial_ends_at = case
           when $2 like 'trial_%' then now() + interval '7 days'
           when $2 = 'ended' then now() - interval '5 days'
           else null end
       where id = $1 returning slug`,
      [businessId, plan],
    )
  ).rows[0];
  // Without a subscription (trial / expired) the simulated Asaas subscription goes away too, so
  // the checkout starts fresh.
  // A subscribed state also sets the simulated subscription's plan (no leftover from a test).
  if (plan === "agenda" || plan === "pro") {
    await db.query(
      "update public.subscriptions set plan = $2, pending_plan = null where business_id = $1",
      [businessId, plan],
    );
  } else {
    await db.query("delete from public.subscriptions where business_id = $1", [businessId]);
  }
  if (row) invalidatePublicPage(row.slug);
  redirect("/demo?ok=plano#planos");
}

/**
 * Grátis plan: uses the 10 automatic bookings of the current cycle at once (10 chat bookings
 * created now, completed in the past so they never block a time and can be repeated), so the
 * WhatsApp hand-off can be tested.
 */
export async function demoFillFreeCycleAction(formData: FormData): Promise<void> {
  guard();
  const businessId = z.uuid().parse(formData.get("businessId"));
  const db = await getDemoDb();
  const row = (
    await db.query<{ slug: string; professional_id: string }>(
      `select b.slug, p.id as professional_id from public.businesses b
       join public.professionals p on p.business_id = b.id
       where b.id = $1 order by p.position limit 1`,
      [businessId],
    )
  ).rows[0];
  if (!row) redirect("/demo#planos");
  const customer = (
    await db.query<{ id: string }>(
      `insert into public.customers (business_id, name, phone) values ($1, 'Cliente do ciclo', null)
       returning id`,
      [businessId],
    )
  ).rows[0]!;
  for (let i = 0; i < FREE_BOOKINGS_PER_CYCLE; i++) {
    await db.query(
      `insert into public.appointments (business_id, professional_id, customer_id, starts_at, ends_at, status, source)
       values ($1, $2, $3, now() - interval '400 days' + make_interval(hours => $4::int),
         now() - interval '400 days' + make_interval(hours => $4::int, mins => 30), 'completed', 'chat')`,
      [businessId, row.professional_id, customer.id, i * 2],
    );
  }
  invalidatePublicPage(row.slug);
  redirect("/demo?ok=ciclo#planos");
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

/** Simulates the Asaas webhook confirming the open charge of a subscription (own checkout). */
export async function demoConfirmPaymentAction(formData: FormData): Promise<void> {
  guard();
  const subscriptionId = z.string().min(1).max(100).parse(formData.get("subscriptionId"));
  const payment = confirmDemoPayment(subscriptionId);
  if (payment) {
    await handleAsaasEvent({
      id: `evt_demo_${payment.id}`,
      event: "PAYMENT_CONFIRMED",
      payment,
    });
  }
  redirect(`/demo?ok=${payment ? "pagamento" : "sem-cobranca"}#assinaturas`);
}
