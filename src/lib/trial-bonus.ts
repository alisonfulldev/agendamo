import "server-only";

import { audit } from "@/lib/audit";
import { claimNotification, notifyTeam } from "@/lib/notifications/owner";
import { getPlanFeatures } from "@/lib/plans";
import { createAdminClient } from "@/lib/supabase/admin";

import { LINK_BONUSES, linkBonusDays, type LinkBonus } from "./trial-bonus-shared";

/** Already-earned bonuses of a business (notification_log, one row per bonus). */
export async function earnedBonuses(businessId: string): Promise<Set<LinkBonus>> {
  const { data } = await createAdminClient()
    .from("notification_log")
    .select("type")
    .eq("business_id", businessId)
    .in(
      "type",
      LINK_BONUSES.map((b) => `bonus_${b}`),
    );
  return new Set((data ?? []).map((row) => (row.type as string).slice(6) as LinkBonus));
}

/**
 * Link bonus (2026-11-05): the first visit of a customer through the bio link (?de=bio) or the
 * WhatsApp greeting link (?de=saudacao) adds linkBonusDays to a running trial, once per bonus. The visit
 * already passed the event filters (no bots, no owner or staff signed in). Idempotent.
 */
export async function grantLinkBonus(businessId: string, bonus: LinkBonus): Promise<boolean> {
  const admin = createAdminClient();
  const { data: business } = await admin
    .from("businesses")
    .select("id, plan, plan_tier, trial_started_at, trial_ends_at, timezone, activation_demo")
    .eq("id", businessId)
    .maybeSingle();
  // Meta ad page accounts have no trial: no extra days.
  if (!business?.trial_ends_at || business.activation_demo) return false;
  const features = getPlanFeatures({
    plan: business.plan as "free" | "complete",
    trial_ends_at: business.trial_ends_at as string,
    plan_tier: business.plan_tier as "complete" | "site",
  });
  // Only while testing: it gives more time to see bookings coming in.
  if (!features.trialActive) return false;
  if (!(await claimNotification(businessId, `bonus_${bonus}`, "granted"))) return false;

  const days = linkBonusDays(business.trial_started_at as string | null);
  const current = business.trial_ends_at as string;
  const ends = new Date(new Date(current).getTime() + days * 86_400_000).toISOString();
  // Optimistic: only moves the date it read (the two bonuses never overwrite each other).
  const { data: updated, error } = await admin
    .from("businesses")
    .update({ trial_ends_at: ends })
    .eq("id", businessId)
    .eq("trial_ends_at", current)
    .select("id");
  if (error || !updated?.length) {
    // Raced with the other bonus: release the claim so the next visit grants it.
    await admin
      .from("notification_log")
      .delete()
      .eq("business_id", businessId)
      .eq("type", `bonus_${bonus}`);
    return false;
  }

  await audit({
    businessId,
    userId: null,
    action: "plan.trial_extended",
    details: { days, ends_at: ends, by: `link_bonus:${bonus}` },
  });
  const where = bonus === "bio" ? "pelo link da bio do Instagram" : "pela saudação do WhatsApp";
  await notifyTeam({
    businessId,
    type: "account",
    subject: `Você ganhou +${days} dias de teste`,
    content: {
      heading: `+${days} dias de teste para você`,
      paragraphs: [
        `Um cliente chegou ${where}. Seu link está funcionando, e o seu teste ganhou mais ${days} dias.`,
        bonus === "bio"
          ? `Coloque também o link na saudação do WhatsApp e ganhe mais ${days} dias.`
          : `Coloque também o link na bio do Instagram e ganhe mais ${days} dias.`,
      ],
      cta: { label: "Abrir meu painel", url: "/painel" },
    },
    push: {
      title: `+${days} dias de teste`,
      body: `Um cliente chegou ${where}. Seu teste ganhou mais ${days} dias.`,
      url: "/painel",
    },
  });
  return true;
}
