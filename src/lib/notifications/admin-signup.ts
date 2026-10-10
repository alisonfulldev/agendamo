import "server-only";

import { formatInTimeZone } from "date-fns-tz";

import { PLATFORM } from "@/brands";
import { sendEmail } from "@/lib/email/send";
import { getServerEnv } from "@/lib/env";
import { siteUrl } from "@/lib/site-url";

export interface NewSignup {
  businessName: string;
  nicheName: string;
  email: string;
  whatsapp: string | null;
  pageUrl: string;
  via: "conversa" | "formulário";
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
        ],
        cta: { label: "Abrir o admin", url: siteUrl("/admin") },
      },
    });
  } catch (error) {
    console.error("admin signup e-mail failed", error);
  }
}
