import { PLAN_NAME, type PlanFeatures } from "@/lib/plans";

/** "Teste do Completo: faltam 3 dias", "Teste do Completo: último dia". */
export function trialCounter(features: PlanFeatures): string {
  const name = `Teste do ${PLAN_NAME}`;
  const days = features.trialDaysLeft ?? 1;
  if (days <= 1) return `${name}: último dia`;
  return `${name}: faltam ${days} dias`;
}
