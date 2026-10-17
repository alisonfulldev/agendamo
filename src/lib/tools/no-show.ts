/**
 * No-show calculator (/ferramentas/calculadora-de-faltas). An estimate from the visitor's own
 * numbers: nothing here is a promise. `avoidedPercent` is the visitor's own assumption.
 */
export interface NoShowInput {
  /** Appointments booked per month. */
  appointments: number;
  /** Share that does not show up, in % (0–100). */
  noShowPercent: number;
  /** Average ticket in cents. */
  ticketCents: number;
  /** Assumption: share of the no-shows that reminders and easy rescheduling would avoid (0–100). */
  avoidedPercent: number;
}

export interface NoShowResult {
  noShowsPerMonth: number;
  lossPerMonthCents: number;
  lossPerYearCents: number;
  recoveredPerMonthCents: number;
  recoveredPerYearCents: number;
}

const clamp = (value: number, min: number, max: number) =>
  Number.isFinite(value) ? Math.min(Math.max(value, min), max) : min;

export function noShowLoss(input: NoShowInput): NoShowResult {
  const appointments = clamp(input.appointments, 0, 100_000);
  const rate = clamp(input.noShowPercent, 0, 100) / 100;
  const ticket = clamp(input.ticketCents, 0, 100_000_000);
  const avoided = clamp(input.avoidedPercent, 0, 100) / 100;
  const noShowsPerMonth = appointments * rate;
  const lossPerMonthCents = Math.round(noShowsPerMonth * ticket);
  const recoveredPerMonthCents = Math.round(lossPerMonthCents * avoided);
  return {
    noShowsPerMonth,
    lossPerMonthCents,
    lossPerYearCents: lossPerMonthCents * 12,
    recoveredPerMonthCents,
    recoveredPerYearCents: recoveredPerMonthCents * 12,
  };
}
