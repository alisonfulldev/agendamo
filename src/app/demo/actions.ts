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
  plan: z.enum(["trial", "complete", "ended"]),
});

/**
 * Switches a business between the 14-day trial, subscribed (Completo) and "trial ended"
 * (waiting mode) directly (no billing).
 */
export async function demoSetPlanAction(formData: FormData): Promise<void> {
  guard();
  const { businessId, plan } = planSchema.parse(Object.fromEntries(formData));
  const db = await getDemoDb();
  const row = (
    await db.query<{ slug: string }>(
      `update public.businesses set
         plan = case when $2 = 'complete' then 'complete' else 'free' end,
         trial_started_at = case
           when $2 = 'ended' then now() - interval '19 days'
           else now() end,
         trial_ends_at = case
           when $2 = 'ended' then now() - interval '5 days'
           else now() + interval '14 days' end
       where id = $1 returning slug`,
      [businessId, plan],
    )
  ).rows[0];
  // Without a subscription (trial / expired) the simulated Asaas subscription goes away too, so
  // the checkout starts fresh.
  // A subscribed state also sets the simulated subscription's plan (no leftover from a test).
  if (plan === "complete") {
    await db.query(
      "update public.subscriptions set plan = 'complete', pending_plan = null where business_id = $1",
      [businessId],
    );
  } else {
    await db.query("delete from public.subscriptions where business_id = $1", [businessId]);
  }
  // Back to the default: no deposit by Pix (the "Ligar sinal Pix" button turns it on again), so
  // tests that change a plan start from the same state.
  await db.query(
    "update public.services set deposit_type = 'none', deposit_value = 0 where business_id = $1",
    [businessId],
  );
  await db.query(
    "update public.page_settings set deposit_policy_text = null where business_id = $1",
    [businessId],
  );
  if (row) invalidatePublicPage(row.slug);
  redirect("/demo?ok=plano#planos");
}

/** Deposit by Pix: Pix key, city, policy and a R$ 30 deposit on every service of the business. */
export async function demoEnableDepositsAction(formData: FormData): Promise<void> {
  guard();
  const businessId = z.uuid().parse(formData.get("businessId"));
  const db = await getDemoDb();
  await db.query(
    `update public.page_settings set pix_key = 'pix@demo.com.br', pix_receiver_name = 'NEGOCIO DEMO',
       pix_city = 'SAO PAULO', deposit_hold_minutes = 20,
       deposit_policy_text = 'Cancelamentos com mais de 24 horas devolvem o sinal. Faltas sem aviso não têm devolução.'
     where business_id = $1`,
    [businessId],
  );
  await db.query(
    "update public.services set deposit_type = 'fixed', deposit_value = 3000 where business_id = $1",
    [businessId],
  );
  const row = (
    await db.query<{ slug: string }>("select slug from public.businesses where id = $1", [
      businessId,
    ])
  ).rows[0];
  if (row) invalidatePublicPage(row.slug);
  redirect("/demo?ok=sinal#planos");
}

/** Makes every reservation waiting for a Pix receipt end now (then run "Sinais Pix vencidos"). */
export async function demoExpireDepositHoldsAction(): Promise<void> {
  guard();
  const db = await getDemoDb();
  await db.query(
    "update public.appointments set deposit_expires_at = now() - interval '1 minute' where deposit_status = 'waiting'",
  );
  redirect("/demo?ok=vencer#tarefas");
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
