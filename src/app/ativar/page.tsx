import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { NICHES, PLATFORM } from "@/brands";
import { brandThemeStyle } from "@/brands/theme";
import { businessUrl } from "@/brands/urls";
import { LazyCreationChat } from "@/components/creation/lazy-creation-chat";
import { OpenCreationLink } from "@/components/creation/open-creation";
import { ACTIVATION } from "@/content/activation";
import { getSessionUser } from "@/lib/auth/session";
import { getBusinessContext } from "@/lib/business/context";
import { getPlanFeatures, subscriptionPrice } from "@/lib/plans";
import { isStorageConfigured } from "@/lib/storage/r2";
import { createAdminClient } from "@/lib/supabase/admin";

import { ActivationFlow, MeetPanel, PaidTracker } from "./flow";
import { Tutorial } from "./tutorial";

export const metadata: Metadata = {
  title: ACTIVATION.meta.title,
  description: ACTIVATION.meta.description,
  // Only for whoever clicks the Meta ad: out of search engines and of the site's menus.
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

const T = ACTIVATION;

/**
 * Meta ad page (2026-11-17): booking only, no 14-day trial. An animated tutorial in the colors
 * and services of the ad's niche (?area=<niche route>) shows a customer booking and then the
 * panel step by step; "Quero o meu" opens the creation conversation, and the new account goes
 * straight to the Pix. Without paying, the link stays in waiting mode (requests go to her
 * WhatsApp). The Meta pixel runs here (site-paths.ts): PageView, ViewContent (tutorial watched),
 * CompleteRegistration, InitiateCheckout and Purchase.
 */
export default async function ActivatePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  // ?ramo= opens the conversation over the page at once: on this page the ad's niche comes as
  // ?area= so the tutorial shows first (older ad links with ?ramo= are moved to ?area=).
  if (typeof params.ramo === "string" && params.criar === undefined) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === "string") query.set(key === "ramo" ? "area" : key, value);
    }
    redirect(`/ativar?${query.toString()}`);
  }

  const user = await getSessionUser();
  const context = user ? await getBusinessContext() : null;

  if (!context) {
    const area = typeof params.area === "string" ? params.area : null;
    const niche = NICHES.find((b) => b.niche!.route === area) ?? null;
    return (
      <Shell>
        {/* No ?area= (the general ad): the neutral "general" look, not one niche's colors. */}
        <Landing nicheKey={niche?.key ?? "general"} nicheRoute={niche?.niche!.route} />
        <LazyCreationChat photos={isStorageConfigured()} activation />
      </Shell>
    );
  }

  // Accounts from the normal sign-up (and staff) have nothing to do here.
  const { business, brand } = context;
  if (!business.activation_demo || !context.isOwner) redirect("/painel");
  const features = getPlanFeatures(business);
  const pageUrl = businessUrl(brand, `/${business.slug}`);

  if (features.subscribed) {
    const { data: subscription } = await createAdminClient()
      .from("subscriptions")
      .select("value_cents, billing_cycle, tier")
      .eq("business_id", business.id)
      .maybeSingle();
    const valueCents =
      (subscription?.value_cents as number | null) ??
      subscriptionPrice(
        (subscription?.billing_cycle as "monthly" | "yearly" | undefined) ?? "monthly",
        0,
        0,
        (subscription?.tier as "complete" | "site" | undefined) ?? "complete",
      );
    return (
      <Shell>
        <PaidTracker businessId={business.id} valueCents={valueCents} />
        <Done pageUrl={pageUrl} />
      </Shell>
    );
  }

  return (
    <Shell>
      {features.trialActive ? (
        // The panel is open: the mandatory tutorial there ends on the payment.
        <MeetPanel businessId={business.id} pageUrl={pageUrl} />
      ) : (
        <ActivationFlow
          businessId={business.id}
          pageUrl={pageUrl}
          initialTier={params.plano === "site" ? "site" : "complete"}
        />
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-theme-scope=""
      data-palette="meetchat"
      style={brandThemeStyle(PLATFORM)}
      className="flex min-h-[100dvh] flex-col bg-background font-sans text-foreground"
    >
      <header className="mx-auto flex w-full max-w-xl items-center gap-2 px-4 py-4">
        {/* eslint-disable-next-line @next/next/no-img-element -- small static SVG logo */}
        <img src={PLATFORM.logo} alt="" width={32} height={32} className="size-8 rounded-lg" />
        <span className="text-lg font-semibold">{PLATFORM.name}</span>
      </header>
      <main className="mx-auto w-full max-w-xl flex-1 px-4 pt-2 pb-16">{children}</main>
    </div>
  );
}

function Landing({ nicheKey, nicheRoute }: { nicheKey: string; nicheRoute?: string }) {
  return (
    <section className="flex flex-col gap-6 pb-28">
      <div className="text-center">
        <p className="text-sm font-semibold tracking-wide text-primary uppercase">
          {T.landing.eyebrow}
        </p>
        <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          {T.landing.title}
        </h1>
        <p className="mt-2 text-lg text-pretty text-muted-foreground">{T.landing.intro}</p>
      </div>
      <Tutorial nicheKey={nicheKey} />
      <p className="text-center text-muted-foreground">{T.landing.noApp}</p>
      <Link href="/entrar" className="self-center text-sm font-medium underline underline-offset-2">
        {T.landing.login}
      </Link>
      {/* Always in view (2026-11-25): fixed at the bottom, below the creation chat (z-50). */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 px-4 pt-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur">
        <div className="mx-auto flex w-full max-w-xl flex-col gap-1.5">
          <OpenCreationLink
            niche={nicheRoute}
            className="cta-pulse flex h-16 items-center justify-center gap-2 rounded-2xl bg-primary text-xl font-bold text-primary-foreground shadow-xl"
          >
            {T.landing.cta}
            <ArrowRight className="size-6" aria-hidden />
          </OpenCreationLink>
          <p className="text-center text-xs text-muted-foreground">{T.landing.ctaHint}</p>
        </div>
      </div>
    </section>
  );
}

function Done({ pageUrl }: { pageUrl: string }) {
  return (
    <section className="flex flex-col gap-5 text-center">
      <h1 className="font-heading text-3xl font-bold tracking-tight text-balance">
        {T.done.title}
      </h1>
      <p className="text-lg text-muted-foreground">{T.done.intro}</p>
      <p className="rounded-xl bg-muted px-4 py-3 font-medium break-all">
        {pageUrl.replace(/^https?:\/\//, "")}
      </p>
      <p className="text-muted-foreground">{T.done.share}</p>
      {/* Full load: the panel layout renders from scratch with the paid plan. */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a
        href="/painel"
        className="flex h-14 items-center justify-center rounded-xl bg-primary text-lg font-semibold text-primary-foreground shadow-lg"
      >
        {T.done.panel}
      </a>
    </section>
  );
}
