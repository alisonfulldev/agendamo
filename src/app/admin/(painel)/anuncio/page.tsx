import {
  ANNOUNCEMENT_GROUP_LABEL,
  ANNOUNCEMENT_KEY,
  announcementEmail,
  type AnnouncementGroup,
} from "@/content/site-plan-announcement";
import { announcementAudience } from "@/lib/notifications/announcement";
import { createAdminClient } from "@/lib/supabase/admin";

import { AdminSection } from "../ui";
import { SendAnnouncementButton } from "./send-button";

const GROUPS: AnnouncementGroup[] = ["trial", "complete", "waiting"];

/**
 * One-time "Site + Agenda" announcement (2026-11-06): who gets it, the text of each group, and the
 * send button. Each account gets it once; "Novidades e dicas" opt-outs are respected.
 */
export default async function AdminAnnouncementPage() {
  const [audience, { count: sent }] = await Promise.all([
    announcementAudience(),
    createAdminClient()
      .from("notification_log")
      .select("id", { count: "exact", head: true })
      .eq("type", ANNOUNCEMENT_KEY),
  ]);
  const byGroup = (g: AnnouncementGroup) => audience.filter((a) => a.group === g).length;

  return (
    <>
      <h1 className="text-2xl font-bold">Anúncio do Site + Agenda</h1>
      <AdminSection
        title="Enviar"
        description={`E-mail e aviso no celular, uma vez por conta, na categoria "Novidades e dicas" (com descadastro). Já enviados: ${sent ?? 0}.`}
      >
        <ul className="mb-4 flex flex-col gap-1 text-sm">
          {GROUPS.map((g) => (
            <li key={g}>
              {ANNOUNCEMENT_GROUP_LABEL[g]}: <strong>{byGroup(g)}</strong>
            </li>
          ))}
        </ul>
        <SendAnnouncementButton count={audience.length} />
      </AdminSection>
      {GROUPS.map((g) => {
        const copy = announcementEmail(g, "https://meetchat.com.br/<negocio>/site");
        return (
          <AdminSection key={g} title={`Texto: ${ANNOUNCEMENT_GROUP_LABEL[g]}`}>
            <p className="text-sm text-muted-foreground">Assunto</p>
            <p className="mb-3 font-medium">{copy.subject}</p>
            <p className="text-sm text-muted-foreground">E-mail</p>
            <p className="font-semibold">{copy.heading}</p>
            {copy.paragraphs.map((p) => (
              <p key={p} className="mt-2 text-sm">
                {p}
              </p>
            ))}
            <p className="mt-3 text-sm">
              Botão: <strong>{copy.cta.label}</strong>
            </p>
          </AdminSection>
        );
      })}
    </>
  );
}
