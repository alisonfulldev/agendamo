import { CalendarCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { brandUrl } from "@/brands/urls";

import { BackToChatButton } from "../chat-home";
import { businessJsonLd, businessMetadata, loadBusinessPage, themeOverride } from "../load";
import { PageTracker } from "../page-tracker";
import { ProfileView } from "../profile-view";

export async function generateMetadata({ params }: PageProps<"/[slug]/perfil">): Promise<Metadata> {
  const { slug } = await params;
  return businessMetadata(await loadBusinessPage(slug));
}

/** Standalone profile (portal, Google): the same info shown when the photo is tapped in the chat. */
export default async function BusinessProfilePage({ params }: PageProps<"/[slug]/perfil">) {
  const { slug } = await params;
  const loaded = await loadBusinessPage(slug);
  if (!loaded) notFound();
  const { data, brand, domainBrand } = loaded;
  if (brand.key !== domainBrand.key) redirect(brandUrl(brand, `/${data.business.slug}/perfil`));

  const label = "Agendar";
  const override = themeOverride(loaded);

  return (
    <div
      data-theme-scope={override ? "" : undefined}
      style={override}
      className="flex min-h-[100dvh] justify-center bg-muted"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(businessJsonLd(data)).replace(/</g, "\u003c"),
        }}
      />
      <PageTracker businessId={data.business.id} />
      <main className="w-full max-w-xl pb-24">
        <ProfileView
          loaded={loaded}
          chatAction={<BackToChatButton slug={data.business.slug} label={label} />}
        />
      </main>
      <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-xl bg-gradient-to-t from-muted via-muted to-transparent px-4 pt-6 pb-4">
        <Link
          href={`/${data.business.slug}`}
          className="flex h-14 items-center justify-center gap-2 rounded-xl bg-button text-lg font-medium text-button-foreground shadow-lg hover:opacity-90"
        >
          <CalendarCheck className="size-5" aria-hidden /> {label}
        </Link>
      </div>
    </div>
  );
}
