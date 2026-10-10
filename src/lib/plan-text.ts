import type { BookingAllowance } from "@/lib/plan-cycle";
import { PLAN_NAMES, type PlanFeatures } from "@/lib/plans";

/** "Teste do Pro: faltam 3 dias", "Teste do Agenda: último dia". */
export function trialCounter(features: PlanFeatures): string {
  const name = `Teste do ${PLAN_NAMES[features.tier]}`;
  const days = features.trialDaysLeft ?? 1;
  if (days <= 1) return `${name}: último dia`;
  return `${name}: faltam ${days} dias`;
}

/** "3 de 10 agendamentos automáticos neste ciclo". */
export function allowanceText(allowance: BookingAllowance): string {
  return `${allowance.used} de ${allowance.limit} agendamentos automáticos neste ciclo`;
}

/** "renova em 09/04". */
export function renewsText(allowance: BookingAllowance): string {
  return allowance.renewsOn
    ? `renova em ${allowance.renewsOn.slice(8, 10)}/${allowance.renewsOn.slice(5, 7)}`
    : "";
}
