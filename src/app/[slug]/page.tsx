import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { PLATFORM } from "@/brands";
import { MeetChatBadge } from "@/components/chat/meetchat-badge";

import { brandUrl } from "@/brands/urls";
import { publicUrl } from "@/lib/storage/r2";

import { BackToChatButton, ChatHome } from "./chat-home";
import { businessJsonLd, businessMetadata, loadBusinessPage, themeOverride } from "./load";
import { PageTracker } from "./page-tracker";
import { ProfileView } from "./profile-view";

export async function generateMetadata({ params }: PageProps<"/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  return businessMetadata(await loadBusinessPage(slug));
}

/**
 * The business link (Instagram bio, buttons on the owner's own site): opens straight into the
 * conversation. The profile opens over it when the photo is tapped (?perfil=1 opens it directly).
 */
export default async function BusinessChatPage({ params, searchParams }: PageProps<"/[slug]">) {
  const { slug } = await params;
  const query = await searchParams;
  const loaded = await loadBusinessPage(slug);
  if (!loaded) notFound();
  const { data, brand, domainBrand, automaticBooking } = loaded;

  // A business always shows on its own brand's domain.
  if (brand.key !== domainBrand.key) redirect(brandUrl(brand, `/${data.business.slug}`));

  const { business, page } = data;
  // Waiting mode (no trial, no subscription): the chat collects the request for WhatsApp.
  const mode = automaticBooking ? "chat" : "handoff";
  const override = themeOverride(loaded);
  const param = (name: string) =>
    typeof query[name] === "string" ? (query[name] as string) : null;
  // Links from waitlist e-mails: ?agendar=1&servico=<id>&data=<YYYY-MM-DD>.
  const initialServiceId = param("agendar") === "1" ? param("servico") : null;
  const initialDate = param("agendar") === "1" ? param("data") : null;

  return (
    <div data-theme-scope={override ? "" : undefined} style={override}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(businessJsonLd(data)).replace(/</g, "\\u003c"),
        }}
      />
      {param("preview") ? null : <PageTracker businessId={business.id} noticePosition="top" />}
      <ChatHome
        mode={mode}
        slug={business.slug}
        businessId={business.id}
        businessName={business.name}
        avatarUrl={publicUrl(page?.avatar_key)}
        services={data.services.map((s) => ({ id: s.id, name: s.name }))}
        whatsapp={page?.whatsapp_number ?? null}
        initialServiceId={initialServiceId}
        initialDate={initialDate}
        openProfile={param("perfil") === "1"}
        branding={
          // Only in waiting mode (trial and subscription have no brand footer).
          loaded.features.removeBranding ? null : (
            <MeetChatBadge href={brandUrl(brand, "/")} logo={PLATFORM.logo} />
          )
        }
        profile={
          <ProfileView
            loaded={loaded}
            chatAction={<BackToChatButton slug={business.slug} label="Agendar" />}
          />
        }
      />
    </div>
  );
}
