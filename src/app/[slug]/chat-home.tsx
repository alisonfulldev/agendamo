"use client";

import { ArrowLeft, CalendarCheck } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

import { HandoffChat } from "./handoff-chat";

// The booking chat (Pro / Team) is a bigger bundle: loaded on demand.
const BookingChat = dynamic(() => import("./booking-chat").then((m) => m.BookingChat), {
  ssr: false,
  loading: () => <p className="p-6 text-center text-muted-foreground">Abrindo conversa…</p>,
});

const ProfileContext = createContext<{ close: () => void } | null>(null);

/**
 * The quick action in the profile: closes the profile when it is open over the chat, or links to
 * the chat from the standalone profile page.
 */
export function BackToChatButton({ slug, label }: { slug: string; label: string }) {
  const context = useContext(ProfileContext);
  const className =
    "flex flex-1 flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-xs font-medium text-primary hover:bg-muted";
  const content = (
    <>
      <CalendarCheck className="size-5" aria-hidden /> {label}
    </>
  );
  return context ? (
    <button type="button" onClick={context.close} className={className}>
      {content}
    </button>
  ) : (
    <Link href={`/${slug}`} className={className}>
      {content}
    </Link>
  );
}

/**
 * /<slug>: the business link opens straight into the conversation (booking chat, or the
 * WhatsApp hand-off when there is no active subscription). Tapping the photo or name opens the profile, like a messaging app.
 */
export function ChatHome({
  mode,
  slug,
  businessId,
  businessName,
  avatarUrl,
  services,
  whatsapp,
  initialServiceId,
  initialDate,
  openProfile,
  branding,
  profile,
}: {
  /** "handoff": no active subscription, the chat ends on the owner's WhatsApp. */
  mode: "chat" | "handoff";
  slug: string;
  businessId: string;
  businessName: string;
  avatarUrl: string | null;
  services: { id: string; name: string }[];
  whatsapp: string | null;
  initialServiceId: string | null;
  initialDate: string | null;
  openProfile: boolean;
  branding: ReactNode;
  profile: ReactNode;
}) {
  const [profileOpen, setProfileOpen] = useState(openProfile);
  const close = () => setProfileOpen(false);

  // Escape closes the profile, like the back gesture.
  useEffect(() => {
    if (!profileOpen) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setProfileOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [profileOpen]);

  const chat =
    mode === "chat" ? (
      <BookingChat
        slug={slug}
        businessId={businessId}
        businessName={businessName}
        avatarUrl={avatarUrl}
        onProfile={() => setProfileOpen(true)}
        branding={branding}
        initialServiceId={initialServiceId}
        initialDate={initialDate}
      />
    ) : (
      <HandoffChat
        businessId={businessId}
        businessName={businessName}
        avatarUrl={avatarUrl}
        services={services}
        whatsapp={whatsapp}
        onProfile={() => setProfileOpen(true)}
        branding={branding}
      />
    );

  return (
    <div className="flex h-[100dvh] justify-center bg-muted">
      <div className="relative flex h-full w-full max-w-xl flex-col overflow-hidden bg-background shadow-sm">
        <div className="flex min-h-0 flex-1 flex-col" aria-hidden={profileOpen || undefined}>
          {chat}
        </div>

        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Perfil de ${businessName}`}
          className={cn(
            "absolute inset-0 z-10 flex flex-col bg-muted transition-transform duration-200 ease-out motion-reduce:transition-none",
            profileOpen ? "translate-x-0" : "pointer-events-none translate-x-full",
          )}
          inert={!profileOpen}
        >
          <header className="flex shrink-0 items-center gap-3 bg-primary px-2 py-2.5 text-primary-foreground">
            <button
              type="button"
              onClick={close}
              aria-label="Voltar à conversa"
              className="flex size-10 items-center justify-center rounded-full hover:bg-primary-foreground/15"
            >
              <ArrowLeft className="size-5" />
            </button>
            <p className="text-base font-semibold">Dados do perfil</p>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <ProfileContext.Provider value={{ close }}>{profile}</ProfileContext.Provider>
          </div>
        </div>
      </div>
    </div>
  );
}
