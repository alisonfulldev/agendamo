import { PLATFORM } from "@/brands";
import { WebHubLanding } from "@/components/landing/web-landing";
import { WEB_HUB_FAQ, WEB_HUBS, WEB_PAGES } from "@/content/web-landing-pages";
import { pageMetadata } from "@/lib/seo/metadata";

const hub = WEB_HUBS.store;

export const metadata = pageMetadata({
  title: hub.title,
  description: hub.description,
  path: hub.path,
  socialTitle: hub.h1,
});

/** Hub of the "Site ou Loja" pages (loja-virtual, 2026-11-08): one card per kind of business. */
export default function WebHubPage() {
  return (
    <WebHubLanding
      kind="store"
      brand={PLATFORM}
      pages={WEB_PAGES.filter((p) => p.kind === "store")}
      faq={WEB_HUB_FAQ.store}
    />
  );
}
