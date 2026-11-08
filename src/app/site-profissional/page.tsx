import { PLATFORM } from "@/brands";
import { WebHubLanding } from "@/components/landing/web-landing";
import { WEB_HUB_FAQ, WEB_HUBS, WEB_PAGES } from "@/content/web-landing-pages";
import { pageMetadata } from "@/lib/seo/metadata";

const hub = WEB_HUBS.site;

export const metadata = pageMetadata({
  title: hub.title,
  description: hub.description,
  path: hub.path,
  socialTitle: hub.h1,
});

/** Hub of the "Site ou Loja" pages (site-profissional, 2026-11-08): one card per kind of business. */
export default function WebHubPage() {
  return (
    <WebHubLanding
      kind="site"
      brand={PLATFORM}
      pages={WEB_PAGES.filter((p) => p.kind === "site")}
      faq={WEB_HUB_FAQ.site}
    />
  );
}
