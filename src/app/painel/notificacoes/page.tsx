import type { Metadata } from "next";

import { EnablePush } from "@/components/panel/enable-push";
import { PageHeader, Section } from "@/components/panel/page-header";
import { requireUser } from "@/lib/auth/session";
import { requireBusiness } from "@/lib/business/context";
import { OWNER_NOTIFICATION_TYPES } from "@/lib/notifications/owner";
import { createClient } from "@/lib/supabase/server";

import { PreferencesForm } from "./preferences-form";

export const metadata: Metadata = { title: "Notificações" };

/** Staff only get notices about their own professional, so business-wide ones are hidden for them. */
const STAFF_TYPES = new Set(["appointment_new", "appointment_changed", "deposit_informed"]);

export default async function NotificationsPage() {
  const user = await requireUser();
  const { isOwner } = await requireBusiness();
  const supabase = await createClient();
  const { data } = await supabase
    .from("notification_preferences")
    .select("type, email, push")
    .eq("user_id", user.id);
  const saved = new Map((data ?? []).map((p) => [p.type as string, p]));

  const initial = Object.entries(OWNER_NOTIFICATION_TYPES)
    .filter(([type]) => isOwner || STAFF_TYPES.has(type))
    .map(([type, label]) => ({
      type,
      label,
      email: (saved.get(type)?.email as boolean | undefined) ?? true,
      push: (saved.get(type)?.push as boolean | undefined) ?? true,
    }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Notificações"
        description="Avisos chegam só por e-mail e no celular (notificação do navegador)."
      />
      <Section
        title="Notificações no celular"
        description="Ative em cada aparelho onde você usa o painel."
      >
        <EnablePush vapidPublicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || null} />
      </Section>
      <Section title="O que você quer receber">
        <PreferencesForm initial={initial} />
      </Section>
    </div>
  );
}
