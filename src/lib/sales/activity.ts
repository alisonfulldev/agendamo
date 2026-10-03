import { addDaysToDate, daysBetween } from "@/lib/availability";

export interface CustomerActivity {
  customer_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  birthdate: string | null;
  marketing_opt_in: boolean;
  blocked: boolean;
  last_appointment_id: string | null;
  last_completed_at: string | null;
  last_service_id: string | null;
  last_service_name: string | null;
  return_after_days: number | null;
  has_future: boolean;
}

/** No visit for `inactiveDays` (local date `today`), nothing booked, not blocked. */
export function isInactive(c: CustomerActivity, today: string, inactiveDays: number): boolean {
  if (c.blocked || c.has_future || !c.last_completed_at) return false;
  return daysBetween(c.last_completed_at.slice(0, 10), today) >= inactiveDays;
}

/**
 * "Hora de voltar": the last service's return interval has passed (up to 30 days late, so very old
 * customers fall into "sumiram" instead) and nothing is booked.
 */
export function isDueToReturn(c: CustomerActivity, today: string): boolean {
  if (c.blocked || c.has_future || !c.last_completed_at || !c.return_after_days) return false;
  const due = addDaysToDate(c.last_completed_at.slice(0, 10), c.return_after_days);
  const late = daysBetween(due, today);
  return late >= 0 && late <= 30;
}

/** Birthday in the given month ("MM"). */
export function hasBirthdayInMonth(c: CustomerActivity, month: string): boolean {
  return Boolean(c.birthdate && c.birthdate.slice(5, 7) === month);
}

/** Birthday today ("MM-DD"). */
export function hasBirthdayOn(c: CustomerActivity, monthDay: string): boolean {
  return Boolean(c.birthdate && c.birthdate.slice(5, 10) === monthDay);
}
