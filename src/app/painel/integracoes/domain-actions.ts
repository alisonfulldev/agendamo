"use server";

import { revalidatePath } from "next/cache";

import { BRANDS } from "@/brands";
import { audit } from "@/lib/audit";
import { requireOwner, type BusinessContext } from "@/lib/business/context";
import type { Subscription } from "@/lib/db/types";
import { normalizeCustomDomain } from "@/lib/domains/resolve";
import {
  addProjectDomain,
  getDomainConfig,
  isVercelConfigured,
  removeProjectDomain,
  verifyProjectDomain,
} from "@/lib/domains/vercel";
import { createAdminClient } from "@/lib/supabase/admin";

type Result = { ok: boolean; message: string };

/** The add-on must be active (checked on the server, rule 6). */
async function hasDomainAddon(context: BusinessContext): Promise<boolean> {
  const { data } = await createAdminClient()
    .from("subscriptions")
    .select("addons, status")
    .eq("business_id", context.business.id)
    .maybeSingle();
  const sub = data as Pick<Subscription, "addons" | "status"> | null;
  return Boolean(
    sub &&
    (sub.status === "active" || sub.status === "overdue") &&
    sub.addons.custom_domain?.status === "active",
  );
}

export async function addDomainAction(input: string): Promise<Result> {
  const context = await requireOwner();
  if (!(await hasDomainAddon(context)))
    return { ok: false, message: "Contrate o adicional Domínio próprio em Plano." };
  if (!isVercelConfigured())
    return { ok: false, message: "Domínios próprios ainda não estão configurados." };
  const domain = normalizeCustomDomain(input);
  if (!domain) return { ok: false, message: "Domínio inválido. Ex.: www.meuconsultorio.com.br" };
  if (BRANDS.some((b) => b.domains.some((d) => domain === d || domain.endsWith(`.${d}`)))) {
    return { ok: false, message: "Use um domínio seu, não o da plataforma." };
  }

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("custom_domains")
    .select("business_id")
    .eq("domain", domain)
    .maybeSingle();
  if (existing && existing.business_id !== context.business.id)
    return { ok: false, message: "Esse domínio já está em uso." };

  const { status, data } = await addProjectDomain(domain);
  if (status >= 400 && status !== 409)
    return { ok: false, message: data.error?.message ?? "A Vercel recusou o domínio." };

  const { error } = await admin
    .from("custom_domains")
    .upsert(
      { business_id: context.business.id, domain, verified: false },
      { onConflict: "business_id" },
    );
  if (error) return { ok: false, message: "Não foi possível salvar." };
  await audit({
    businessId: context.business.id,
    userId: context.user.id,
    action: "domain.added",
    details: { domain },
  });
  revalidatePath("/painel/integracoes");
  return { ok: true, message: "Domínio adicionado. Configure o DNS e clique em Verificar." };
}

export async function verifyDomainAction(): Promise<Result> {
  const context = await requireOwner();
  const admin = createAdminClient();
  const { data: row } = await admin
    .from("custom_domains")
    .select("domain")
    .eq("business_id", context.business.id)
    .maybeSingle();
  if (!row) return { ok: false, message: "Nenhum domínio cadastrado." };
  const domain = row.domain as string;
  const [verification, config] = await Promise.all([
    verifyProjectDomain(domain),
    getDomainConfig(domain),
  ]);
  const verified =
    verification.status < 400 &&
    verification.data.verified === true &&
    config.status < 400 &&
    config.data.misconfigured === false;
  await admin.from("custom_domains").update({ verified }).eq("business_id", context.business.id);
  revalidatePath("/painel/integracoes");
  return verified
    ? {
        ok: true,
        message:
          "Domínio verificado! Seu chat já abre nele com HTTPS (o certificado pode levar alguns minutos).",
      }
    : {
        ok: false,
        message:
          "Ainda não encontramos a configuração do DNS. Pode levar algumas horas para propagar.",
      };
}

export async function removeDomainAction(): Promise<Result> {
  const context = await requireOwner();
  const admin = createAdminClient();
  const { data: row } = await admin
    .from("custom_domains")
    .select("domain")
    .eq("business_id", context.business.id)
    .maybeSingle();
  if (!row) return { ok: true, message: "" };
  if (isVercelConfigured()) await removeProjectDomain(row.domain as string).catch(() => undefined);
  await admin.from("custom_domains").delete().eq("business_id", context.business.id);
  await audit({
    businessId: context.business.id,
    userId: context.user.id,
    action: "domain.removed",
    details: { domain: row.domain },
  });
  revalidatePath("/painel/integracoes");
  return { ok: true, message: "Domínio removido." };
}
