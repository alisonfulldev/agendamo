import "server-only";

import type { Business } from "@/lib/db/types";
import { allowanceFrom, freeCycle, UNLIMITED, type BookingAllowance } from "@/lib/plan-cycle";
import { getPlanFeatures } from "@/lib/plans";
import { createAdminClient } from "@/lib/supabase/admin";

export type { BookingAllowance };

type UsageBusiness = Pick<Business, "id" | "plan" | "trial_ends_at" | "timezone" | "created_at"> & {
  trial_plan?: Business["trial_plan"];
  trial_started_at?: string | null;
};

/**
 * Automatic (chat) bookings left in the Grátis cycle. Subscribers and trials have no limit and
 * no counter. Cancelled bookings do not count. Always read fresh (rule 6).
 */
export async function getBookingAllowance(
  business: UsageBusiness,
  now: Date = new Date(),
): Promise<BookingAllowance> {
  if (!getPlanFeatures(business, now).limitedBookings) return UNLIMITED;
  const cycle = freeCycle(business.created_at, business.timezone, now);
  const { count, error } = await createAdminClient()
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("business_id", business.id)
    .eq("source", "chat")
    .neq("status", "cancelled")
    .gte("created_at", cycle.start.toISOString())
    .lt("created_at", cycle.end.toISOString());
  if (error) throw new Error(`booking allowance failed: ${error.message}`);
  return allowanceFrom(count ?? 0, cycle);
}
