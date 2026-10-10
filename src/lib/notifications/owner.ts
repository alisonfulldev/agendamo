import "server-only";

import { getNiche } from "@/brands";
import { brandUrl } from "@/brands/urls";
import type { EmailContent } from "@/lib/email/layout";
import { sendEmail } from "@/lib/email/send";
import { sendPushToUser, type PushPayload } from "@/lib/push/send";
import { createAdminClient } from "@/lib/supabase/admin";

/** Notification kinds the owner/staff can turn on or off per channel. */
export const OWNER_NOTIFICATION_TYPES = {
  booking_request: "Novo pedido de horário",
  appointment_new: "Novo agendamento",
  appointment_changed: "Cancelamentos e remarcações",
  deposit_informed: "Comprovantes de sinal para conferir",
  daily_alert: "Pessoas que quiseram agendar fora do horário",
  weekly_summary: "Resumo semanal",
  empty_slots: "Horários vagos amanhã",
  account: "Plano, teste e cobrança",
} as const;

export type OwnerNotificationType = keyof typeof OWNER_NOTIFICATION_TYPES;

interface Recipient {
  userId: string;
  email: string;
  role: "owner" | "staff";
}

/**
 * Owners always; staff only when the notification is about their own professional
 * (they receive only their own notices).
 */
async function recipients(
  businessId: string,
  professionalId?: string | null,
): Promise<Recipient[]> {
  const admin = createAdminClient();
  const { data: members } = await admin
    .from("members")
    .select("user_id, role, professional_id")
    .eq("business_id", businessId);
  const targets = (members ?? []).filter(
    (m) =>
      m.role === "owner" ||
      (professionalId && m.role === "staff" && m.professional_id === professionalId),
  );
  const result: Recipient[] = [];
  for (const member of targets) {
    const { data } = await admin.auth.admin.getUserById(member.user_id as string);
    if (data.user?.email) {
      result.push({
        userId: member.user_id as string,
        email: data.user.email,
        role: member.role as Recipient["role"],
      });
    }
  }
  return result;
}

async function preferences(userIds: string[], type: OwnerNotificationType) {
  if (userIds.length === 0) return new Map<string, { email: boolean; push: boolean }>();
  const { data } = await createAdminClient()
    .from("notification_preferences")
    .select("user_id, email, push")
    .eq("type", type)
    .in("user_id", userIds);
  return new Map(
    (data ?? []).map((p) => [
      p.user_id as string,
      { email: p.email as boolean, push: p.push as boolean },
    ]),
  );
}

/**
 * E-mail + web push to the business team (rule: owners are only ever notified by e-mail and push).
 * E-mails carry the business's brand.
 */
export async function notifyTeam(input: {
  businessId: string;
  type: OwnerNotificationType;
  professionalId?: string | null;
  subject: string;
  content: EmailContent;
  push: PushPayload;
}): Promise<void> {
  const admin = createAdminClient();
  const { data: business } = await admin
    .from("businesses")
    .select("brand_key")
    .eq("id", input.businessId)
    .single();
  const brand = getNiche(business?.brand_key as string | undefined);

  // Relative links become absolute on the business's brand domain (rule 14).
  const absolute = (url: string) => (url.startsWith("/") ? brandUrl(brand, url) : url);
  const content: EmailContent = {
    ...input.content,
    cta: input.content.cta
      ? { ...input.content.cta, url: absolute(input.content.cta.url) }
      : undefined,
    secondaryLinks: input.content.secondaryLinks?.map((link) => ({
      ...link,
      url: absolute(link.url),
    })),
  };

  const people = await recipients(input.businessId, input.professionalId);
  const prefs = await preferences(
    people.map((p) => p.userId),
    input.type,
  );

  await Promise.all(
    people.map(async (person) => {
      const pref = prefs.get(person.userId) ?? { email: true, push: true };
      const tasks: Promise<unknown>[] = [];
      if (pref.email) {
        tasks.push(
          sendEmail({ brand, to: person.email, subject: input.subject, content }).catch((error) =>
            console.error("owner email failed", error),
          ),
        );
      }
      if (pref.push) {
        tasks.push(
          sendPushToUser(person.userId, input.push).catch((error) =>
            console.error("owner push failed", error),
          ),
        );
      }
      await Promise.all(tasks);
    }),
  );
}

/**
 * Sends at most once per (business, type, reference) using notification_log's unique key.
 * Returns false when it was already sent.
 */
export async function claimNotification(
  businessId: string,
  type: string,
  reference: string,
): Promise<boolean> {
  const { error } = await createAdminClient()
    .from("notification_log")
    .insert({ business_id: businessId, type, reference });
  if (!error) return true;
  if (error.code === "23505") return false;
  throw new Error(`notification_log insert failed: ${error.message}`);
}
