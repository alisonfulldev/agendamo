import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

import { claimNotification, notifyTeam } from "./owner";

const DAY = 86_400_000;

/** What is missing on the profile, in the words of the e-mail. */
export function missingImages(
  page: { avatar_key: string | null; cover_key: string | null } | null,
) {
  return {
    avatar: !page?.avatar_key,
    cover: !page?.cover_key,
  };
}

/** Text of the reminder for what is missing (both, only the photo or only the cover). */
export function photoReminderCopy(missing: { avatar: boolean; cover: boolean }) {
  const both = missing.avatar && missing.cover;
  const what = both ? "a foto de perfil e a capa" : missing.avatar ? "a foto de perfil" : "a capa";
  return {
    subject: both
      ? "Falta só a foto para o seu perfil ficar completo"
      : missing.avatar
        ? "Coloque a foto do seu perfil"
        : "Seu perfil ainda está sem capa",
    heading: "Seu perfil fica mais bonito com foto",
    paragraphs: [
      "Quem toca no seu link vê primeiro a sua foto. Com foto de perfil e capa, o perfil ganha a cara do seu negócio e passa mais confiança para quem vai marcar.",
      `Falta ${what}. Leva um minuto: escolha qualquer foto da galeria, que o MeetChat ajusta o tamanho sozinho.`,
    ],
    push: `Falta ${what} no seu perfil. Leva um minuto.`,
  };
}

/**
 * One friendly e-mail (and push) to owners whose profile is still without a profile photo or a
 * cover, from the day after sign-up. Once per business ever (notification_log), so the accounts
 * that already exist get it once too. Owners can turn it off in Notificações ("Dicas para
 * completar o perfil").
 */
export async function sendPhotoReminders(now = Date.now()): Promise<number> {
  const admin = createAdminClient();
  const { data: businesses, error } = await admin
    .from("businesses")
    .select("id, created_at, suspended_at")
    .is("suspended_at", null)
    .lte("created_at", new Date(now - DAY).toISOString());
  if (error) throw new Error(error.message);
  const ids = (businesses ?? []).map((b) => b.id as string);
  if (ids.length === 0) return 0;
  const { data: pages } = await admin
    .from("page_settings")
    .select("business_id, avatar_key, cover_key")
    .in("business_id", ids);
  const byId = new Map((pages ?? []).map((p) => [p.business_id as string, p]));

  let sent = 0;
  for (const id of ids) {
    const page = byId.get(id) as
      { avatar_key: string | null; cover_key: string | null } | undefined;
    const missing = missingImages(page ?? null);
    if (!missing.avatar && !missing.cover) continue;
    if (!(await claimNotification(id, "photo_reminder", "1"))) continue;
    const copy = photoReminderCopy(missing);
    await notifyTeam({
      businessId: id,
      type: "profile_tips",
      subject: copy.subject,
      content: {
        heading: copy.heading,
        paragraphs: copy.paragraphs,
        cta: { label: "Colocar minha foto", url: "/painel/pagina" },
      },
      push: { title: copy.subject, body: copy.push, url: "/painel/pagina" },
    });
    sent++;
  }
  return sent;
}
