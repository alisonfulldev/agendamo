import { getNiche, PLATFORM } from "@/brands";
import { SiteAgendaHubLanding } from "@/components/landing/site-agenda-landing";
import { SITE_AGENDA_INDEX, SITE_AGENDA_PAGES } from "@/content/site-agenda-pages";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata = pageMetadata({
  title: SITE_AGENDA_INDEX.title,
  description: SITE_AGENDA_INDEX.description,
  path: "/site-e-agenda",
  socialTitle: SITE_AGENDA_INDEX.h1,
});

/** Hub of the "Site + agenda online" pages (2026-11-06): one card per area. */
export default function SiteAgendaHub() {
  return (
    <SiteAgendaHubLanding
      brand={PLATFORM}
      h1={SITE_AGENDA_INDEX.h1}
      intro={SITE_AGENDA_INDEX.intro}
      pages={SITE_AGENDA_PAGES.map((p) => ({ ...p, brand: getNiche(p.nicheKey) }))}
    />
  );
}
