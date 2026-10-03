import Link from "next/link";

import { Section } from "@/components/panel/page-header";
import { Button } from "@/components/ui/button";
import { requireOwner } from "@/lib/business/context";
import type { Subscription } from "@/lib/db/types";
import { getDomainConfig, isVercelConfigured } from "@/lib/domains/vercel";
import { createAdminClient } from "@/lib/supabase/admin";

import { DomainForm } from "./domain-form";

/** Custom domain add-on (Prompt 38): DNS instructions, verification through the Vercel API. */
export async function CustomDomainSection() {
  const { business } = await requireOwner();
  const admin = createAdminClient();
  const [{ data: sub }, { data: domain }] = await Promise.all([
    admin
      .from("subscriptions")
      .select("addons, status")
      .eq("business_id", business.id)
      .maybeSingle(),
    admin
      .from("custom_domains")
      .select("domain, verified")
      .eq("business_id", business.id)
      .maybeSingle(),
  ]);
  const active =
    (sub as Pick<Subscription, "addons"> | null)?.addons.custom_domain?.status === "active";
  const host = (domain?.domain as string | undefined) ?? null;
  const isApex = host
    ? host.split(".").length === 2 ||
      (/\.(com|net|org)\.br$/.test(host) && host.split(".").length === 3)
    : false;
  // Prefer the DNS values Vercel recommends for this domain; fall back to its documented defaults.
  let ipv4 = "76.76.21.21";
  let cname = "cname.vercel-dns.com";
  if (host && !domain?.verified && isVercelConfigured()) {
    const config = await getDomainConfig(host).catch(() => null);
    const ip = config?.data.recommendedIPv4?.find((r) => r.rank === 1)?.value?.[0];
    const target = config?.data.recommendedCNAME?.find((r) => r.rank === 1)?.value;
    if (ip) ipv4 = ip;
    if (target) cname = target.replace(/\.$/, "");
  }

  return (
    <Section
      title="Domínio próprio"
      description="Seu chat e seu perfil no seu endereço (ex.: www.meusalao.com.br), com HTTPS automático."
    >
      {!active && !host ? (
        <div className="flex flex-col gap-2 text-sm">
          <p className="text-muted-foreground">Disponível como adicional da assinatura.</p>
          <Button asChild size="sm" className="self-start">
            <Link href="/painel/plano">Contratar Domínio próprio</Link>
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4 text-sm">
          <DomainForm domain={host} verified={Boolean(domain?.verified)} />
          {host && !domain?.verified ? (
            <div className="rounded-lg border p-3">
              <p className="font-medium">
                Configure no painel do seu domínio (Registro.br, GoDaddy, Hostinger…):
              </p>
              {isApex ? (
                <p className="mt-2">
                  Registro <strong>A</strong> para <code>{host}</code> apontando para{" "}
                  <code>{ipv4}</code>.
                </p>
              ) : (
                <p className="mt-2">
                  Registro <strong>CNAME</strong> para <code>{host.split(".")[0]}</code> apontando
                  para <code>{cname}</code>.
                </p>
              )}
              <p className="mt-2 text-muted-foreground">
                Depois clique em Verificar. A propagação do DNS pode levar algumas horas.
              </p>
            </div>
          ) : null}
        </div>
      )}
    </Section>
  );
}
