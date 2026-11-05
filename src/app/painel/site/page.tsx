import { CheckCircle2, Circle, Globe } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { landingColors } from "@/brands/theme";
import { businessUrl } from "@/brands/urls";
import { siteTexts } from "@/components/business-site/site-view";
import { CopyLink } from "@/components/panel/copy-link";
import { PageHeader } from "@/components/panel/page-header";
import { Button } from "@/components/ui/button";
import { requireOwner } from "@/lib/business/context";
import { getPlanFeatures, SITE_PLAN_NAME, SITE_PRICE_TEXT } from "@/lib/plans";
import { PROFILE_INDEX_RULES } from "@/lib/public/indexable";
import { getPublicPage } from "@/lib/public/page";
import { getLiveDomain, getSiteSettings, resolveSections, SITE_SECTIONS } from "@/lib/public/site";
import { SITE_QR_PNG_DOWNLOAD_URL } from "@/lib/qr";
import { publicUrl } from "@/lib/storage/r2";

import { SiteEditor } from "./site-editor";

export const metadata: Metadata = { title: "Meu site" };

/** "Meu site" (Site + Agenda, 2026-11-05): the owner edits her site at /<slug>/site. */
export default async function SiteEditorPage() {
  const { business, brand } = await requireOwner();
  const features = getPlanFeatures(business);

  if (!features.site) {
    return (
      <div className="flex max-w-2xl flex-col gap-6">
        <PageHeader title="Meu site" />
        <div className="flex flex-col items-start gap-3 rounded-xl border bg-card p-6">
          <Globe className="size-8 text-primary" aria-hidden />
          <h2 className="text-lg font-semibold">Tenha um site pronto para o Google</h2>
          <p className="text-muted-foreground">
            No plano {SITE_PLAN_NAME} ({SITE_PRICE_TEXT.monthly}), seu negócio ganha um site
            completo nas suas cores, com serviços, fotos, avaliações e endereço. Todo botão
            “Agendar” abre o seu chat. Você muda cores, foto e textos quando quiser.
          </p>
          <Button asChild>
            <Link href="/painel/plano#assinar">Quero meu site</Link>
          </Button>
        </div>
      </div>
    );
  }

  const [data, settings] = await Promise.all([
    getPublicPage(brand.key, business.slug),
    getSiteSettings(business.slug, business.id),
  ]);
  // The own domain once live (sold with the plan), else the MeetChat address.
  const liveDomain = await getLiveDomain(business.slug, business.id);
  const siteUrl = liveDomain
    ? `https://${liveDomain}/`
    : businessUrl(brand, `/${business.slug}/site`);
  const pageColor = data?.page?.primary_color_override ?? null;
  const primary = settings?.primary_color ?? pageColor ?? brand.theme.primary;
  const defaults = data
    ? siteTexts(data, brand, null)
    : { title: business.name, subtitle: "", cta: "Agendar horário" };
  const labels = new Map<string, string>(SITE_SECTIONS.map((s) => [s.key, s.label]));

  // What the site needs to show up on Google (same rules as the profile, rule 12).
  const page = data?.page;
  const priced = data?.services.filter((s) => s.price_cents > 0).length ?? 0;
  const checklist = [
    { done: Boolean(page?.avatar_key), label: "Foto do perfil" },
    {
      done: (page?.bio?.length ?? 0) >= PROFILE_INDEX_RULES.minBioLength,
      label: "Descrição do negócio (“Sobre”)",
    },
    { done: Boolean(page?.city), label: "Cidade e endereço" },
    {
      done: priced >= PROFILE_INDEX_RULES.minPricedServices,
      label: `Pelo menos ${PROFILE_INDEX_RULES.minPricedServices} serviços com preço (tem ${priced})`,
    },
  ];
  const ready = checklist.every((item) => item.done) && !business.portal_opt_out;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Meu site"
        description={
          <>
            <p className="mb-2 text-sm">
              Seu site é montado sozinho com as informações do seu perfil (fotos, serviços,
              avaliações e endereço). Aqui você muda cores, a foto do topo, os textos e as seções.
            </p>
            <CopyLink url={siteUrl} qrHref={SITE_QR_PNG_DOWNLOAD_URL} tour={false} />
          </>
        }
      />

      <section
        aria-labelledby="google"
        className={`rounded-xl border p-5 ${ready ? "bg-card" : "border-primary/40 bg-card"}`}
      >
        <h2 id="google" className="font-semibold">
          {ready ? "Seu site está pronto para o Google" : "Para aparecer no Google"}
        </h2>
        <p className="mb-3 text-sm text-muted-foreground">
          {ready
            ? "O Google já pode encontrar seu site. Quanto mais fotos e avaliações, melhor."
            : "O site já funciona, mas o Google só mostra sites completos. Falta pouco:"}
        </p>
        <ul className="flex flex-col gap-1.5 text-sm">
          {checklist.map((item) => (
            <li key={item.label} className="flex items-center gap-2">
              {item.done ? (
                <CheckCircle2 className="size-4 shrink-0 text-primary" aria-hidden />
              ) : (
                <Circle className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              )}
              <span className={item.done ? "text-muted-foreground" : ""}>{item.label}</span>
              <span className="sr-only">{item.done ? "(feito)" : "(falta)"}</span>
            </li>
          ))}
          {business.portal_opt_out ? (
            <li className="flex items-center gap-2">
              <Circle className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              Você marcou “Não aparecer nas buscas” em Meu perfil.
            </li>
          ) : null}
        </ul>
        {ready ? null : (
          <Button asChild variant="outline" size="sm" className="mt-3">
            <Link href="/painel/pagina">Completar em Meu perfil</Link>
          </Button>
        )}
      </section>

      <SiteEditor
        initial={{
          template: settings?.template ?? "vibrant",
          primary_color: settings?.primary_color ?? null,
          accent_color: settings?.accent_color ?? null,
          hero_title: settings?.hero_title ?? "",
          hero_subtitle: settings?.hero_subtitle ?? "",
          cta_label: settings?.cta_label ?? "",
          sections: resolveSections(settings?.sections ?? null).map((s) => ({
            ...s,
            label: labels.get(s.key) ?? s.key,
          })),
        }}
        defaults={{
          primary: pageColor ?? brand.theme.primary,
          accent: landingColors({ ...brand.theme, primary }).highlight,
          title: defaults.title,
          subtitle: defaults.subtitle,
          cta: defaults.cta,
        }}
        heroUrl={publicUrl(settings?.hero_image_key)}
        previewPath={`/${business.slug}/site`}
      />
    </div>
  );
}
