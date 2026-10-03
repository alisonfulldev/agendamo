import { DEFAULT_BRAND, getBrand } from "@/brands";
import { brandUrl } from "@/brands/urls";
import { todayIn } from "@/lib/availability";
import { cronRoute } from "@/lib/cron";
import type { Business } from "@/lib/db/types";
import { sendEmail } from "@/lib/email/send";
import { claimNotification } from "@/lib/notifications/owner";
import { getPlanFeatures } from "@/lib/plans";
import { hasBirthdayOn, isDueToReturn, type CustomerActivity } from "@/lib/sales/activity";
import { loadMarketingSettings } from "@/lib/sales/load";
import { canSendMarketing, unsubscribeUrl } from "@/lib/unsubscribe";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Daily marketing e-mails (rule 10: opt-in only, one-click unsubscribe):
 * "hora de voltar" once per completed visit, birthday once per year.
 */
export const POST = cronRoute(async () => {
  const admin = createAdminClient();
  const { data: businesses } = await admin.from("businesses").select("*").is("suspended_at", null);
  const result = { returnEmails: 0, birthdayEmails: 0 };

  for (const business of (businesses ?? []) as Business[]) {
    if (!getPlanFeatures(business).salesTools) continue;
    const brand = getBrand(business.brand_key) ?? DEFAULT_BRAND;
    const settings = await loadMarketingSettings(business.id, brand);
    if (!settings.return_email_enabled && !settings.birthday_email_enabled) continue;

    const { data } = await admin.rpc("customer_activity", { p_business_id: business.id });
    const today = todayIn(business.timezone, new Date());
    const bookUrl = brandUrl(brand, `/${business.slug}?agendar=1`);

    for (const c of (data ?? []) as CustomerActivity[]) {
      if (!c.marketing_opt_in || !c.email || c.blocked) continue;

      if (settings.return_email_enabled && isDueToReturn(c, today)) {
        if (!(await canSendMarketing(c.email, business.id))) continue;
        if (
          !(await claimNotification(
            business.id,
            "return_email",
            `${c.customer_id}:${c.last_appointment_id}`,
          ))
        )
          continue;
        await sendEmail({
          brand,
          to: c.email,
          subject: `Hora de renovar seu ${c.last_service_name ?? "atendimento"} · ${business.name}`,
          content: {
            heading: `Oi, ${c.name.split(" ")[0]}!`,
            paragraphs: [
              `Já está na hora de renovar o seu ${c.last_service_name ?? "atendimento"} com ${business.name}.`,
            ],
            cta: { label: "Escolher um horário", url: bookUrl },
            unsubscribeUrl: unsubscribeUrl(brand, c.email, business.id),
          },
        }).catch((e) => console.error(e));
        result.returnEmails++;
      }

      if (settings.birthday_email_enabled && hasBirthdayOn(c, today.slice(5))) {
        if (!(await canSendMarketing(c.email, business.id))) continue;
        if (
          !(await claimNotification(
            business.id,
            "birthday_email",
            `${c.customer_id}:${today.slice(0, 4)}`,
          ))
        )
          continue;
        await sendEmail({
          brand,
          to: c.email,
          subject: `Feliz aniversário, ${c.name.split(" ")[0]}! 🎉`,
          content: {
            heading: `Feliz aniversário, ${c.name.split(" ")[0]}!`,
            paragraphs: [
              `${business.name} deseja um dia lindo pra você.`,
              ...(settings.birthday_coupon_code
                ? [
                    `Presente: use o cupom ${settings.birthday_coupon_code} no seu próximo agendamento.`,
                  ]
                : []),
            ],
            cta: { label: "Agendar", url: bookUrl },
            unsubscribeUrl: unsubscribeUrl(brand, c.email, business.id),
          },
        }).catch((e) => console.error(e));
        result.birthdayEmails++;
      }
    }
  }
  return result;
});
