import "server-only";

import { PLATFORM } from "@/brands";
import { audit } from "@/lib/audit";
import { addonPendingPix } from "@/lib/billing/service";
import { invalidatePublicPage } from "@/lib/cache";
import { isDemoMode } from "@/lib/demo/mode";
import { sendEmail } from "@/lib/email/send";
import { getServerEnv } from "@/lib/env";
import { formatBRL } from "@/lib/money";
import { claimNotification, notifyTeam } from "@/lib/notifications/owner";
import { submitIndexNow } from "@/lib/seo/indexnow";
import { siteUrl } from "@/lib/site-url";
import { createAdminClient } from "@/lib/supabase/admin";

import { registroBrUrl } from "./registro";
import {
  addProjectDomain,
  getDomainConfig,
  isVercelConfigured,
  verifyProjectDomain,
} from "./vercel";

const DAY = 86_400_000;

/** DNS records to set at Registro.br (Vercel's defaults; the live config may recommend others). */
export const DEFAULT_DNS = [
  { type: "A", name: "@ (deixe em branco)", value: "76.76.21.21" },
  { type: "CNAME", name: "www", value: "cname.vercel-dns.com" },
] as const;

export interface DomainRow {
  id: string;
  business_id: string;
  domain: string;
  verified: boolean;
  status: "awaiting_payment" | "awaiting_registration" | "connecting" | "live";
  expires_at: string | null;
  business: { name: string; slug: string; brand_key: string };
}

const SELECT =
  "id, business_id, domain, verified, status, expires_at, business:businesses(name, slug, brand_key)";

async function domainById(id: string): Promise<DomainRow | null> {
  const { data } = await createAdminClient()
    .from("custom_domains")
    .select(SELECT)
    .eq("id", id)
    .maybeSingle();
  return (data as DomainRow | null) ?? null;
}

async function setStatus(
  id: string,
  fields: Partial<Pick<DomainRow, "status" | "verified" | "expires_at">>,
) {
  await createAdminClient()
    .from("custom_domains")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", id);
}

/**
 * "Já registrei": adds the domain (and www, redirecting to it) to the Vercel project, then waits
 * for the DNS. In demo mode there is no Vercel: it goes straight to "connecting".
 */
export async function connectDomain(id: string): Promise<{ ok: boolean; message: string }> {
  const row = await domainById(id);
  if (!row) return { ok: false, message: "Domínio não encontrado." };
  if (!isDemoMode()) {
    if (!isVercelConfigured()) return { ok: false, message: "Faltam as chaves da Vercel." };
    const apex = await addProjectDomain(row.domain);
    if (apex.status >= 400 && apex.status !== 409) {
      return { ok: false, message: apex.data.error?.message ?? "A Vercel recusou o domínio." };
    }
    await addProjectDomain(`www.${row.domain}`, row.domain);
  }
  await setStatus(row.id, { status: "connecting" });
  await audit({
    businessId: row.business_id,
    userId: null,
    action: "domain.added",
    details: { domain: row.domain, via: "whatsapp_sale" },
  });
  return { ok: true, message: "Conectado. Assim que o DNS propagar, o site entra no ar." };
}

/** Checks the DNS of a connecting domain; when right, the site goes live and the owner is told. */
export async function checkDomain(id: string): Promise<{ ok: boolean; message: string }> {
  const row = await domainById(id);
  if (!row) return { ok: false, message: "Domínio não encontrado." };
  if (!isDemoMode()) {
    const config = await getDomainConfig(row.domain);
    if (config.status >= 400 || config.data.misconfigured) {
      return {
        ok: false,
        message: "O DNS ainda não está apontando para cá. Pode levar algumas horas.",
      };
    }
    const verify = await verifyProjectDomain(row.domain);
    if (verify.status >= 400 || !verify.data.verified) {
      return { ok: false, message: "A Vercel ainda não confirmou o domínio. Tente mais tarde." };
    }
  }
  await setStatus(row.id, { status: "live", verified: true });
  invalidatePublicPage(row.business.slug);
  const url = `https://${row.domain}/`;
  await submitIndexNow([url]).catch(() => 0);
  if (await claimNotification(row.business_id, "domain_live", row.domain)) {
    await notifyTeam({
      businessId: row.business_id,
      type: "account",
      subject: `Seu site está no ar em ${row.domain}`,
      content: {
        heading: "Seu domínio está no ar 🎉",
        paragraphs: [
          `O site de ${row.business.name} agora abre em ${row.domain}. Use esse endereço no Instagram, no Google e onde quiser.`,
          "O cadeado (https) já está ativo. O endereço antigo leva para o novo sozinho.",
        ],
        cta: { label: "Abrir meu site", url },
      },
      push: { title: "Seu domínio está no ar", body: row.domain, url: "/painel/site" },
    });
  }
  return { ok: true, message: "No ar! O cliente recebeu o aviso." };
}

/** "Renovei no Registro.br": one more year. */
export async function renewDomain(id: string): Promise<void> {
  const row = await domainById(id);
  if (!row) return;
  const base = row.expires_at ? new Date(`${row.expires_at}T12:00:00Z`) : new Date();
  base.setUTCFullYear(base.getUTCFullYear() + 1);
  await setStatus(row.id, { expires_at: base.toISOString().slice(0, 10) });
}

/**
 * Daily: checks the domains waiting for the DNS, reminds the admins to renew at Registro.br 30
 * days before it expires, and sends the customer the yearly Pix 10 days before. Idempotent.
 */
export async function runDomainJobs(
  now = Date.now(),
): Promise<{ live: number; reminders: number }> {
  const admin = createAdminClient();
  let live = 0;
  let reminders = 0;

  const { data: connecting } = await admin
    .from("custom_domains")
    .select("id")
    .eq("status", "connecting")
    .limit(50);
  for (const row of connecting ?? []) {
    if ((await checkDomain(row.id as string).catch(() => ({ ok: false }))).ok) live++;
  }

  const soon = new Date(now + 30 * DAY).toISOString().slice(0, 10);
  const { data: expiring } = await admin
    .from("custom_domains")
    .select(SELECT)
    .in("status", ["connecting", "live"])
    .lte("expires_at", soon);
  const admins = getServerEnv().ADMIN_EMAILS;
  for (const row of (expiring ?? []) as unknown as DomainRow[]) {
    const expires = new Date(`${row.expires_at}T12:00:00Z`).getTime();
    if (
      admins.length &&
      (await claimNotification(row.business_id, "domain_renew_admin", row.expires_at!))
    ) {
      await sendEmail({
        brand: PLATFORM,
        to: admins,
        subject: `Renovar domínio: ${row.domain} (vence ${row.expires_at!.split("-").reverse().join("/")})`,
        content: {
          heading: "Domínio para renovar no Registro.br",
          paragraphs: [
            `${row.domain} (${row.business.name}) vence em ${row.expires_at!.split("-").reverse().join("/")}. Renove no Registro.br e marque "Renovei" em Admin › Vendas › Domínios.`,
          ],
          cta: { label: "Abrir o Registro.br", url: registroBrUrl(row.domain) },
          secondaryLinks: [{ label: "Domínios no admin", url: siteUrl("/admin/vendas/dominios") }],
        },
      }).catch((error) => console.error("domain renew admin e-mail failed", error));
      reminders++;
    }
    if (
      expires - now <= 10 * DAY &&
      (await claimNotification(row.business_id, "domain_renew_client", row.expires_at!))
    ) {
      const { data: sub } = await admin
        .from("subscriptions")
        .select("addons")
        .eq("business_id", row.business_id)
        .maybeSingle();
      const subscriptionId = (
        sub?.addons as { custom_domain?: { subscription_id?: string } } | null
      )?.custom_domain?.subscription_id;
      const pix = subscriptionId ? await addonPendingPix(subscriptionId).catch(() => null) : null;
      if (pix) {
        await notifyTeam({
          businessId: row.business_id,
          type: "account",
          subject: `Renovação do domínio ${row.domain}`,
          content: {
            heading: "Hora de renovar o seu domínio",
            paragraphs: [
              `${row.domain} renova por mais 1 ano por ${formatBRL(pix.valueCents)}. Pague pelo Pix abaixo (copia e cola) para o seu site continuar no ar nesse endereço.`,
              pix.payload,
            ],
          },
          push: {
            title: "Renove seu domínio",
            body: `${row.domain}: Pix no seu e-mail.`,
            url: "/painel",
          },
        });
        reminders++;
      }
    }
  }
  return { live, reminders };
}
