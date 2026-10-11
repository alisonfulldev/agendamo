import type { Metadata } from "next";
import Link from "next/link";

import { brandUrl } from "@/brands/urls";
import { CopyLink } from "@/components/panel/copy-link";
import { PageHeader, Section } from "@/components/panel/page-header";
import { PhotoManager } from "@/components/uploads/photo-manager";
import { requireOwner } from "@/lib/business/context";
import type { PageLink, PagePhoto, PageSettings, Service } from "@/lib/db/types";
import { getPlanFeatures } from "@/lib/plans";
import { publicUrl } from "@/lib/storage/r2";
import { createClient } from "@/lib/supabase/server";

import { CombosEditor, type ComboView } from "./combos-editor";
import { LinksEditor } from "./links-editor";
import { PageImage } from "./page-image";
import { PageInfoForm } from "./page-info-form";
import { ServicesManager } from "./services-manager";

export const metadata: Metadata = { title: "Meu perfil" };

export default async function PageEditorPage() {
  const { business, brand } = await requireOwner();
  const supabase = await createClient();
  const features = getPlanFeatures(business);

  const [settings, links, services, combos, photos] = await Promise.all([
    supabase.from("page_settings").select("*").eq("business_id", business.id).maybeSingle(),
    supabase.from("page_links").select("*").eq("business_id", business.id).order("position"),
    supabase.from("services").select("*").eq("business_id", business.id).order("position"),
    supabase
      .from("combos")
      .select("*, combo_services(service_id, position)")
      .eq("business_id", business.id)
      .order("created_at"),
    supabase.from("page_photos").select("*").eq("business_id", business.id).order("position"),
  ]);

  const page = settings.data as PageSettings | null;
  const pageUrl = brandUrl(brand, `/${business.slug}`);
  const comboViews: ComboView[] = (combos.data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    price_cents: c.price_cents,
    active: c.active,
    serviceIds: [...(c.combo_services as { service_id: string; position: number }[])]
      .sort((a, b) => a.position - b.position)
      .map((cs) => cs.service_id),
  }));

  return (
    <div className="flex flex-col gap-6 xl:flex-row">
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <PageHeader
          title="Meu perfil"
          description={
            <>
              <p className="mb-2 text-sm">
                Seu link abre direto no chat; as informações abaixo aparecem quando a cliente toca
                na sua foto.
              </p>
              <CopyLink url={pageUrl} />
            </>
          }
        />

        <Section title="Foto e capa">
          <div className="grid gap-6 sm:grid-cols-[auto_1fr]">
            <PageImage kind="avatar" label="Foto de perfil" url={publicUrl(page?.avatar_key)} />
            <PageImage kind="cover" label="Capa" url={publicUrl(page?.cover_key)} />
          </div>
        </Section>

        <Section title="Informações">
          <PageInfoForm settings={page} theme={brand.theme} />
        </Section>

        <Section title="Serviços" description="Aparecem no chat e no perfil com duração e preço.">
          <ServicesManager
            services={(services.data ?? []) as Service[]}
            depositsEnabled={features.deposits}
          />
        </Section>

        <Section
          title="Combos"
          description={
            features.packagesAndCombos ? undefined : "Disponível no plano Completo."
          }
        >
          {features.packagesAndCombos ? (
            <CombosEditor
              combos={comboViews}
              services={((services.data ?? []) as Service[]).filter((s) => s.active)}
            />
          ) : (
            <Link href="/painel/plano" className="text-sm font-medium text-primary underline">
              Ver planos
            </Link>
          )}
        </Section>

        <Section title="Links">
          <LinksEditor
            initial={((links.data ?? []) as PageLink[]).map((l) => ({
              label: l.label,
              url: l.url,
            }))}
          />
        </Section>

        <Section title="Fotos dos seus trabalhos">
          <PhotoManager
            photos={((photos.data ?? []) as PagePhoto[]).map((p) => ({
              id: p.id,
              url: publicUrl(p.object_key),
              hidden: p.hidden,
            }))}
            limit={features.photoLimit}
          />
        </Section>
      </div>

      <aside className="hidden xl:block xl:w-[340px] xl:shrink-0">
        <div className="sticky top-6">
          <p className="mb-2 text-sm font-medium text-muted-foreground">Prévia no celular</p>
          <div className="overflow-hidden rounded-[2.5rem] border-8 border-foreground bg-background shadow-lg">
            <iframe
              src={`/${business.slug}?preview=1`}
              title="Prévia do seu chat"
              className="h-[640px] w-full"
            />
          </div>
        </div>
      </aside>
    </div>
  );
}
