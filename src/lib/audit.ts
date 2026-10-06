import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

/** Sensitive actions recorded in audit_log (rule 13). */
export type AuditAction =
  | "account.deleted"
  | "business.created"
  | "business.niche_changed"
  | "business.deleted"
  | "business.suspended"
  | "business.unsuspended"
  | "data.exported"
  | "customer.deleted"
  | "customer.blocked"
  | "customer.unblocked"
  | "plan.trial_started"
  | "plan.trial_extended"
  | "plan.trial_ended"
  | "plan.changed"
  | "subscription.created"
  | "subscription.cancelled"
  | "member.invited"
  | "member.removed"
  | "professional.deleted"
  | "review.hidden"
  | "review.unhidden"
  | "photo.deleted"
  | "domain.added"
  | "domain.removed"
  | "calendar.connected"
  | "calendar.disconnected"
  | "admin.coupon_created"
  | "finance.entry_deleted";

export async function audit(entry: {
  businessId: string | null;
  userId: string | null;
  action: AuditAction;
  details?: Record<string, unknown>;
}): Promise<void> {
  const { error } = await createAdminClient()
    .from("audit_log")
    .insert({
      business_id: entry.businessId,
      user_id: entry.userId,
      action: entry.action,
      details: entry.details ?? {},
    });
  if (error) throw new Error(`Audit log failed: ${error.message}`);
}
