import "server-only";

import { getNiche } from "@/brands";
import { brandUrl } from "@/brands/urls";
import {
  ANNOUNCEMENT_CUTOFF,
  ANNOUNCEMENT_KEY,
  announcementEmail,
  type AnnouncementGroup,
} from "@/content/site-plan-announcement";
import type { Business } from "@/lib/db/types";
import { getPlanFeatures } from "@/lib/plans";
import { createAdminClient } from "@/lib/supabase/admin";

import { claimNotification, notifyTeam } from "./owner";

/** Group of an account for the announcement (null: already on "Site + Agenda"). */
export function announcementGroup(business: Business): AnnouncementGroup | null {
  const features = getPlanFeatures(business);
  if (features.trialActive) return "trial";
  if (features.subscribed) return features.tier === "site" ? null : "complete";
  return "waiting";
}

/** Accounts created before the news that did not get it yet, by group. */
export async function announcementAudience(): Promise<
  { business: Business; group: AnnouncementGroup }[]
> {
  const admin = createAdminClient();
  const [{ data }, { data: sent }] = await Promise.all([
    admin
      .from("businesses")
      .select("*")
      .is("suspended_at", null)
      .lt("created_at", ANNOUNCEMENT_CUTOFF),
    admin.from("notification_log").select("business_id").eq("type", ANNOUNCEMENT_KEY),
  ]);
  const done = new Set((sent ?? []).map((r) => r.business_id as string));
  return ((data ?? []) as Business[])
    .filter((b) => !done.has(b.id))
    .map((business) => ({ business, group: announcementGroup(business) }))
    .filter((r): r is { business: Business; group: AnnouncementGroup } => r.group !== null);
}

/**
 * Sends the one-time "Site + Agenda" e-mail (and push) in "Novidades e dicas" (one-click opt-out,
 * and whoever turned it off in Notificações does not get it). Once per business (notification_log).
 */
export async function sendAnnouncement(limit = 40): Promise<{ sent: number; left: number }> {
  const audience = await announcementAudience();
  let sent = 0;
  for (const { business, group } of audience.slice(0, limit)) {
    if (!(await claimNotification(business.id, ANNOUNCEMENT_KEY, "1"))) continue;
    const brand = getNiche(business.brand_key);
    const copy = announcementEmail(group, brandUrl(brand, `/${business.slug}/site`));
    await notifyTeam({
      businessId: business.id,
      type: "news",
      subject: copy.subject,
      content: { heading: copy.heading, paragraphs: copy.paragraphs, cta: copy.cta },
      push: { title: copy.subject, body: copy.push, url: copy.cta.url },
    });
    sent++;
  }
  return { sent, left: Math.max(0, audience.length - sent) };
}
