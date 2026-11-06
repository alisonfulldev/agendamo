import "server-only";

import { getNiche, PLATFORM } from "@/brands";
import { brandUrl } from "@/brands/urls";
import { TERMS } from "@/content/legal";
import { formatBRL } from "@/lib/money";
import { sendEmail } from "@/lib/email/send";
import { getServerEnv } from "@/lib/env";
import { TIER_NAME, type Tier } from "@/lib/plans";
import { siteUrl } from "@/lib/site-url";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * First payment of a WhatsApp sale (called when a plan payment is applied): marks the sale paid,
 * records the terms accepted with the payment (the payment page and the Pix message say so),
 * sends the customer the access e-mail and tells the admins. Idempotent: only an unpaid sale
 * changes, so later payments do nothing.
 */
export async function completeAssistedSale(businessId: string): Promise<void> {
  const admin = createAdminClient();
  const { data: rows } = await admin
    .from("assisted_sales")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("business_id", businessId)
    .eq("status", "awaiting_payment")
    .select(
      "payer_name, payer_email, tier, value_cents, domain, business:businesses(name, slug, brand_key)",
    );
  const sale = rows?.[0] as
    | {
        payer_name: string;
        payer_email: string;
        tier: Tier;
        value_cents: number;
        domain: string | null;
        business: { name: string; slug: string; brand_key: string };
      }
    | undefined;
  if (!sale) return;

  const brand = getNiche(sale.business.brand_key);
  const firstName = sale.payer_name.split(" ")[0];
  const chat = brandUrl(brand, `/${sale.business.slug}`);
  // "Site ou Loja": the business link is the site itself (no booking link).
  const web = sale.tier === "web";
  const site = web
    ? chat
    : sale.tier === "site"
      ? brandUrl(brand, `/${sale.business.slug}/site`)
      : null;

  const { data: owner } = await admin
    .from("members")
    .select("user_id")
    .eq("business_id", businessId)
    .eq("role", "owner")
    .maybeSingle();
  if (owner) {
    await admin.auth.admin.updateUserById(owner.user_id as string, {
      user_metadata: {
        terms_version: TERMS.version,
        terms_accepted_at: new Date().toISOString(),
        terms_accepted_via: "payment",
      },
    });
  }

  await sendEmail({
    brand,
    to: sale.payer_email,
    subject: `Sua conta está pronta, ${firstName}!`,
    content: {
      preheader: web
        ? "Pagamento confirmado. Seu site já está no ar."
        : "Pagamento confirmado. Seu link de agendamento já está no ar.",
      heading: "Pagamento confirmado 🎉",
      paragraphs: [
        `Oi, ${firstName}! A conta de ${sale.business.name} está pronta e já está no ar.`,
        web
          ? "Entre no painel com este e-mail: você recebe um código para entrar, sem senha. Lá você coloca seu logo, fotos, textos e o que você vende."
          : "Entre no painel com este e-mail: você recebe um código para entrar, sem senha. Lá você coloca sua foto, ajusta serviços, preços e horários.",
        ...(sale.domain
          ? [
              `Seu endereço próprio, ${sale.domain}, está sendo registrado no seu nome. Avisamos por e-mail assim que o site estiver no ar nele.`,
            ]
          : []),
      ],
      details: [
        ...(web ? [] : [{ label: "Seu link de agendamento", value: chat }]),
        ...(site ? [{ label: "Seu site", value: site }] : []),
        { label: "Plano", value: TIER_NAME[sale.tier] },
      ],
      cta: { label: "Entrar no meu painel", url: brandUrl(brand, "/entrar") },
      footnote:
        "A mensalidade seguinte é debitada sozinha pelo Pix Automático que você autorizou no pagamento.",
    },
  }).catch((error) => console.error("sale access e-mail failed", error));

  const admins = getServerEnv().ADMIN_EMAILS;
  if (admins.length) {
    await sendEmail({
      brand: PLATFORM,
      to: admins,
      subject: `Venda paga: ${sale.business.name} (${formatBRL(sale.value_cents)})`,
      content: {
        heading: "Venda paga 💰",
        paragraphs: [
          `${sale.payer_name} pagou. A conta de ${sale.business.name} foi liberada.`,
          ...(sale.domain
            ? [
                `Falta registrar o domínio ${sale.domain} no Registro.br, no nome do cliente: veja em Admin › Vendas › Domínios.`,
              ]
            : []),
        ],
        details: [
          { label: "Plano", value: TIER_NAME[sale.tier] },
          { label: "Valor", value: formatBRL(sale.value_cents) },
          { label: "Link", value: site ?? chat },
        ],
        cta: { label: "Abrir vendas", url: siteUrl("/admin/vendas") },
      },
    }).catch((error) => console.error("sale admin e-mail failed", error));
  }
}
