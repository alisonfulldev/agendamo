import { addDaysToDate, daysBetween, localToUtc, todayIn } from "@/lib/availability";
import { FREE_BOOKINGS_PER_CYCLE, FREE_CYCLE_DAYS } from "@/lib/plans";

export interface FreeCycle {
  /** First instant of the cycle (local midnight in the business timezone). */
  start: Date;
  /** First instant of the next cycle. */
  end: Date;
  /** Local dates ("YYYY-MM-DD"): first day and the day the next cycle starts. */
  startDate: string;
  endDate: string;
}

/**
 * Grátis plan: 30-day cycles counted from the sign-up date, in the business timezone, renewed
 * automatically. Cycle n covers the local days [signup + 30n, signup + 30(n+1)).
 */
export function freeCycle(createdAt: Date | string, timezone: string, now: Date): FreeCycle {
  const anchor = todayIn(timezone, new Date(createdAt));
  const today = todayIn(timezone, now);
  const index = Math.max(0, Math.floor(daysBetween(anchor, today) / FREE_CYCLE_DAYS));
  const startDate = addDaysToDate(anchor, index * FREE_CYCLE_DAYS);
  const endDate = addDaysToDate(startDate, FREE_CYCLE_DAYS);
  return {
    start: localToUtc(startDate, "00:00", timezone),
    end: localToUtc(endDate, "00:00", timezone),
    startDate,
    endDate,
  };
}

export interface BookingAllowance {
  limited: boolean;
  used: number;
  limit: number;
  remaining: number;
  /** When the limit renews (start of the next cycle); null when not limited. */
  renewsAt: Date | null;
  renewsOn: string | null;
}

export const UNLIMITED: BookingAllowance = {
  limited: false,
  used: 0,
  limit: Infinity,
  remaining: Infinity,
  renewsAt: null,
  renewsOn: null,
};

/** Allowance from the count of chat bookings in the current cycle. */
export function allowanceFrom(used: number, cycle: FreeCycle): BookingAllowance {
  return {
    limited: true,
    used,
    limit: FREE_BOOKINGS_PER_CYCLE,
    remaining: Math.max(0, FREE_BOOKINGS_PER_CYCLE - used),
    renewsAt: cycle.end,
    renewsOn: cycle.endDate,
  };
}
