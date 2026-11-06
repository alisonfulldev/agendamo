import type { Metadata } from "next";

import { landingColors } from "@/brands/theme";
import { PageHeader, Section } from "@/components/panel/page-header";
import { PhotoManager } from "@/components/uploads/photo-manager";
import { requireOwner } from "@/lib/business/context";
import {
  WEB_SITE_TEMPLATES,
  WEB_STORE_TEMPLATES,
  type PagePhoto,
  type PageSettings,
  type SiteSettings,
  type WebTemplate,
} from "@/lib/db/types";
import { getPlanFeatures } from "@/lib/plans";
import { publicUrl } from "@/lib/storage/r2";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatBrPhone } from "@/lib/phone";
import { webDefaults } from "@/lib/web/texts";

import { PageImage } from "../../pagina/page-image";
import { WebSiteEditor } from "./web-site-editor";

export const metadata: Metadata = { title: "Meu site" };

/** "Meu site" of a "Site ou Loja" account: the editor, the logo and the photos. */
export default async function WebSitePage() {
  const { business, brand } = await requireOwner({ web: true });
  const store = business.product === "store";
  const admin = createAdminClient();
  const [settingsResult, pageResult, photosResult] = await Promise.all([
    admin.from("site_settings").select("*").eq("business_id", business.id).maybeSingle(),
    admin.from("page_settings").select("*").eq("business_id", business.id).maybeSingle(),
    admin.from("page_photos").select("*").eq("business_id", business.id).order("position"),
  ]);
  const settings = settingsResult.data as SiteSettings | null;
  const page = pageResult.data as PageSettings | null;
  const templates: WebTemplate[] = [...(store ? WEB_STORE_TEMPLATES : WEB_SITE_TEMPLATES)];
  const template = templates.includes(settings?.template as WebTemplate)
    ? (settings!.template as WebTemplate)
    : templates[0]!;
  const defaults = webDefaults({
    name: business.name,
    bio: page?.bio ?? null,
    city: page?.city ?? null,
    store,
  });
  const primary = settings?.primary_color ?? brand.theme.primary;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Meu site" description="Tudo o que você muda aqui vai para o ar na hora." />
      <WebSiteEditor
        templates={templates}
        initial={{
          template,
          primary_color: settings?.primary_color ?? null,
          accent_color: settings?.accent_color ?? null,
          hero_title: settings?.hero_title ?? "",
          hero_subtitle: settings?.hero_subtitle ?? "",
          cta_label: settings?.cta_label ?? "",
          whatsapp_message: settings?.whatsapp_message ?? "",
        }}
        info={{
          name: business.name,
          bio: page?.bio ?? "",
          whatsapp: formatBrPhone(page?.whatsapp_number),
          instagram:
            page?.instagram_url?.replace(/^https?:\/\/(www\.)?instagram\.com\//, "@") ?? "",
          address: page?.address ?? "",
          city: page?.city ?? "",
        }}
        defaults={{
          primary: brand.theme.primary,
          accent: landingColors({ ...brand.theme, primary }).highlight,
          title: defaults.title,
          subtitle: defaults.subtitle,
          cta: defaults.cta,
          message: defaults.message,
        }}
        heroUrl={publicUrl(settings?.hero_image_key)}
        previewPath={`/${business.slug}`}
      />

      <Section title="Logo" description="Aparece no topo do site. Quadrada fica melhor.">
        <PageImage kind="avatar" label="Logo" url={publicUrl(page?.avatar_key)} />
      </Section>

      <Section
        title="Fotos"
        description={`Galeria do site: seu trabalho, seu espaço${store ? ", sua loja" : ""}.`}
      >
        <PhotoManager
          photos={((photosResult.data ?? []) as PagePhoto[]).map((p) => ({
            id: p.id,
            url: publicUrl(p.object_key),
            hidden: p.hidden,
          }))}
          limit={getPlanFeatures(business).photoLimit}
        />
      </Section>
    </div>
  );
}
