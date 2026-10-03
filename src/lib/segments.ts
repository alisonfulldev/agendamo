import type { Segment } from "@/lib/db/types";

export const SEGMENT_LABELS: Record<Segment, string> = {
  beauty: "Beleza",
  barber: "Barbearia",
  aesthetics: "Estética",
  psychology: "Psicologia",
  physio: "Fisioterapia",
  personal_trainer: "Personal trainer",
  tattoo: "Tatuagem",
};

export const WEEKDAY_LABELS = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
] as const;
export const WEEKDAY_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;
