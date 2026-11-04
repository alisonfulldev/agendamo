import "server-only";

import { formatInTimeZone } from "date-fns-tz";

import { PLATFORM } from "@/brands";
import { sendEmail } from "@/lib/email/send";
import { getServerEnv } from "@/lib/env";
import { PLAN_NAME, TRIAL_DAYS } from "@/lib/plans";
import { siteUrl } from "@/lib/site-url";

export interface NewSignup {
  businessName: string;
  nicheName: string;
  email: string;
  whatsapp: string | null;
  pageUrl: string;
  via: "conversa" | "formulário" | "Site + Agenda (aguardando pagamento)";
  /** "used": this person already had a trial, so the account started in waiting mode. */
  /** "offer": came by the Site + Agenda link (no trial, pays first). */
  trial: "started" | "used" | "offer";
}

/**
 * Tells the platform admins (ADMIN_EMAILS) about each new business, so they know who signed up.
 * Never breaks the sign-up: a failure is only logged.
 */
export async function notifyAdminsOfSignup(signup: NewSignup): Promise<void> {
  const admins = getServerEnv().ADMIN_EMAILS;
  if (!admins.length) return;
  const when = formatInTimeZone(new Date(), "America/Sao_Paulo", "dd/MM/yyyy 'às' HH:mm");
  try {
    await sendEmail({
      brand: PLATFORM,
      to: admins,
      subject: `Novo cadastro: ${signup.businessName} (${signup.nicheName})`,
      content: {
        preheader: `${signup.businessName} acabou de criar a conta no MeetChat.`,
        heading: "Novo cadastro no MeetChat 🎉",
        paragraphs: [`${signup.businessName} acabou de criar a conta.`],
        details: [
          { label: "Negócio", value: signup.businessName },
          { label: "Área", value: signup.nicheName },
          { label: "E-mail", value: signup.email },
          { label: "WhatsApp", value: signup.whatsapp || "Não informado" },
          { label: "Link", value: signup.pageUrl },
          { label: "Quando", value: when },
          { label: "Por onde", value: signup.via },
          {
            label: "Teste",
            value:
              signup.trial === "started"
                ? `${TRIAL_DAYS} dias do ${PLAN_NAME}`
                : signup.trial === "offer"
                  ? "Sem teste (oferta Site + Agenda)"
                  : "Já usou o teste antes (sem teste)",
          },
        ],
        cta: { label: "Abrir o admin", url: siteUrl("/admin") },
      },
    });
  } catch (error) {
    console.error("admin signup e-mail failed", error);
  }
}

export interface PaidSiteOrder {
  businessName: string;
  nicheName: string;
  email: string | null;
  whatsapp: string | null;
  pageUrl: string;
  domainName: string | null;
  wantsDomain: boolean;
  dueAt: Date;
}

/** "Site + Agenda" paid: what to build, for whom and until when (e-mail to the admins). */
export async function notifyAdminsOfPaidSite(order: PaidSiteOrder): Promise<void> {
  const admins = getServerEnv().ADMIN_EMAILS;
  if (!admins.length) return;
  const due = formatInTimeZone(order.dueAt, "America/Sao_Paulo", "EEEE, dd/MM 'às' HH:mm");
  try {
    await sendEmail({
      brand: PLATFORM,
      to: admins,
      subject: `Site + Agenda pago: ${order.businessName} (até ${formatInTimeZone(order.dueAt, "America/Sao_Paulo", "dd/MM HH:mm")})`,
      content: {
        preheader: `Hora de criar o site de ${order.businessName}.`,
        heading: "Novo Site + Agenda pago 🚀",
        paragraphs: [
          `${order.businessName} pagou o Site + Agenda. Crie o site e coloque o link do chat nos botões de agendar.`,
        ],
        details: [
          { label: "Negócio", value: order.businessName },
          { label: "Área", value: order.nicheName },
          { label: "WhatsApp", value: order.whatsapp || "Não informado" },
          { label: "E-mail", value: order.email || "—" },
          { label: "Link do chat", value: order.pageUrl },
          {
            label: "Domínio",
            value: order.wantsDomain
              ? order.domainName || "Quer domínio (nome a combinar)"
              : "Não quis",
          },
          { label: "Entregar até", value: due },
        ],
        cta: { label: "Ver sites a criar", url: siteUrl("/admin/sites") },
      },
    });
  } catch (error) {
    console.error("admin paid site e-mail failed", error);
  }
}
